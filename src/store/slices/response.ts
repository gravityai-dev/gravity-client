/**
 * Response Slice - Self-contained
 * Manages active response state and 3-tier JSON architecture
 */

import { ActiveResponseState } from "../types";

// Response slice interface
export interface ResponseSlice {
  activeResponse: ActiveResponseState;
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

  // Legacy fields
  text: null,
  currentMessageChunk: null,
  fullMessage: "",

  // Timing
  startTime: null,
  endTime: null,
};

// Create response slice
export const createResponseSlice = (set: any, get: any, api: any): ResponseSlice => ({
  activeResponse: initialActiveResponseState,

  startActiveResponse: (chatId: string, conversationId: string, userId: string) => {
    set((state: any) => ({
      activeResponse: {
        ...initialActiveResponseState,
        chatId,
        conversationId,
        userId,
        state: "thinking",
        messageSource: "user",
        startTime: Date.now(),
      },
    }));
  },

  processMessage: (message: any) => {
    set((state: any) => {
      const activeResponse = { ...state.activeResponse };
      
      // Set state to responding when we start receiving messages
      if (activeResponse.state === 'thinking') {
        activeResponse.state = 'responding';
        activeResponse.messageSource = 'agent';
      }

      // Process different message types flexibly
      switch (message.__typename) {
        case 'MessageChunk':
          // Tier 2: Structured streaming chunks for real-time text display
          activeResponse.messageChunks = [...activeResponse.messageChunks, message];
          
          // Update current chunk and build full message
          if (message.text) {
            activeResponse.currentMessageChunk = message.text;
            activeResponse.fullMessage += message.text;
          }
          break;

        case 'TextMessage':
        case 'Text':
          // Tier 2: Structured text messages (semantic content)
          activeResponse.text = message;
          if (message.text) {
            activeResponse.currentMessageChunk = message.text;
            activeResponse.fullMessage += message.text;
          }
          break;

        case 'ProgressUpdate':
          // Tier 2: Structured progress updates (semantic state)
          activeResponse.progressUpdate = message;
          break;

        case 'JsonData':
          // Tier 1: Raw JSON data from server
          activeResponse.jsonData = [...activeResponse.jsonData, message];
          break;

        case 'ActionSuggestion':
          // Tier 2: Structured action suggestions (semantic UI state)
          activeResponse.actionSuggestion = message;
          break;

        case 'SystemMessage':
          // Handle system messages
          if (message.type === 'conversation_complete') {
            activeResponse.state = 'complete';
            activeResponse.endTime = Date.now();
          }
          break;

        default:
          // For unknown message types, log them (don't store in state)
          console.log('Unknown message type received:', message.__typename, message);
          break;
      }

      return { activeResponse };
    });
  },

  completeActiveResponse: () => {
    set((state: any) => ({
      activeResponse: {
        ...state.activeResponse,
        state: "complete",
        endTime: Date.now(),
      },
    }));
  },

  clearActiveResponse: () => {
    set((state: any) => ({
      activeResponse: initialActiveResponseState,
    }));
  },
});
