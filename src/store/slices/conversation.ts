/**
 * Conversation Slice - Self-contained
 * Manages conversation state and message history
 */

import { ConversationState } from "../types";
import { GravityMessage, SendMessageParams } from "../../types/shared";
import { TALK_TO_AGENT } from "../../graphql/operations";

// Conversation slice interface - flattened for easy access
export interface ConversationSlice extends ConversationState {
  setConversationId: (id: string) => void;
  addMessage: (message: GravityMessage) => void;
  clearConversation: () => void;
  sendMessage: (params: SendMessageParams) => Promise<void>;
}

// Initial state
const initialConversationState: ConversationState = {
  conversationId: null,
  messages: [],
  isLoading: false,
};

// Helper functions
const generateConversationId = (): string => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 7);
  return `conv_${timestamp}_${randomStr}`;
};

const generateChatId = (): string => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 7);
  return `chat_${timestamp}_${randomStr}`;
};

// Create conversation slice
export const createConversationSlice = (set: any, get: any, api: any): ConversationSlice => ({
  conversationId: initialConversationState.conversationId,
  messages: initialConversationState.messages,
  isLoading: initialConversationState.isLoading,

  setConversationId: (id: string) => {
    set((state: any) => ({
      conversationId: id,
    }));
  },

  addMessage: (message: GravityMessage) => {
    set((state: any) => ({
      messages: [...state.messages, message],
    }));
  },

  clearConversation: () => {
    set((state: any) => ({
      conversationId: initialConversationState.conversationId,
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
      // Get conversationId directly from localStorage (same source as connection slice)
      // This ensures we use the EXACT same conversationId that the subscription is listening to
      let conversationId = params.conversationId || state.conversationId;
      if (!conversationId) {
        conversationId = localStorage.getItem("gravity-conversationId");
        if (!conversationId) {
          conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          localStorage.setItem("gravity-conversationId", conversationId);
        }
      }

      // Store conversationId in conversation slice state for future reference
      if (!state.conversationId && conversationId) {
        get().setConversationId(conversationId);
      }

      const chatId = params.chatId || generateChatId();

      // Start active response to set up the state
      const startActiveResponse = get().startActiveResponse;
      if (startActiveResponse) {
        startActiveResponse(conversationId, chatId, params.userId);
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
