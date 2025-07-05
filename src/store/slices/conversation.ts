/**
 * Conversation Slice - Self-contained
 * Manages conversation state and message history
 */

import { ConversationState } from "../types";
import { GravityMessage, SendMessageParams } from "../../types/shared";
import { TALK_TO_AGENT } from "../../graphql/operations";

// Conversation slice interface - flattened for easy access
export interface ConversationSlice extends ConversationState {
  addMessage: (message: GravityMessage) => void;
  clearConversation: () => void;
  sendMessage: (params: SendMessageParams) => Promise<void>;
}

// Initial state
const initialConversationState: ConversationState = {
  messages: [],
  isLoading: false,
};

// Create conversation slice
export const createConversationSlice = (set: any, get: any, api: any): ConversationSlice => ({
  messages: initialConversationState.messages,
  isLoading: initialConversationState.isLoading,

  addMessage: (message: GravityMessage) => {
    set((state: any) => ({
      messages: [...state.messages, message],
    }));
  },

  clearConversation: () => {
    set((state: any) => ({
      messages: initialConversationState.messages,
      isLoading: initialConversationState.isLoading,
    }));
  },

  sendMessage: async (params: SendMessageParams) => {
    const state = get();

    if (!state.client) {
      console.error("[GravityClient] No Apollo client available");
      throw new Error("Not connected to Gravity AI");
    }

    // Clear any previous response data before starting new message
    get().clearActiveResponse();

    try {
      // Get conversationId from params or UI state (single source of truth)
      let conversationId = params.conversationId || state.conversationId;
      if (!conversationId) {
        console.error(`[GravityClient] No conversationId available - must be set in UI state`);
        throw new Error("No conversationId available - ensure conversationId is set in UI state");
      }

      // Check if conversationId has changed
      const currentConversationId = state.conversationId;
      
      if (conversationId !== currentConversationId) {
        // Update UI state with new conversation ID
        const setConversationId = get().setConversationId;
        if (setConversationId) {
          setConversationId(conversationId);
        }
        
        // Update subscription to new conversationId
        const updateSubscription = get().updateSubscription;
        if (updateSubscription) {
          updateSubscription();
        }
      }

      const chatId = params.chatId;
      if (!chatId) {
        console.error(`[GravityClient] No chatId provided`);
        throw new Error("chatId is required for sending messages");
      }

      // Start active response to set up the state
      const startActiveResponse = get().startActiveResponse;
      if (startActiveResponse) {
        startActiveResponse(chatId, params.userId);
      }

      const mutationInput = {
        message: params.message,
        conversationId,
        chatId,
        userId: params.userId,
        providerId: params.providerId,
        metadata: params.metadata,
      };

      // Send GraphQL mutation
      const result = await state.client.mutate({
        mutation: TALK_TO_AGENT,
        variables: {
          input: mutationInput,
        },
      });

      return result;
    } catch (error: any) {
      console.error("[GravityClient] Failed to send message:", error);
      console.error("[GravityClient] Error details:", {
        name: error?.name,
        message: error?.message,
        networkError: error?.networkError,
        graphQLErrors: error?.graphQLErrors,
      });
      throw error;
    } finally {
      // Clear loading state
      set((state: any) => ({
        isLoading: false,
      }));
    }
  },
});
