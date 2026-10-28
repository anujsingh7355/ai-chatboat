import { Router } from 'express';
import {
  streamChatCompletion,
  getChatCompletion,
  getGeminiClient,
} from '../gemini.js';

const router = Router();

// Available Gemini models configuration
const SUPPORTED_MODELS = [
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    tag: 'Fast & Versatile',
    recommended: true,
    description: 'High speed, balanced intelligence, and low latency for everyday tasks.',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    tag: 'Complex Reasoning',
    recommended: false,
    description: 'Highest capability for complex reasoning, multi-step code, and math.',
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash (Exp)',
    tag: 'Next-Gen Speed',
    recommended: false,
    description: 'Next-generation multimodal model with state-of-the-art response speed.',
  },
];

/**
 * GET /api/models
 * Returns the list of supported Gemini models
 */
router.get('/models', (req, res) => {
  res.json({
    models: SUPPORTED_MODELS,
    defaultModel: process.env.DEFAULT_MODEL || 'gemini-1.5-flash',
  });
});

/**
 * GET /api/health
 * Health check & status endpoint
 */
router.get('/health', (req, res) => {
  const hasEnvKey = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim() !== '' &&
    process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  );

  res.json({
    status: 'ok',
    hasApiKey: hasEnvKey,
    defaultModel: process.env.DEFAULT_MODEL || 'gemini-1.5-flash',
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/chat
 * Handles chat requests with Server-Sent Events (SSE) streaming or JSON response
 */
router.post('/chat', async (req, res, next) => {
  const { messages, model, stream = true, temperature } = req.body;

  // Custom key from request header if user provided one in the frontend modal
  const customApiKey = req.headers['x-gemini-api-key'] || null;

  // Input validation
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: 'Invalid request: "messages" must be a non-empty array of message objects.',
    });
  }

  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || !lastMsg.content || typeof lastMsg.content !== 'string' || !lastMsg.content.trim()) {
    return res.status(400).json({
      error: 'The last message content cannot be empty.',
    });
  }

  // Handle SSE streaming
  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering (Nginx, Vite)
    res.flushHeaders?.();

    let clientDisconnected = false;
    req.on('close', () => {
      clientDisconnected = true;
    });

    try {
      const generator = streamChatCompletion({
        messages,
        model,
        customApiKey,
        temperature,
      });

      for await (const chunk of generator) {
        if (clientDisconnected) break;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }

      if (!clientDisconnected) {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      }
    } catch (err) {
      console.error('Error in chat stream:', err.message);
      if (!res.headersSent) {
        return res.status(err.status || 500).json({
          error: err.message || 'An error occurred while streaming response.',
          code: err.code || 'STREAM_ERROR',
        });
      }
      res.write(
        `data: ${JSON.stringify({
          error: err.message || 'An error occurred during response generation.',
          code: err.code || 'STREAM_ERROR',
          done: true,
        })}\n\n`
      );
      res.end();
    }
    return;
  }

  // Handle standard non-streaming response
  try {
    const reply = await getChatCompletion({
      messages,
      model,
      customApiKey,
      temperature,
    });

    res.json({
      role: 'assistant',
      content: reply,
      model: model || process.env.DEFAULT_MODEL || 'gemini-1.5-flash',
    });
  } catch (err) {
    console.error('Error in non-streaming chat:', err.message);
    res.status(err.status || 500).json({
      error: err.message || 'Failed to generate response.',
      code: err.code || 'CHAT_ERROR',
    });
  }
});

export default router;
