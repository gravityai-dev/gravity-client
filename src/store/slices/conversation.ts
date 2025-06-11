/**
 * Conversation Slice - Self-contained
 * Manages conversation state and message history
 */

import { ConversationState } from '../types';
import { GravityMessage, SendMessageParams } from '../../types/shared';

// Conversation slice interface
export interface ConversationSlice {
  conversation: ConversationState;
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
export const createConversationSlice = (
  set: any,
  get: any,
  api: any
): ConversationSlice => ({
  conversation: initialConversationState,

  setConversationId: (id: string) => {
    set((state: any) => ({
      conversation: {
        ...state.conversation,
        conversationId: id,
      },
    }));
  },

  addMessage: (message: GravityMessage) => {
    set((state: any) => ({
      conversation: {
        ...state.conversation,
        messages: [...state.conversation.messages, message],
      },
    }));
  },

  clearConversation: () => {
    set((state: any) => ({
      conversation: initialConversationState,
    }));
  },

  sendMessage: async (params: SendMessageParams) => {
    const state = get();
    
    if (!state.connection.client) {
      throw new Error('Not connected to Gravity AI');
    }

    // Set loading state
    set((state: any) => ({
      conversation: {
        ...state.conversation,
        isLoading: true,
      },
    }));

    try {
      const conversationId = params.conversationId || 
        state.conversation.conversationId || 
        generateConversationId();
      
      // Update conversation ID if needed
      if (conversationId !== state.conversation.conversationId) {
        get().setConversationId(conversationId);
      }

      const chatId = params.chatId || generateChatId();

      // TODO: Implement GraphQL mutation
      console.log('Sending message:', {
        message: params.message,
        conversationId,
        chatId,
        userId: params.userId,
      });

      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    } finally {
      // Clear loading state
      set((state: any) => ({
        conversation: {
          ...state.conversation,
          isLoading: false,
        },
      }));
    }
  },
});
