/**
 * GraphQL subscriptions for Gravity AI
 */

import { gql } from "@apollo/client";

// Shared fields for standard message types
const STANDARD_FIELDS = `
  chatId
  conversationId
  userId
  providerId
  timestamp
  component {
    type
    props
  }
`;

export const AI_RESULT_SUBSCRIPTION = gql`
  subscription AiResult($conversationId: ID!) {
    aiResult(conversationId: $conversationId) {
      __typename
      
      # Standard message types with shared fields
      ... on MessageChunk {
        ${STANDARD_FIELDS}
      }
      ... on Text {
        ${STANDARD_FIELDS}
      }
      ... on ProgressUpdate {
        ${STANDARD_FIELDS}
      }
      ... on JsonData {
        ${STANDARD_FIELDS}
      }
      ... on ActionSuggestion {
        ${STANDARD_FIELDS}
      }
      ... on Questions {
        ${STANDARD_FIELDS}
      }
      ... on Form {
        ${STANDARD_FIELDS}
      }
      ... on Cards {
        ${STANDARD_FIELDS}
      }
      ... on ImageResponse {
        ${STANDARD_FIELDS}
      }
      ... on ToolOutput {
        ${STANDARD_FIELDS}
      }
      ... on Metadata {
        ${STANDARD_FIELDS}
      }
      ... on AudioChunk {
        ${STANDARD_FIELDS}
      }
      
      # Special message types with additional fields
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
      ... on NodeExecutionEvent {
        chatId
        conversationId
        userId
        providerId
        timestamp
        executionId
        workflowId
        nodeId
        nodeType
        state
        duration
        outputs
        error
        triggeredSignals {
          targetNode
          signal
          inputs
        }
      }
    }
  }
`;
