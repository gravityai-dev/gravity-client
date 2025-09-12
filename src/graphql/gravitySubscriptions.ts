/**
 * GraphQL subscriptions for the new unified GravityEvent type
 */

import { gql } from "@apollo/client";

export const GRAVITY_RESULT_SUBSCRIPTION = gql`
  subscription GravityResult($conversationId: ID!) {
    gravityResult(conversationId: $conversationId) {
      __typename
      id
      chatId
      conversationId
      userId
      providerId
      timestamp
      type
      eventType
      data
    }
  }
`;
