/**
 * Hook for accessing active response state
 */

import { useGravityStore } from '../store';

export const useActiveResponse = () => {
  const store = useGravityStore();
  
  const {
    activeResponse,
    startActiveResponse,
    processMessage,
    completeActiveResponse,
    clearActiveResponse,
  } = store;

  // Helper functions for state checks
  const isIdle = activeResponse.state === 'idle';
  const isThinking = activeResponse.state === 'thinking';
  const isResponding = activeResponse.state === 'responding';
  const isComplete = activeResponse.state === 'complete';
  const isActive = isThinking || isResponding;

  // Helper to get latest progress
  const getProgress = () => activeResponse.progressUpdate;
  
  // Helper to get latest actions
  const getActions = () => activeResponse.actionSuggestion;
  
  // Helper to get streaming text
  const getStreamingText = () => activeResponse.fullMessage;
  
  // Helper to get current chunk
  const getCurrentChunk = () => activeResponse.currentMessageChunk;

  return {
    // State
    activeResponse,
    state: activeResponse.state,
    messageSource: activeResponse.messageSource,
    
    // Streaming data
    messageChunks: activeResponse.messageChunks,
    fullMessage: activeResponse.fullMessage,
    currentChunk: activeResponse.currentMessageChunk,
    
    // Structured data (Tier 2)
    progressUpdate: activeResponse.progressUpdate,
    actionSuggestion: activeResponse.actionSuggestion,
    text: activeResponse.text,
    
    // Raw data (Tier 1)
    jsonData: activeResponse.jsonData,
    
    // Timing
    startTime: activeResponse.startTime,
    endTime: activeResponse.endTime,
    
    // State helpers
    isIdle,
    isThinking,
    isResponding,
    isComplete,
    isActive,
    
    // Data helpers
    getProgress,
    getActions,
    getStreamingText,
    getCurrentChunk,
    
    // Actions
    startActiveResponse,
    processMessage,
    completeActiveResponse,
    clearActiveResponse,
  };
};
