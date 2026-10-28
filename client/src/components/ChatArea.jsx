import React, { useRef, useEffect, useState } from 'react';
import {
  Menu,
  Sparkles,
  Key,
  Trash2,
  ChevronDown,
  ArrowDown,
  Plus,
} from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import EmptyState from './EmptyState';
import TypingIndicator from './TypingIndicator';

export default function ChatArea({
  activeChat,
  onSendMessage,
  onStopGeneration,
  onRegenerate,
  onClearChat,
  onNewChat,
  isLoading,
  errorMessage,
  selectedModel,
  onSelectModel,
  models,
  onToggleSidebar,
  onOpenApiKeyModal,
  serverHealth,
  customApiKey,
}) {
  const [input, setInput] = useState('');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom(isLoading ? 'auto' : 'smooth');
  }, [activeChat?.messages, isLoading]);

  // Track scroll position to display "Scroll to bottom" button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 160;
    setShowScrollBottom(isUp);
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    onSendMessage(text);
  };

  const handleSelectPrompt = (promptText) => {
    onSendMessage(promptText);
  };

  const messages = activeChat?.messages || [];
  const hasMessages = messages.length > 0;
  const hasKey = serverHealth.hasApiKey || Boolean(customApiKey);

  // Find active model details
  const currentModelObj = models.find((m) => m.id === selectedModel) || {
    id: selectedModel,
    name: selectedModel || 'Gemini 1.5 Flash',
  };

  return (
    <main className="flex-1 flex flex-col h-full min-w-0 bg-chatgpt-main-light dark:bg-chatgpt-main-dark text-gray-900 dark:text-gray-100 relative">
      {/* Top Header Bar */}
      <header className="h-14 shrink-0 flex items-center justify-between px-3 sm:px-4 border-b border-gray-200/60 dark:border-gray-800/60 bg-white/70 dark:bg-[#212121]/70 backdrop-blur-md z-10">
        <div className="flex items-center space-x-2">
          {/* Hamburger toggle */}
          <button
            onClick={onToggleSidebar}
            type="button"
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-chatgpt-hover-dark transition-colors"
            title="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Model Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setModelDropdownOpen((prev) => !prev)}
              type="button"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-chatgpt-hover-dark transition-colors text-sm font-semibold text-gray-800 dark:text-gray-200"
            >
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>{currentModelObj.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {modelDropdownOpen && (
              <>
                <div
                  onClick={() => setModelDropdownOpen(false)}
                  className="fixed inset-0 z-20"
                />
                <div className="absolute left-0 mt-1 w-64 bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-30 py-1.5 animate-fade-in">
                  <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Select Model
                  </div>
                  {models.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onSelectModel(m.id);
                        setModelDropdownOpen(false);
                      }}
                      type="button"
                      className={`w-full px-3 py-2 text-left text-xs transition-colors flex flex-col ${
                        selectedModel === m.id
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{m.name}</span>
                        {m.recommended && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 rounded font-normal">
                            Default
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
                        {m.description}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right header controls */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* API Key Status Pill */}
          <button
            onClick={onOpenApiKeyModal}
            type="button"
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              hasKey
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 animate-pulse'
            }`}
            title="Configure Gemini API Key"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {hasKey ? 'Gemini Ready' : 'Add API Key'}
            </span>
          </button>

          {/* Clear chat button */}
          {hasMessages && (
            <button
              onClick={onClearChat}
              type="button"
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-chatgpt-hover-dark transition-colors"
              title="Clear current chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* New chat button (mobile/tablet quick access) */}
          <button
            onClick={onNewChat}
            type="button"
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-chatgpt-hover-dark transition-colors md:hidden"
            title="New Chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Messages Scroll Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto flex flex-col"
      >
        {!hasMessages ? (
          <EmptyState onSelectPrompt={handleSelectPrompt} />
        ) : (
          <div className="flex-1 py-4">
            {messages.map((message, index) => {
              const isLast = index === messages.length - 1;
              const isAssistant = message.role === 'assistant';
              return (
                <ChatMessage
                  key={message.id || index}
                  message={message}
                  isLatestAssistant={isAssistant && isLast}
                  onRegenerate={onRegenerate}
                />
              );
            })}

            {/* Show typing indicator while loading if not yet streaming content */}
            {isLoading &&
              messages.length > 0 &&
              messages[messages.length - 1].role === 'assistant' &&
              !messages[messages.length - 1].content && (
                <div className="max-w-3xl mx-auto px-4 py-2">
                  <TypingIndicator />
                </div>
              )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          type="button"
          className="absolute right-6 bottom-28 z-20 p-2.5 rounded-full bg-white dark:bg-[#303030] border border-gray-200 dark:border-gray-700 shadow-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#383838] transition-all"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Error banner if present */}
      {errorMessage && (
        <div className="max-w-3xl mx-auto w-full px-4 mb-2">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
            <span>{errorMessage}</span>
            {!hasKey && (
              <button
                onClick={onOpenApiKeyModal}
                className="ml-3 px-2 py-1 bg-red-600 text-white rounded font-medium hover:bg-red-700 shrink-0"
              >
                Set Key
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input Field */}
      <ChatInput
        input={input}
        setInput={setInput}
        onSend={handleSend}
        onStop={onStopGeneration}
        isLoading={isLoading}
      />
    </main>
  );
}
