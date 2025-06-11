import { gql } from '@apollo/client';

// Core agent operations - used by all Gravity AI clients

// Talk to agent mutation
export const TALK_TO_AGENT = gql`
  mutation TalkToAgent($input: AgentInput!) {
    talkToAgent(input: $input) {
      chatId
      conversationId
      userId
      executionId
      providerId
      success
      message
    }
  }
`;

// Chat status query
export const GET_CHAT_STATUS = gql`
  query GetChatStatus($chatId: ID!) {
    getChatStatus(chatId: $chatId) {
      exists
      status
      startTime
      message
      error
    }
  }
`;
