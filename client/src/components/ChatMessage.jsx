import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check, RotateCcw, Bot, User, AlertCircle } from 'lucide-react';

function CodeBlock({ children, className, ...props }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeContent = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code', err);
    }
  };

  if (!language && !className) {
    return <code className="bg-gray-100 dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>;
  }

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-[#1e1e1e] text-gray-100 text-sm shadow-md">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-gray-800 text-xs font-mono text-gray-400">
        <span className="font-semibold uppercase tracking-wider">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center space-x-1.5 px-2 py-1 rounded hover:bg-gray-700/60 text-gray-300 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <div className="p-4 overflow-x-auto font-mono text-sm leading-relaxed">
        <code className={className} {...props}>
          {children}
        </code>
      </div>
    </div>
  );
}

export default function ChatMessage({
  message,
  onRegenerate,
  isLatestAssistant,
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isError = Boolean(message.isError);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message', err);
    }
  };

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      className={`w-full py-4 px-3 sm:px-6 transition-colors group ${
        isUser
          ? 'bg-transparent'
          : 'bg-gray-50/60 dark:bg-[#1a1a1a]/50 border-y border-black/5 dark:border-white/5'
      }`}
    >
      <div className="max-w-3xl mx-auto flex items-start space-x-3.5 sm:space-x-4">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-500/20">
              <Bot className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Content Container */}
        <div className="flex-1 min-w-0">
          {/* Header info */}
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              {isUser ? 'You' : 'ChatGPT'}
            </span>
            {message.model && !isUser && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {message.model}
              </span>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formattedTime}
            </span>
          </div>

          {/* Body */}
          <div
            className={`text-sm sm:text-base leading-relaxed break-words markdown-content ${
              isError
                ? 'text-red-500 dark:text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20'
                : 'text-gray-800 dark:text-gray-200'
            }`}
          >
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code: CodeBlock,
                  a: ({ node, ...props }) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-500 transition-colors"
                    />
                  ),
                }}
              >
                {message.content || (message.isStreaming ? ' ' : '')}
              </ReactMarkdown>
            )}

            {/* Blinking cursor while actively streaming */}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-emerald-500 animate-pulse align-middle" />
            )}
          </div>

          {/* Action Toolbar */}
          {!message.isStreaming && message.content && (
            <div className="flex items-center space-x-2 mt-3 pt-1 text-gray-400 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopyMessage}
                type="button"
                className="flex items-center space-x-1 text-xs px-2 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Copy message"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {!isUser && isLatestAssistant && onRegenerate && (
                <button
                  onClick={() => onRegenerate(message.id)}
                  type="button"
                  className="flex items-center space-x-1 text-xs px-2 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="Regenerate response"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
