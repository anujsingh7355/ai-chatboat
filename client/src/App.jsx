import React, { useState, useEffect } from 'react';
import { useTheme } from './hooks/useTheme';
import { useChat } from './hooks/useChat';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import ApiKeyModal from './components/ApiKeyModal';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const {
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
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);

  // Global keyboard shortcut: Ctrl+K or Cmd+K -> New Chat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        createNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNewChat]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-chatgpt-main-light dark:bg-chatgpt-main-dark transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeChatId={activeChatId}
        onSelectChat={selectChat}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        onRenameChat={renameChat}
        onClearAll={clearAllChats}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenApiKeyModal={() => setApiKeyModalOpen(true)}
        serverHealth={serverHealth}
        customApiKey={customApiKey}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Chat Area */}
      <ChatArea
        activeChat={activeChat}
        onSendMessage={sendMessage}
        onStopGeneration={stopGeneration}
        onRegenerate={regenerateResponse}
        onClearChat={clearCurrentChat}
        onNewChat={createNewChat}
        isLoading={isLoading}
        errorMessage={errorMessage}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        models={models}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onOpenApiKeyModal={() => setApiKeyModalOpen(true)}
        serverHealth={serverHealth}
        customApiKey={customApiKey}
      />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        customApiKey={customApiKey}
        onSaveKey={(key) => {
          setCustomApiKey(key);
          checkHealth();
        }}
        serverHealth={serverHealth}
        onRefreshHealth={checkHealth}
      />
    </div>
  );
}
