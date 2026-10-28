import React from 'react';
import { Code2, Sparkles, Lightbulb, Compass, MessageSquare } from 'lucide-react';

const SUGGESTIONS = [
  {
    icon: Code2,
    category: 'Code',
    title: 'Write a Python script',
    prompt: 'Write a clean Python script that fetches real-time cryptocurrency prices from a public API and prints a summary table.',
  },
  {
    icon: Sparkles,
    category: 'Explain',
    title: 'Quantum computing simply',
    prompt: 'Explain the core principles of quantum computing and qubits to someone with no physics background.',
  },
  {
    icon: Lightbulb,
    category: 'Brainstorm',
    title: 'Modern web app ideas',
    prompt: 'Brainstorm 5 innovative, useful web application ideas that solve real everyday problems using modern AI tools.',
  },
  {
    icon: Compass,
    category: 'Write',
    title: 'Professional email draft',
    prompt: 'Draft a polite and concise email requesting feedback on a recent project proposal from my team lead.',
  },
];

export default function EmptyState({ onSelectPrompt }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-2xl mx-auto my-auto animate-fade-in">
      {/* ChatGPT / AI Icon */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mb-5">
        <MessageSquare className="w-8 h-8 sm:w-9 sm:h-9" />
      </div>

      <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-2">
        What can I help with today?
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-8">
        Ask anything, generate code, brainstorm creative ideas, or draft professional content powered by Google Gemini.
      </p>

      {/* Suggestion cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
        {SUGGESTIONS.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.prompt)}
              className="p-3.5 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#252525] hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-200 text-left group shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1.5">
                  <IconComponent className="w-3.5 h-3.5" />
                  <span>{item.category}</span>
                </div>
                <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {item.title}
                </h4>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 mt-1">
                {item.prompt}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
