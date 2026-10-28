import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Clean and format system prompt for Gemini
 */
export const SYSTEM_INSTRUCTION = `You are an advanced, intelligent AI assistant designed in the style of ChatGPT.
Your responses should be:
- Helpful, accurate, clear, and well-structured.
- Formatted with clean Markdown: use headers, bullet points, bold/italics, and tables where appropriate.
- When writing code, always specify the programming language in fenced code blocks (e.g. \`\`\`python, \`\`\`javascript).
- Maintain a polite, empathetic, and professional tone.
- When answering complex technical or mathematical questions, provide step-by-step explanations.`;

/**
 * Initialize Google Generative AI client
 */
export function getGeminiClient(customApiKey = null) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    const error = new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in server/.env or configure it in the app settings.');
    error.status = 401;
    error.code = 'MISSING_API_KEY';
    throw error;
  }
  return new GoogleGenerativeAI(apiKey.trim());
}

/**
 * Formats chat message history for the Gemini SDK
 */
export function formatChatHistory(messages = []) {
  return messages.map((msg) => {
    const role = msg.role === 'assistant' ? 'model' : 'user';
    return {
      role,
      parts: [{ text: msg.content || '' }],
    };
  });
}

/**
 * Cache for available models per API key
 */
const modelsCache = new Map();

/**
 * Fetches available models directly from Google's ModelService.ListModels API
 * This guarantees we ONLY call models that actually exist and are supported for this key!
 */
export async function getValidModelsForApiKey(apiKey) {
  if (!apiKey) return [];

  const trimmedKey = apiKey.trim();
  if (modelsCache.has(trimmedKey)) {
    return modelsCache.get(trimmedKey);
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${trimmedKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[Gemini ListModels] HTTP ${res.status}: ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    if (!data.models || !Array.isArray(data.models)) {
      return [];
    }

    // Filter to models that support content generation
    const valid = data.models
      .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m) => m.name.replace(/^models\//, ''));

    console.log(`[Gemini] Discovered ${valid.length} supported models for this API key:`, valid);
    modelsCache.set(trimmedKey, valid);
    return valid;
  } catch (err) {
    console.warn('[Gemini] Failed to fetch ListModels from Google:', err.message);
    return [];
  }
}

/**
 * Resolves the best available model for this specific API key
 */
export async function resolveBestModel(requestedModel, apiKey) {
  const availableModels = await getValidModelsForApiKey(apiKey);

  if (availableModels.length === 0) {
    // If ListModels failed or returned empty, return fallback list
    return [
      requestedModel,
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash-001',
      'gemini-1.5-flash-002',
      'gemini-1.5-pro',
      'gemini-1.5-pro-latest',
    ].filter(Boolean);
  }

  // If the requested model is directly in the available list, prioritize it
  if (availableModels.includes(requestedModel)) {
    return [requestedModel, ...availableModels.filter((m) => m !== requestedModel)];
  }

  // Otherwise, look for the closest matching model (e.g. contains 'flash')
  const flashMatch = availableModels.find((m) => m.includes('flash') && !m.includes('8b'));
  const anyFlash = availableModels.find((m) => m.includes('flash'));
  const proMatch = availableModels.find((m) => m.includes('pro'));

  const ordered = [
    flashMatch,
    anyFlash,
    proMatch,
    ...availableModels,
  ].filter(Boolean);

  const unique = Array.from(new Set(ordered));
  console.log(`[Gemini] Resolved model priority for "${requestedModel}":`, unique);
  return unique;
}

/**
 * Public function to fetch models for the frontend models dropdown
 */
export async function fetchGoogleModels(customApiKey = null) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    return null;
  }

  const modelIds = await getValidModelsForApiKey(apiKey);
  if (modelIds.length === 0) return null;

  return modelIds.map((id) => ({
    id,
    name: formatModelDisplayName(id),
    recommended: id.includes('flash'),
    description: `Google Generative AI ${id}`,
  }));
}

function formatModelDisplayName(id) {
  if (id.includes('2.0-flash')) return 'Gemini 2.0 Flash';
  if (id.includes('1.5-flash')) return 'Gemini 1.5 Flash';
  if (id.includes('1.5-pro')) return 'Gemini 1.5 Pro';
  return id;
}

