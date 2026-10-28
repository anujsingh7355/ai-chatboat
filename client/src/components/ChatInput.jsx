import React, { useRef, useEffect } from 'react';
import { ArrowUp, Square } from 'lucide-react';

export default function ChatInput({
  input,
  setInput,
  onSend,
  onStop,
  isLoading,
  disabled,
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-3 sm:pb-5">
      <div className="relative rounded-2xl bg-chatgpt-input-light dark:bg-chatgpt-input-dark border border-gray-200 dark:border-gray-700/70 shadow-sm focus-within:border-gray-400 dark:focus-within:border-gray-500 focus-within:ring-1 focus-within:ring-gray-300 dark:focus-within:ring-gray-600 transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message ChatGPT..."
          rows={1}
          disabled={disabled}
          className="w-full py-3.5 pl-4 pr-12 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base resize-none focus:outline-none max-h-48 overflow-y-auto leading-relaxed"
        />

        {/* Action Button: Send or Stop */}
        <div className="absolute right-2.5 bottom-2.5">
          {isLoading ? (
            <button
              onClick={onStop}
              type="button"
              className="p-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-85 transition-opacity flex items-center justify-center shadow"
              title="Stop generating"
              aria-label="Stop generating"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={onSend}
              disabled={!input.trim() || disabled}
              type="button"
              className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                input.trim() && !disabled
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow hover:opacity-85'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }`}
              title="Send message (Enter)"
              aria-label="Send message"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Subtext disclaimer */}
      <p className="text-[11px] sm:text-xs text-center text-gray-400 dark:text-gray-500 mt-2 select-none">
        ChatGPT can make mistakes. Verify important information.
      </p>
    </div>
  );
}
