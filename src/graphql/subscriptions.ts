/**
 * GraphQL subscriptions for Gravity AI
 */

import { gql } from '@apollo/client';

export const AI_RESULT_SUBSCRIPTION = gql`
  subscription AiResult($conversationId: ID!) {
    aiResult(conversationId: $conversationId) {
      __typename
      ... on MessageChunk {
        chatId
        conversationId
        userId
        providerId
        timestamp
        text
        component {
          type
          props
        }
      }
      ... on Text {
        chatId
        conversationId
        userId
        providerId
        timestamp
        text
        component {
          type
          props
        }
      }
      ... on ProgressUpdate {
        chatId
        conversationId
        userId
        providerId
        timestamp
        component {
          type
          props
        }
      }
      ... on JsonData {
        chatId
        conversationId
        userId
        providerId
        timestamp
        jsonData: data
        component {
          type
          props
        }
      }
      ... on ActionSuggestion {
        chatId
        conversationId
        userId
        providerId
        timestamp
        type
        payload
        component {
          type
          props
        }
      }
      ... on Metadata {
        chatId
        conversationId
        userId
        providerId
        timestamp
        message
        component {
          type
          props
        }
      }
      ... on ImageResponse {
        chatId
        conversationId
        userId
        providerId
        timestamp
        url
        alt
        component {
          type
          props
        }
      }
      ... on ToolOutput {
        chatId
        conversationId
        userId
        providerId
        timestamp
        tool
        result
        component {
          type
          props
        }
      }
      ... on State {
        chatId
        conversationId
        userId
        providerId
        timestamp
        component {
          type
          props
        }
        stateData: data
        label
        variables
      }
      ... on Cards {
        chatId
        conversationId
        userId
        providerId
        timestamp
        component {
          type
          props
        }
      }
    }
  }
`;
