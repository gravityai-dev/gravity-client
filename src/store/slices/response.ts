/**
 * Response Slice - Self-contained
 * Manages active response state and 3-tier JSON architecture
 */

import { ActiveResponseState } from "../types";

// Response slice interface - flattened for easy access
export interface ResponseSlice extends ActiveResponseState {
  startActiveResponse: (conversationId: string, chatId: string, userId: string) => void;
  processMessage: (message: any) => void;
  completeActiveResponse: () => void;
  clearActiveResponse: () => void;
}

// Initial state with proper 3-tier architecture fields
const initialActiveResponseState: ActiveResponseState = {
  conversationId: null,
  chatId: null,
  userId: null,
  messageSource: null,

  // Tier 1 & 2 JSON storage (Tier 3 bypasses state and goes directly to UI)
  messageChunks: [], // Tier 1: Raw streaming chunks
  progressUpdate: null, // Tier 2: Structured progress updates
  jsonData: [], // Tier 1: Raw JSON data from server
  actionSuggestion: null, // Tier 2: Structured action suggestions
  text: null, // Tier 2: Structured text
  cards: null, // Tier 2: Card components from server

  // Timing
  startTime: null,
  endTime: null,
};

// Create response slice
export const createResponseSlice = (set: any, get: any, api: any): ResponseSlice => ({
  ...initialActiveResponseState,

  startActiveResponse: (conversationId: string, chatId: string, userId: string) => {
    set((state: any) => ({
      ...state,
      conversationId,
      chatId,
      userId,
      messageSource: "agent",
      startTime: Date.now(),
      endTime: null,
    }));
  },

  processMessage: (message: any) => {
    set((state: any) => {
      const newState = { ...state };

      // Process different message types flexibly
      switch (message.__typename) {
        case "MessageChunk":
          // Tier 2: Structured streaming chunks for real-time text display
          newState.messageChunks = [...(newState.messageChunks || []), message];
          break;

        case "ProgressUpdate":
          // Tier 2: Structured progress updates (semantic UI state)
          newState.progressUpdate = message;
          break;

        case "Text":
          // Tier 2: Structured text messages
          newState.text = message;
          break;

        case "JsonData":
          // Tier 1: Raw JSON data from server
          newState.jsonData = [...(newState.jsonData || []), message];
          break;

        case "ActionSuggestion":
          // Tier 2: Structured action suggestions (semantic UI state)
          newState.actionSuggestion = message;
          break;

        case "Cards":
          // Tier 2: Card components from server
          newState.cards = message;
          break;

        case "State":
          // Handle State messages - update appState directly in newState
          const stateValue = message.component?.props?.state;
          if (stateValue) {
            const appState = stateValue.toLowerCase();
            // Update appState directly in newState (single atomic update)
            newState.appState = appState;
          }
          break;

        case "SystemMessage":
          // Handle system messages
          if (message.type === "conversation_complete") {
            newState.state = "complete";
            newState.endTime = Date.now();
          }
          break;

        default:
          // For unknown message types, log them (don't store in state)
          console.log("Unknown message type received:", message.__typename, message);
          break;
      }

      return newState;
    });
  },

  completeActiveResponse: () => {
    set((state: any) => ({
      ...state,
      state: "complete",
      endTime: Date.now(),
    }));
  },

  clearActiveResponse: () => {
    set((state: any) => ({
      ...state,
      // Reset all response slice data to initial state
      conversationId: null,
      chatId: null,
      userId: null,
      messageSource: null,
      messageChunks: [],
      progressUpdate: null,
      jsonData: [],
      actionSuggestion: null,
      text: null,
      cards: null,
      startTime: null,
      endTime: null,
    }));
  },
});
