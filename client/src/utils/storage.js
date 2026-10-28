/**
 * Chat history persistence with localStorage
 */

const STORAGE_KEY = 'chatboat_conversations_v1';
const ACTIVE_CHAT_KEY = 'chatboat_active_chat_id';
const API_KEY_STORAGE = 'chatboat_custom_api_key';
const MODEL_STORAGE = 'chatboat_selected_model';

export function loadConversations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load conversations from localStorage', e);
    return [];
  }
}

export function saveConversations(conversations) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (e) {
    console.error('Failed to save conversations to localStorage', e);
  }
}

export function loadActiveChatId() {
  try {
    return localStorage.getItem(ACTIVE_CHAT_KEY) || null;
  } catch {
    return null;
  }
}

export function saveActiveChatId(id) {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_CHAT_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_CHAT_KEY);
    }
  } catch (e) {
    console.error('Failed to save active chat id', e);
  }
}

export function loadCustomApiKey() {
  try {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function saveCustomApiKey(key) {
  try {
    if (key) {
      localStorage.setItem(API_KEY_STORAGE, key);
    } else {
      localStorage.removeItem(API_KEY_STORAGE);
    }
  } catch (e) {
    console.error('Failed to save custom api key', e);
  }
}

export function loadSelectedModel() {
  try {
    return localStorage.getItem(MODEL_STORAGE) || 'gemini-1.5-flash';
  } catch {
    return 'gemini-1.5-flash';
  }
}

export function saveSelectedModel(model) {
  try {
    localStorage.setItem(MODEL_STORAGE, model);
  } catch (e) {
    console.error('Failed to save selected model', e);
  }
}

export function generateId() {
  return 'chat_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}
