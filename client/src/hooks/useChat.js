import { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadConversations,
  saveConversations,
  loadActiveChatId,
  saveActiveChatId,
  loadCustomApiKey,
  saveCustomApiKey,
  loadSelectedModel,
  saveSelectedModel,
  generateId,
} from '../utils/storage';

export function useChat() {
  const [conversations, setConversations] = useState(() => loadConversations());
  const [activeChatId, setActiveChatId] = useState(() => loadActiveChatId());
  const [selectedModel, setSelectedModel] = useState(() => loadSelectedModel());
  const [customApiKey, setCustomApiKey] = useState(() => loadCustomApiKey());
  const [models, setModels] = useState([]);
  const [serverHealth, setServerHealth] = useState({ ok: false, hasApiKey: false });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const abortControllerRef = useRef(null);

  // Sync conversations to localStorage
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // Sync activeChatId to localStorage
  useEffect(() => {
    saveActiveChatId(activeChatId);
  }, [activeChatId]);

  // Sync model selection to localStorage
  useEffect(() => {
    saveSelectedModel(selectedModel);
  }, [selectedModel]);

  // Sync custom API key
  useEffect(() => {
    saveCustomApiKey(customApiKey);
  }, [customApiKey]);

  // Fetch server health & available models on load
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setServerHealth({ ok: true, hasApiKey: data.hasApiKey });
      } else {
        setServerHealth({ ok: false, hasApiKey: false });
      }
    } catch {
      setServerHealth({ ok: false, hasApiKey: false });
    }
  }, []);

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch('/api/models');
      if (res.ok) {
        const data = await res.json();
        setModels(data.models || []);
      }
    } catch (e) {
      console.warn('Failed to fetch models list', e);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    fetchModels();
  }, [checkHealth, fetchModels]);

  // Active chat getter
  const activeChat = conversations.find((c) => c.id === activeChatId) || null;

  // Create new conversation
  const createNewChat = useCallback(() => {
    const newChat = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      model: selectedModel,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setConversations((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setErrorMessage(null);
    return newChat;
  }, [selectedModel]);

  // Switch active chat
  const selectChat = useCallback((id) => {
    setActiveChatId(id);
    setErrorMessage(null);
  }, []);

  // Delete chat
  const deleteChat = useCallback((id) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      return filtered;
    });
    setActiveChatId((curr) => {
      if (curr === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        return remaining.length > 0 ? remaining[0].id : null;
      }
      return curr;
    });
  }, [conversations]);

  // Rename conversation title
  const renameChat = useCallback((id, newTitle) => {
    if (!newTitle || !newTitle.trim()) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle.trim(), updatedAt: new Date().toISOString() } : c))
    );
  }, []);

  // Clear all conversations
  const clearAllChats = useCallback(() => {
    setConversations([]);
    setActiveChatId(null);
    setErrorMessage(null);
  }, []);

  // Clear messages in the current chat
  const clearCurrentChat = useCallback(() => {
    if (!activeChatId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, messages: [], updatedAt: new Date().toISOString() } : c))
    );
    setErrorMessage(null);
  }, [activeChatId]);

  // Stop generation
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  // Send message with streaming
  const sendMessage = async (textContent) => {
    if (!textContent || !textContent.trim() || isLoading) return;

    const trimmed = textContent.trim();
    setErrorMessage(null);

    // Target chat
    let currentId = activeChatId;
    let targetChat = conversations.find((c) => c.id === currentId);

    if (!targetChat) {
      const created = createNewChat();
      currentId = created.id;
      targetChat = created;
    }

    const isFirstMessage = targetChat.messages.length === 0;
    const generatedTitle = isFirstMessage
      ? trimmed.length > 32
        ? trimmed.substring(0, 32) + '...'
        : trimmed
      : targetChat.title;

    const userMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    const assistantMessageId = generateId();
    const assistantMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      model: selectedModel,
      createdAt: new Date().toISOString(),
      isStreaming: true,
    };

    // Optimistically update conversation
    const updatedMessages = [...targetChat.messages, userMessage, assistantMessage];
    setConversations((prev) =>
      prev.map((c) =>
        c.id === currentId
          ? {
              ...c,
              title: generatedTitle,
              messages: updatedMessages,
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );

    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (customApiKey) {
        headers['X-Gemini-API-Key'] = customApiKey;
      }

      // Prepare context messages for the API (only user/assistant roles)
      const contextMessages = updatedMessages
        .slice(0, -1) // omit the empty streaming assistant message
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: contextMessages,
          model: selectedModel,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errData;
        try {
          errData = await response.json();
        } catch {
          errData = { error: `Server error: ${response.status} ${response.statusText}` };
        }
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // keep remainder

        for (const block of lines) {
          const trimmedLine = block.trim();
          if (!trimmedLine.startsWith('data:')) continue;

          const jsonStr = trimmedLine.replace(/^data:\s*/, '');
          try {
            const data = JSON.parse(jsonStr);

            if (data.error) {
              throw new Error(data.error);
            }

            if (data.chunk) {
              accumulatedText += data.chunk;
              const currentChunk = accumulatedText;
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === currentId
                    ? {
                        ...c,
                        messages: c.messages.map((m) =>
                          m.id === assistantMessageId
                            ? { ...m, content: currentChunk, isStreaming: true }
                            : m
                        ),
                      }
                    : c
                )
              );
            }

            if (data.done) {
              break;
            }
          } catch (parseErr) {
            if (parseErr.message && !parseErr.message.includes('JSON')) {
              throw parseErr;
            }
          }
        }
      }

      // Finalize message status
      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: accumulatedText, isStreaming: false }
                    : m
                ),
              }
            : c
        )
      );
    } catch (err) {
      if (err.name === 'AbortError') {
        // User clicked stop generation
        setConversations((prev) =>
          prev.map((c) =>
            c.id === currentId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          content: (m.content || '') + ' _[Generation stopped by user]_',
                          isStreaming: false,
                        }
                      : m
                  ),
                }
              : c
          )
        );
      } else {
        console.error('Chat error:', err);
        const errMsg = err.message || 'Failed to get AI response. Please check your connection or API key.';
        setErrorMessage(errMsg);

        // Update assistant message to show error
        setConversations((prev) =>
          prev.map((c) =>
            c.id === currentId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          content: `⚠️ **Error**: ${errMsg}`,
                          isError: true,
                          isStreaming: false,
                        }
                      : m
                  ),
                }
              : c
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Regenerate last response or specific assistant message
  const regenerateResponse = useCallback(
    async (messageId) => {
      if (!activeChat || isLoading) return;

      const msgIndex = activeChat.messages.findIndex((m) => m.id === messageId);
      if (msgIndex === -1) return;

      // Find preceding user prompt
      let userPrompt = '';
      for (let i = msgIndex - 1; i >= 0; i--) {
        if (activeChat.messages[i].role === 'user') {
          userPrompt = activeChat.messages[i].content;
          break;
        }
      }

      if (!userPrompt) return;

      // Slice conversation to remove this assistant message and any subsequent messages
      const truncatedMessages = activeChat.messages.slice(0, msgIndex);
      setConversations((prev) =>
        prev.map((c) => (c.id === activeChat.id ? { ...c, messages: truncatedMessages } : c))
      );

      // Re-send
      setTimeout(() => {
        sendMessage(userPrompt);
      }, 50);
    },
    [activeChat, isLoading]
  );

  return {
    conversations,
    activeChat,
    activeChatId,
    selectedModel,
    setSelectedModel,
    models,
    customApiKey,
    setCustomApiKey,
    serverHealth,
    checkHealth,
    isLoading,
    errorMessage,
    createNewChat,
    selectChat,
    deleteChat,
    renameChat,
    clearAllChats,
    clearCurrentChat,
    sendMessage,
    regenerateResponse,
    stopGeneration,
  };
}
