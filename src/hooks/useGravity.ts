/**
 * Main hook for accessing Gravity AI functionality
 */

import { useEffect } from 'react';
import { useGravityStore } from '../store';

export function useGravity() {
  const store = useGravityStore();
  const {
    // Connection slice
    client,
    isConnected,
    isConnecting,
    error: connectionError,
    connect,
    disconnect,
    setupSubscription,
    cleanupSubscription,
    
    // Conversation slice
    conversationId,
    messages,
    sendMessage,
    clearConversation,
    
    // Response slice (flattened)
    state: chatState,
    messageSource,
    messageChunks,
    progressUpdate,
    actionSuggestion,
    text,
    startActiveResponse,
    processMessage,
    completeActiveResponse,
    clearActiveResponse,
    
    // UI slice
    sidebarOpen,
    componentConfig,
    toggleSidebar,
    setComponentConfig,
  } = store;

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      cleanupSubscription();
    };
  }, [cleanupSubscription]);

  return {
    // Connection state
    client,
    isConnected,
    isConnecting,
    connectionError,
    
    // Conversation state
    conversationId,
    messages,
    
    // Active response state
    chatState,
    messageSource,
    messageChunks,
    progressUpdate,
    actionSuggestion,
    text,
    
    // UI state
    sidebarOpen,
    componentConfig,
    
    // Connection actions
    connect,
    disconnect,
    
    // Conversation actions
    sendMessage,
    clearConversation,
    
    // Response actions
    startActiveResponse,
    processMessage,
    completeActiveResponse,
    clearActiveResponse,
    
    // UI actions
    toggleSidebar,
    setComponentConfig,
    
    // Subscription management
    setupSubscription,
    cleanupSubscription,
  };
}
