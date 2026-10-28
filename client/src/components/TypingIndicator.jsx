import React from 'react';

export default function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1.5 py-2 px-1 text-gray-400">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      <span className="text-xs text-gray-400 ml-2 font-medium">Thinking...</span>
    </div>
  );
}
