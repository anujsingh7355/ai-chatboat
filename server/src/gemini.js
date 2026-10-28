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
 * Uses environment variable GEMINI_API_KEY or key passed dynamically
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
 * Expects array of { role: 'user' | 'assistant' | 'model', content: string }
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
 * Stream chat completion from Gemini
 */
export async function* streamChatCompletion({
  messages,
  model = process.env.DEFAULT_MODEL || 'gemini-1.5-flash',
  customApiKey = null,
  temperature = 0.7,
}) {
  const genAI = getGeminiClient(customApiKey);

  // Validate model name fallback
  const validModel = model && model.trim() ? model.trim() : 'gemini-1.5-flash';

  const generativeModel = genAI.getGenerativeModel({
    model: validModel,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature,
    },
  });

  // Separate conversation history from current message
  const history = formatChatHistory(messages.slice(0, -1));
  const latestMessage = messages[messages.length - 1];

  if (!latestMessage || !latestMessage.content) {
    throw new Error('Latest message is required');
  }

  // Create chat session with previous messages
  const chat = generativeModel.startChat({
    history,
  });

  try {
    const resultStream = await chat.sendMessageStream(latestMessage.content);

    for await (const chunk of resultStream.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  } catch (err) {
    throw parseGeminiError(err);
  }
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
  const validModel = model && model.trim() ? model.trim() : 'gemini-1.5-flash';

  const generativeModel = genAI.getGenerativeModel({
    model: validModel,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature,
    },
  });

  const history = formatChatHistory(messages.slice(0, -1));
  const latestMessage = messages[messages.length - 1];

  if (!latestMessage || !latestMessage.content) {
    throw new Error('Latest message is required');
  }

  const chat = generativeModel.startChat({ history });

  try {
    const result = await chat.sendMessage(latestMessage.content);
    return result.response.text();
  } catch (err) {
    throw parseGeminiError(err);
  }
}

/**
 * Translates low-level SDK errors into user-friendly diagnostic messages
 */
export function parseGeminiError(error) {
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
    const err = new Error(`The requested model is not available or unsupported for this API key. Try switching to 'gemini-1.5-flash'.`);
    err.status = 404;
    err.code = 'MODEL_NOT_FOUND';
    return err;
  }

  return error;
}
