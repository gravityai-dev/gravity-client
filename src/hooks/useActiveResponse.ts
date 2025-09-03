/**
 * Hook for accessing active response state
 */

import { useGravityStore } from '../store';

export const useActiveResponse = () => {
  const store = useGravityStore();
  
  const {
    // Response state properties (flattened)
    conversationId,
    chatId,
    userId,
    messageSource,
    messageChunks,
    audioChunks,
    progressUpdate,
    jsonData,
    actionSuggestion,
    text,
    startTime,
    endTime,
    
    // Response actions
    startActiveResponse,
    processMessage,
    completeActiveResponse,
    clearActiveResponse,
    
    // UI state for universal app state
    appState,
  } = store;

  // Helper functions for state checks using universal appState
  const isIdle = appState === 'idle';
  const isThinking = appState === 'thinking';
  const isResponding = appState === 'responding';
  const isComplete = appState === 'complete';
  const isActive = isThinking || isResponding;

  // Helper to get latest progress
  const getProgress = () => progressUpdate;
  
  // Helper to get latest actions
  const getActions = () => actionSuggestion;
  
  // Helper to get streaming text (build from chunks)
  const getStreamingText = () => {
    return messageChunks
      .filter(chunk => chunk.text)
      .map(chunk => chunk.text)
      .join('');
  };
  
  // Helper to get current chunk
  const getCurrentChunk = () => {
    const lastChunk = messageChunks[messageChunks.length - 1];
    return lastChunk?.text || '';
  };

  return {
    // State
    conversationId,
    chatId,
    userId,
    messageSource,
    messageChunks,
    audioChunks,
    progressUpdate,
    jsonData,
    actionSuggestion,
    text,
    startTime,
    endTime,
    appState,
    
    // State check helpers
    isIdle,
    isThinking,
    isResponding,
    isComplete,
    isActive,
    
    // Data access helpers
    getProgress,
    getActions,
    getStreamingText,
    
    // Actions
    startActiveResponse,
    processMessage,
    completeActiveResponse,
    clearActiveResponse,
  };
};
