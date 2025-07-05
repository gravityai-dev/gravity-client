/**
 * Response Slice - Self-contained
 * Manages active response state and 3-tier JSON architecture
 */

import { ActiveResponseState } from "../types";
import { ChunkAnimator } from "./chunks";

// Response slice interface - flattened for easy access
export interface ResponseSlice extends ActiveResponseState {
  startActiveResponse: (chatId: string, userId: string) => void;
  processMessage: (message: any) => void;
  completeActiveResponse: () => void;
  clearActiveResponse: () => void;
}

// Initial state with proper 3-tier architecture fields
const initialActiveResponseState: ActiveResponseState = {
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
  questions: null, // Tier 2: Follow-up questions from server
  nodeExecutionEvent: null, // Tier 2: Workflow node execution events

  // Timing
  startTime: null,
  endTime: null,
};

// Create response slice
export const createResponseSlice = (set: any, get: any, api: any): ResponseSlice => {
  // Initialize chunk animator - but we need conversationId and messageId
  // We'll create it lazily when we have those values
  let chunkAnimator: ChunkAnimator | null = null;

  const getOrCreateChunkAnimator = (conversationId: string, messageId: string): ChunkAnimator => {
    if (
      !chunkAnimator ||
      chunkAnimator["conversationId"] !== conversationId ||
      chunkAnimator["messageId"] !== messageId
    ) {
      chunkAnimator = new ChunkAnimator(conversationId, messageId);
    }
    return chunkAnimator;
  };

  return {
    ...initialActiveResponseState,

    startActiveResponse: (chatId: string, userId: string) => {
      set((state: any) => ({
        ...state,
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
            // Let ChunkAnimator handle all chunk state management and ordering
            //console.log(`📨 [Response] Received chunk #${message.index} with ${message.text?.length || 0} chars`);
            // Get conversationId from UI state
            const conversationId = get().conversationId;
            if (conversationId && state.chatId) {
              const animator = getOrCreateChunkAnimator(conversationId, state.chatId);
              animator.addChunk(message);
              // Update state with chunks from animator
              newState.messageChunks = animator.getChunks();
            }
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

          case "Questions":
            // Tier 2: Follow-up questions from server
            newState.questions = message;
            break;

          case "NodeExecutionEvent":
            // Tier 2: Workflow node execution events
            newState.nodeExecutionEvent = message;
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
              console.log("🏁 [Response] Conversation complete - checking chunk status");
              const chunkCount = state.messageChunks?.length || 0;
              if (chunkCount > 0) {
                const indices = state.messageChunks.map((c: any) => c.index).sort((a: number, b: number) => a - b);
                console.log(`📊 [Response] Received ${chunkCount} chunks with indices:`, indices);

                // Check for gaps in the sequence
                for (let i = 1; i < indices.length; i++) {
                  if (indices[i] !== indices[i - 1] + 1) {
                    console.warn(
                      `⚠️ [Response] Gap detected! Missing chunk(s) between ${indices[i - 1]} and ${indices[i]}`
                    );
                  }
                }
              }
              newState.state = "complete";
              newState.endTime = Date.now();
            }
            break;

          default:
            // For unknown message types, log them (don't store in state)
            // console.log("Unknown message type received:", message.__typename, message);
            break;
        }

        return newState;
      });
    },

    completeActiveResponse: () => {
      // Mark conversation as complete to check for missing chunks
      if (chunkAnimator) {
        chunkAnimator.markConversationComplete();
      }

      set((state: any) => ({
        ...state,
        endTime: Date.now(),
      }));
    },

    clearActiveResponse: () => {
      // Reset chunk animator when clearing
      if (chunkAnimator) {
        chunkAnimator.reset();
      }

      set((state: any) => ({
        ...state,
        // Reset all response slice data to initial state
        chatId: null,
        userId: null,
        messageSource: null,
        messageChunks: [],
        progressUpdate: null,
        jsonData: [],
        actionSuggestion: null,
        text: null,
        cards: null,
        questions: null,
        startTime: null,
        endTime: null,
      }));
    },
  };
};
