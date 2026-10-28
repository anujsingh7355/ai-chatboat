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
 * Candidate models to try in fallback order if one is unavailable
 */
export const FALLBACK_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-pro',
];

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
 * Fetches available models directly from Google Generative Language API
 */
export async function fetchGoogleModels(customApiKey = null) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    return null;
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.models) return null;

    // Filter models that support content generation
    return data.models
      .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m) => {
        const id = m.name.replace(/^models\//, '');
        return {
          id,
          name: m.displayName || id,
          description: m.description || '',
          recommended: id.includes('flash'),
        };
      });
  } catch (err) {
    console.warn('Failed to fetch dynamic models from Google API:', err.message);
    return null;
  }
}

/**
 * Stream chat completion from Gemini with automatic model fallback
 */
export async function* streamChatCompletion({
  messages,
  model = process.env.DEFAULT_MODEL || 'gemini-1.5-flash',
  customApiKey = null,
  temperature = 0.7,
}) {
  const genAI = getGeminiClient(customApiKey);

  // Build candidate models order
  const candidates = Array.from(new Set([
    model,
    ...FALLBACK_MODELS,
  ].filter(Boolean)));

  const history = formatChatHistory(messages.slice(0, -1));
  const latestMessage = messages[messages.length - 1];

  if (!latestMessage || !latestMessage.content) {
    throw new Error('Latest message is required');
  }

  let lastError = null;

  for (const candidateModel of candidates) {
    try {
      console.log(`[Gemini] Attempting generation with model: "${candidateModel}"...`);

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

      // Success! Exit candidate loop
      return;
    } catch (err) {
      console.warn(`[Gemini] Model "${candidateModel}" failed: ${err.message}`);
      lastError = err;

      // If error is 404 / model not found, try next candidate model
      const isNotFound = err.message?.includes('not found') || err.status === 404 || err.message?.includes('models/');
      if (isNotFound) {
        continue;
      }

      // For auth or quota errors, don't keep retrying other models
      throw parseGeminiError(err, candidateModel);
    }
  }

  // If all candidate models failed
  throw parseGeminiError(lastError, model);
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
  const genAI = getGeminiClient(customApiKey);

  const candidates = Array.from(new Set([
    model,
    ...FALLBACK_MODELS,
  ].filter(Boolean)));

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
      const isNotFound = err.message?.includes('not found') || err.status === 404 || err.message?.includes('models/');
      if (isNotFound) {
        continue;
      }
      throw parseGeminiError(err, candidateModel);
    }
  }

  throw parseGeminiError(lastError, model);
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
    const err = new Error(`Model "${attemptedModel || 'gemini-1.5-flash'}" is currently unavailable for this API key. Detail: ${message}`);
    err.status = 404;
    err.code = 'MODEL_NOT_FOUND';
    return err;
  }

  return error;
}
