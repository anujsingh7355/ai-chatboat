import React, { useState, useMemo } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Key,
  ShieldCheck,
  AlertCircle,
  PanelLeftClose,
  Trash,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

// Helper to group dates like ChatGPT
function groupConversationsByDate(conversations) {
  const groups = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    Older: [],
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const sevenDaysAgo = today - 86400000 * 7;

  conversations.forEach((conv) => {
    const time = new Date(conv.updatedAt || conv.createdAt).getTime();
    if (time >= today) {
      groups.Today.push(conv);
    } else if (time >= yesterday) {
      groups.Yesterday.push(conv);
    } else if (time >= sevenDaysAgo) {
      groups['Previous 7 Days'].push(conv);
    } else {
      groups.Older.push(conv);
    }
  });

  return groups;
}

export default function Sidebar({
  conversations,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onClearAll,
  isOpen,
  onClose,
  onOpenApiKeyModal,
  serverHealth,
  customApiKey,
  theme,
  toggleTheme,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content && m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  const grouped = useMemo(
    () => groupConversationsByDate(filteredConversations),
    [filteredConversations]
  );

  const startEditing = (conv, e) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveEditing = (id, e) => {
    e.stopPropagation();
    onRenameChat(id, editTitle);
    setEditingId(null);
  };

  const cancelEditing = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const hasKey = serverHealth.hasApiKey || Boolean(customApiKey);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 sm:w-72 flex flex-col bg-chatgpt-sidebar-light dark:bg-chatgpt-sidebar-dark border-r border-chatgpt-border-light dark:border-chatgpt-border-dark transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header: New Chat + Close on mobile */}
        <div className="p-3 flex items-center justify-between gap-2 border-b border-gray-200/50 dark:border-gray-800/50">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            type="button"
            className="flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-[#212121] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-800 dark:text-gray-100 text-sm font-medium transition-colors shadow-xs group"
          >
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span>New chat</span>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">
              Ctrl+K
            </span>
          </button>

          {/* Close Sidebar button (Mobile only) */}
          <button
            onClick={onClose}
            type="button"
            className="p-2 md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* Search input (shown if there are conversations) */}
        {conversations.length > 2 && (
          <div className="px-3 pt-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#212121] text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500">
              No conversations yet. Start a new chat to begin!
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => {
              if (items.length === 0) return null;

              return (
                <div key={category} className="space-y-1">
                  <h5 className="px-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {category}
                  </h5>
                  {items.map((conv) => {
                    const isActive = conv.id === activeChatId;
                    const isEditing = conv.id === editingId;

                    return (
                      <div
                        key={conv.id}
                        onClick={() => {
                          onSelectChat(conv.id);
                          if (window.innerWidth < 768) onClose();
                        }}
                        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-sm cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-gray-200/80 dark:bg-[#2a2a2a] text-gray-900 dark:text-white font-medium'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#212121]'
                        }`}
                      >
                        {/* Title or edit input */}
                        <div className="flex items-center space-x-2.5 truncate flex-1 min-w-0 pr-2">
                          <MessageSquare className="w-4 h-4 shrink-0 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                          {isEditing ? (
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditing(conv.id, e);
                                if (e.key === 'Escape') cancelEditing(e);
                              }}
                              autoFocus
                              className="w-full bg-white dark:bg-black px-1.5 py-0.5 rounded text-xs text-gray-900 dark:text-white focus:outline-none ring-1 ring-emerald-500"
                            />
                          ) : (
                            <span className="truncate">{conv.title || 'New Chat'}</span>
                          )}
                        </div>

                        {/* Hover Action Buttons */}
                        <div className="flex items-center space-x-1 shrink-0">
                          {isEditing ? (
                            <>
                              <button
                                onClick={(e) => saveEditing(conv.id, e)}
                                className="p-1 text-emerald-500 hover:text-emerald-600 rounded"
                                title="Save"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <div className="hidden group-hover:flex items-center space-x-1">
                              <button
                                onClick={(e) => startEditing(conv, e)}
                                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded"
                                title="Rename"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteChat(conv.id);
                                }}
                                className="p-1 text-gray-400 hover:text-red-500 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Area: API Status, Clear All, Theme */}
        <div className="p-3 border-t border-gray-200/50 dark:border-gray-800/50 space-y-1.5">
          {/* API Key Modal Button */}
          <button
            onClick={onOpenApiKeyModal}
            type="button"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-gray-100 dark:hover:bg-[#212121] text-gray-700 dark:text-gray-300 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-gray-400" />
              <span>Gemini API Key</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  hasKey ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                }`}
              />
              <span className="text-[11px] text-gray-400">
                {hasKey ? 'Active' : 'Configure'}
              </span>
            </div>
          </button>

          {/* Clear all chats button */}
          {conversations.length > 0 && (
            <div>
              {confirmClearAll ? (
                <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20 text-xs space-y-1.5">
                  <p className="text-red-600 dark:text-red-400 font-medium">Clear all conversations?</p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        onClearAll();
                        setConfirmClearAll(false);
                      }}
                      className="px-2 py-1 bg-red-600 text-white rounded-md text-[11px] font-medium hover:bg-red-700"
                    >
                      Yes, clear
                    </button>
                    <button
                      onClick={() => setConfirmClearAll(false)}
                      className="px-2 py-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClearAll(true)}
                  type="button"
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                >
                  <Trash className="w-4 h-4" />
                  <span>Clear conversations</span>
                </button>
              )}
            </div>
          )}

          {/* User & Theme Toggle Row */}
          <div className="flex items-center justify-between pt-1 px-1">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-semibold">
                AI
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                  Google Gemini
                </span>
                <span className="text-[10px] text-gray-400">ChatGPT Web App</span>
              </div>
            </div>

            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
        </div>
      </aside>
    </>
  );
}
