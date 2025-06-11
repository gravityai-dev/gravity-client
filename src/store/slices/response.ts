/**
 * Response Slice - Self-contained
 * Manages active response state and 3-tier JSON architecture
 */

import { ActiveResponseState } from "../types";

// Response slice interface - flattened for easy access
export interface ResponseSlice extends ActiveResponseState {
  startActiveResponse: (chatId: string, conversationId: string, userId: string) => void;
  processMessage: (message: any) => void;
  completeActiveResponse: () => void;
  clearActiveResponse: () => void;
}

// Initial state with proper 3-tier architecture fields
const initialActiveResponseState: ActiveResponseState = {
  conversationId: null,
  chatId: null,
  userId: null,
  state: "idle",
  messageSource: null,

  // Tier 1 & 2 JSON storage (Tier 3 bypasses state and goes directly to UI)
  messageChunks: [], // Tier 1: Raw streaming chunks
  progressUpdate: null, // Tier 2: Structured progress updates
  jsonData: [], // Tier 1: Raw JSON data from server
  actionSuggestion: null, // Tier 2: Structured action suggestions
  text: null, // Tier 2: Structured text

  // Timing
  startTime: null,
  endTime: null,
};

// Create response slice
export const createResponseSlice = (set: any, get: any, api: any): ResponseSlice => ({
  ...initialActiveResponseState,

  startActiveResponse: (chatId: string, conversationId: string, userId: string) => {
    set((state: any) => ({
      ...initialActiveResponseState,
      chatId,
      conversationId,
      userId,
      state: "thinking",
      messageSource: "user",
      startTime: Date.now(),
    }));
  },

  processMessage: (message: any) => {
    set((state: any) => {
      const newState = { ...state };

      // Set state to responding when we start receiving messages
      if (newState.state === "thinking") {
        newState.state = "responding";
        newState.messageSource = "agent";
      }

      // Process different message types flexibly
      switch (message.__typename) {
        case "MessageChunk":
          // Tier 2: Structured streaming chunks for real-time text display
          newState.messageChunks = [...newState.messageChunks, message];

          // Update current chunk and build full message
          if (message.text) {
            newState.text = message.text;
          }
          break;

        case "TextMessage":
        case "Text":
          // Tier 2: Structured text messages (semantic content)
          newState.text = message;
          break;

        case "ProgressUpdate":
          // Tier 2: Structured progress updates (semantic state)
          newState.progressUpdate = message;
          break;

        case "JsonData":
          // Tier 1: Raw JSON data from server
          newState.jsonData = [...newState.jsonData, message];
          break;

        case "ActionSuggestion":
          // Tier 2: Structured action suggestions (semantic UI state)
          newState.actionSuggestion = message;
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
    set((state: any) => ({ ...initialActiveResponseState }));
  },
});