/**
 * Stream chat completion from Gemini with dynamic ListModels resolution
 */
export async function* streamChatCompletion({
  messages,
  model = process.env.DEFAULT_MODEL || 'gemini-1.5-flash',
  customApiKey = null,
  temperature = 0.7,
}) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  const genAI = getGeminiClient(customApiKey);

  // Dynamically resolve models using Google's ListModels
  const candidates = await resolveBestModel(model, apiKey);

  const history = formatChatHistory(messages.slice(0, -1));
  const latestMessage = messages[messages.length - 1];

  if (!latestMessage || !latestMessage.content) {
    throw new Error('Latest message is required');
  }

  let lastError = null;

  for (const candidateModel of candidates) {
    try {
      console.log(`[Gemini] Generating stream with model: "${candidateModel}"...`);

      const generativeModel = genAI.getGenerativeModel({
        model: candidateModel,
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { temperature },
      });

      const chat = generativeModel.startChat({ history });
      const resultStream = await chat.sendMessageStream(latestMessage.content);

      for await (const chunk of resultStream.stream) {
        const text = chunk.text();
        if (text) {
          yield text;
        }
      }

      // Succeeded!
      return;
    } catch (err) {
      console.warn(`[Gemini] Model "${candidateModel}" error:`, err.message);
      lastError = err;

      const isNotFound =
        err.message?.includes('not found') ||
        err.status === 404 ||
        err.message?.includes('models/');

      if (isNotFound) {
        continue; // Try next dynamically discovered model
      }

      // If it's quota, safety, or authentication error, throw right away
      throw parseGeminiError(err, candidateModel);
    }
  }

  throw parseGeminiError(lastError, candidates[0] || model);
}

/**
 * Standard non-streaming chat completion fallback
 */
export async function getChatCompletion({
  messages,
  model = process.env.DEFAULT_MODEL || 'gemini-1.5-flash',
  customApiKey = null,
  temperature = 0.7,
}) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  const genAI = getGeminiClient(customApiKey);
  const candidates = await resolveBestModel(model, apiKey);

  const history = formatChatHistory(messages.slice(0, -1));
  const latestMessage = messages[messages.length - 1];

  if (!latestMessage || !latestMessage.content) {
    throw new Error('Latest message is required');
  }

  let lastError = null;

  for (const candidateModel of candidates) {
    try {
      const generativeModel = genAI.getGenerativeModel({
        model: candidateModel,
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { temperature },
      });

      const chat = generativeModel.startChat({ history });
      const result = await chat.sendMessage(latestMessage.content);
      return result.response.text();
    } catch (err) {
      lastError = err;
      const isNotFound =
        err.message?.includes('not found') ||
        err.status === 404 ||
        err.message?.includes('models/');

      if (isNotFound) {
        continue;
      }
      throw parseGeminiError(err, candidateModel);
    }
  }

  throw parseGeminiError(lastError, candidates[0] || model);
}

/**
 * Translates low-level SDK errors into user-friendly diagnostic messages
 */
export function parseGeminiError(error, attemptedModel = '') {
  const message = error.message || '';

  if (message.includes('API_KEY_INVALID') || message.includes('API key not valid')) {
    const err = new Error('Invalid Gemini API Key. Please verify your key at https://aistudio.google.com/app/apikey');
    err.status = 401;
    err.code = 'INVALID_API_KEY';
    return err;
  }

  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('quota') || message.includes('429')) {
    const err = new Error('Gemini API quota exceeded or rate limit reached. Please wait a moment before trying again.');
    err.status = 429;
    err.code = 'RATE_LIMIT_EXCEEDED';
    return err;
  }

  if (message.includes('SAFETY') || message.includes('blocked')) {
    const err = new Error('The response was flagged or blocked by Gemini safety filters.');
    err.status = 400;
    err.code = 'SAFETY_VIOLATION';
    return err;
  }

  if (message.includes('models/') && message.includes('not found')) {
    const err = new Error(`None of the models available on this API key could be reached. Error: ${message}`);
    err.status = 404;
    err.code = 'MODEL_NOT_FOUND';
    return err;
  }

  return error;
}
