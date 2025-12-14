/**
 * Helper utilities for useGravityWebSocket
 */

import { useComponentData } from "../../store/componentData";

// =============================================================================
// CHAT ID GENERATION
// =============================================================================

/**
 * Generate a unique chat ID
 * Format: chat_{timestamp}_{random}
 */
export const generateChatId = (): string => `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// =============================================================================
// COMPONENT STATE
// =============================================================================

/**
 * Get component state for a specific chat from Zustand store
 * Used to include current component state when sending messages
 */
export const getComponentStateForChat = (chatId: string): Record<string, any> => {
  const store = useComponentData.getState();
  return Object.entries(store.data)
    .filter(([key]) => key.startsWith(`${chatId}:`))
    .reduce((acc, [key, value]) => {
      const nodeId = key.split(":")[1];
      acc[nodeId] = value;
      return acc;
    }, {} as Record<string, any>);
};

// =============================================================================
// GRAPHQL
// =============================================================================

/**
 * GraphQL mutation for workflow execution
 */
export const EXECUTE_WORKFLOW_MUTATION = `
  mutation ExecuteWorkflow($id: ID!, $input: JSON!, $mode: ExecutionMode) {
    executeWorkflow(id: $id, input: $input, mode: $mode) {
      executionId
      status
    }
  }
`;
