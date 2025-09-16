/**
 * Conversation Slice - Self-contained
 * Manages conversation state and message history
 */

import { ConversationState } from "../types";
import { GravityMessage, SendMessageParams, SendAudioMessageParams } from "../../types/shared";
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
    // BUT not if this is a silent message (e.g. form trigger from sidebar)
    const isSilent = params.metadata?.silent === true;
    if (!isSilent) {
      get().clearActiveResponse();
    }

    try {
      // ConversationId MUST be provided by the client - no state management here
      const conversationId = params.conversationId;
      if (!conversationId) {
        console.error(`[GravityClient] conversationId is required in params`);
        throw new Error("conversationId is required - must be provided by the client");
      }

      // Check if conversation ID has changed and update subscription if needed
      const currentConversationId = get().conversationId;

      if (conversationId !== currentConversationId) {
        // Update the conversation ID in the UI slice (single source of truth)
        get().setConversationId(conversationId);

        // Only update subscription if we don't already have an active one for this conversation
        const subscriptions = get().subscriptions;
        const subscriptionKey = `session:${conversationId}`;
        const existingEntry = subscriptions?.get(subscriptionKey);

        // Skip subscription update if we already have an active subscription
        if (!existingEntry || existingEntry.closed) {
          // Update the subscription to match the new conversation ID
          get().updateSubscription();
        } else {
          console.log(
            `[GravityClient] Skipping subscription update - already have active subscription for ${conversationId}`
          );
        }
      }

      const chatId = params.chatId;
      if (!chatId) {
        console.error(`[GravityClient] No chatId provided`);
        throw new Error("chatId is required for sending messages");
      }

      // Start active response to set up the state
      // BUT not if this is a silent message (e.g. form trigger from sidebar)
      if (!isSilent) {
        const startActiveResponse = get().startActiveResponse;
        if (startActiveResponse) {
          startActiveResponse(chatId, params.userId);
        }
      }

      const mutationInput = {
        message: params.message,
        conversationId,
        chatId,
        userId: params.userId,
        providerId: params.providerId,
        isAudio: params.isAudio || false,
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
