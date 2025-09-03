/**
 * Response Slice - Self-contained
 * Manages active response state and 3-tier JSON architecture
 */

import { ActiveResponseState } from "../types";
import { ChunkAnimator } from "./chunks";
import { getOrCreateCardsHandler, clearCardsHandler } from "./cards";

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
  audioChunks: null, // Current audio chunk from Nova
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
      // Reset chunk animator when starting new response
      if (chunkAnimator) {
        chunkAnimator.reset();
      }

      set((state: any) => ({
        ...state,
        chatId,
        userId,
        messageSource: "agent",
        messageChunks: [],
        progressUpdate: null,
        jsonData: [],
        actionSuggestion: null,
        text: null,
        cards: null,
        questions: null,
        form: null,
        nodeExecutionEvent: null,
        startTime: Date.now(),
        endTime: null,
      }));
    },

    processMessage: (message: any) => {
      const currentQuestions = get().questions;
      if (currentQuestions) {
        console.log(`[Questions] Processing ${message.__typename} while questions exist`);
      }
      set((state: any) => {
        // Only update response slice properties
        const responseSliceKeys = Object.keys(initialActiveResponseState);
        const currentResponseState: any = {};
        responseSliceKeys.forEach((key) => {
          currentResponseState[key] = state[key];
        });

        const newState = { ...currentResponseState };

        // Process different message types flexibly
        switch (message.__typename) {
          case "MessageChunk":
            // Let ChunkAnimator handle all chunk state management and ordering
            const conversationId = get().conversationId;
            if (conversationId && state.chatId) {
              const animator = getOrCreateChunkAnimator(conversationId, state.chatId);
              // Pass component.props which contains text and index
              animator.addChunk(message.component.props);
              newState.messageChunks = animator.getChunks();
            }
            break;

          case "ProgressUpdate":
            newState.progressUpdate = message.component.props;
            break;

          case "Text":
            newState.text = message.component.props;
            break;

          case "JsonData":
            const jsonDataProps = message.component.props;
            newState.jsonData = [...(newState.jsonData || []), jsonDataProps];
            break;

          case "ActionSuggestion":
            newState.actionSuggestion = message.component.props;
            break;

          case "Cards":
            // Use CardsHandler for proper accumulation and sorting
            const conversationIdForCards = get().conversationId;
            if (conversationIdForCards && state.chatId && message.component.props) {
              const cardsHandler = getOrCreateCardsHandler(conversationIdForCards, state.chatId);
              cardsHandler.addCards(message.component.props);
              newState.cards = cardsHandler.getCards();
            } else {
              // No conversation/chat context, just replace
              newState.cards = message.component.props;
            }
            break;

          case "Questions":
            newState.questions = message.component.props;
            console.log("[Questions] Setting questions:", message.component.props);
            break;

          case "Form":
            // Form is now stored in UI state (application state) instead of response state
            const setForm = get().setForm;
            if (setForm) {
              setForm(message.component.props);
            }
            // Automatically open sidebar when form is received
            const toggleSidebar = get().toggleSidebar;
            if (toggleSidebar) {
              toggleSidebar(true);
            }
            break;

          case "NodeExecutionEvent":
            console.log("[NodeExecutionEvent] Setting nodeExecutionEvent:", message);
            // NodeExecutionEvent is not a standardized message type, it has direct fields
            newState.nodeExecutionEvent = message;
            break;

          case "State":
            // Handle State messages - same structure as other messages
            const stateValue = message.state || message.component?.props?.state;
            if (stateValue) {
              const appState = stateValue.toLowerCase();
              // Update appState in UI slice where it belongs
              get().updateAppState(appState);
            }
            break;

          case "AudioChunk":
            newState.audioChunks = message.component.props;
            console.log("[AudioChunk] Setting audio chunk:", message.component.props);
            break;

          case "SystemMessage":
            if (message.type === "conversation_complete") {
              newState.state = "complete";
              newState.endTime = Date.now();
            }
            break;

          default:
            break;
        }

        const updates: any = {};
        responseSliceKeys.forEach((key) => {
          if (newState[key] !== currentResponseState[key]) {
            updates[key] = newState[key];
          }
        });

        return updates;
      });
    },

    completeActiveResponse: () => {
      // Mark conversation as complete to check for missing chunks
      if (chunkAnimator) {
        chunkAnimator.markConversationComplete();
      }

      // Clear cards handler for this conversation
      const conversationId = get().conversationId;
      const chatId = get().chatId;
      if (conversationId && chatId) {
        clearCardsHandler(conversationId, chatId);
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

      // Clear cards handler
      const conversationId = get().conversationId;
      const chatId = get().chatId;
      if (conversationId && chatId) {
        clearCardsHandler(conversationId, chatId);
      }

      set((state: any) => ({
        ...state,
        // Reset all response slice data to initial state
        chatId: null,
        userId: null,
        messageSource: null,
        messageChunks: [],
        audioChunks: null,
        progressUpdate: null,
        jsonData: [],
        actionSuggestion: null,
        text: null,
        cards: null,
        questions: null,
        nodeExecutionEvent: null,
        startTime: null,
        endTime: null,
      }));
    },
  };
};
