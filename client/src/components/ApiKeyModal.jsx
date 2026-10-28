import React, { useState } from 'react';
import { Key, CheckCircle, AlertTriangle, ExternalLink, X, ShieldCheck } from 'lucide-react';

export default function ApiKeyModal({
  isOpen,
  onClose,
  customApiKey,
  onSaveKey,
  serverHealth,
  onRefreshHealth,
}) {
  const [keyInput, setKeyInput] = useState(customApiKey || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveKey(keyInput.trim());
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 900);
  };

  const handleClear = () => {
    setKeyInput('');
    onSaveKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Gemini API Configuration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status banner */}
          <div className="flex items-start space-x-3 p-3.5 rounded-xl text-sm border bg-gray-50 dark:bg-[#252525] border-gray-200 dark:border-gray-700">
            {serverHealth.hasApiKey ? (
              <>
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-emerald-600 dark:text-emerald-400">
                    Backend Environment API Key Active
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-xs mt-0.5">
                    Your server has a configured GEMINI_API_KEY. All chat requests will securely use this key by default.
                  </p>
                </div>
              </>
            ) : customApiKey ? (
              <>
                <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-600 dark:text-blue-400">
                    Custom Session API Key Active
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-xs mt-0.5">
                    Using your custom Gemini key stored locally in browser session storage.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-600 dark:text-amber-400">
                    No Gemini API Key Configured
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-xs mt-0.5">
                    Set <code className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700">GEMINI_API_KEY</code> in <code className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700">server/.env</code> or enter your key below.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Gemini API Key
              </label>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141414] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                <span>Get a free Gemini API key</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>

              {customApiKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-red-500 hover:text-red-600 hover:underline"
                >
                  Clear custom key
                </button>
              )}
            </div>

            {/* Security Notice */}
            <div className="flex items-center space-x-2 text-xs text-gray-400 dark:text-gray-500 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Keys are sent directly to your local Node.js backend over secure headers.</span>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm shadow-emerald-500/20"
              >
                {saveSuccess ? 'Saved!' : 'Save Key'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
