/**
 * Client actions for sending data to the server
 */

import { getComponentStateForChat, EXECUTE_WORKFLOW_MUTATION } from "./helpers";

// =============================================================================
// GRAPHQL ACTIONS
// =============================================================================

interface SendMessageOptions {
  data: Record<string, any>;
  getAccessToken?: () => Promise<string | null>;
  apiUrl?: string;
  conversationId: string;
  userId: string;
  setWorkflowState: (state: string, workflowId: string, workflowRunId: string | null) => void;
}

/**
 * Send message via GraphQL mutation (with JWT auth support)
 *
 * Uses GraphQL instead of WebSocket to ensure JWT token is included
 * in the request headers for authentication.
 */
export async function sendMessageViaGraphQL(options: SendMessageOptions): Promise<void> {
  const { data, getAccessToken, apiUrl, conversationId, userId, setWorkflowState } = options;

  // Optimistically set workflow state
  setWorkflowState("WORKFLOW_STARTED", data.workflowId, null);

  // Include component state from Zustand if available
  if (data.chatId) {
    const componentState = getComponentStateForChat(data.chatId);
    if (Object.keys(componentState).length > 0) {
      data.componentState = componentState;
      console.log("[GraphQL] 📦 Including component state:", componentState);
    }
  }

  try {
    // Get auth token
    const token = getAccessToken ? await getAccessToken() : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Execute mutation
    const response = await fetch(`${apiUrl}/graphql`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: EXECUTE_WORKFLOW_MUTATION,
        variables: {
          id: data.workflowId,
          input: {
            message: data.message,
            chatId: data.chatId,
            conversationId: data.conversationId || conversationId,
            userId: data.userId || userId,
            providerId: data.providerId || "gravity-ds",
            metadata: {
              targetTriggerNode: data.targetTriggerNode,
              enableAudio: data.enableAudio || false,
              ...(data.componentState && { componentState: data.componentState }),
            },
          },
          mode: "PRODUCTION",
        },
      }),
    });

    const result = await response.json();
    if (result.errors) {
      console.error("[GraphQL] Execution error:", result.errors);
    } else {
      console.log("[GraphQL] Workflow executed:", result.data?.executeWorkflow);
    }
  } catch (error) {
    console.error("[GraphQL] Failed to execute workflow:", error);
  }
}

// =============================================================================
// WEBSOCKET ACTIONS
// =============================================================================

/**
 * Send a generic action via WebSocket
 */
export function sendActionViaWebSocket(ws: WebSocket | null, action: string, data: Record<string, any>): void {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "USER_ACTION", action, data }));
  }
}

/**
 * Notify server that a component has mounted
 */
export function sendComponentReadyMessage(ws: WebSocket | null, componentName: string, messageId: string): void {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "COMPONENT_READY", componentName, messageId }));
  }
}

/**
 * Send LOAD_TEMPLATE message to switch templates without workflow execution
 */
export function sendLoadTemplateMessage(
  ws: WebSocket | null,
  workflowId: string,
  targetTriggerNode: string,
  chatId?: string
): void {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: "LOAD_TEMPLATE",
        workflowId,
        targetTriggerNode,
        chatId,
      })
    );
  }
}

// =============================================================================
// VOICE CALL ACTIONS
// =============================================================================

export interface VoiceCallMessageData {
  /** Message content */
  message: string;
  /** User ID */
  userId: string;
  /** Chat ID for this call session */
  chatId: string;
  /** Conversation ID */
  conversationId: string;
  /** Workflow ID */
  workflowId: string;
  /** Target trigger node for voice workflow */
  targetTriggerNode: string;
  /** Action type: START_CALL or END_CALL */
  action: "START_CALL" | "END_CALL";
}

/**
 * Send a voice call control message via GraphQL
 *
 * Voice calls require special metadata including isAudio flag and action type.
 * This sends START_CALL or END_CALL messages to initiate/terminate voice sessions.
 */
export async function sendVoiceCallMessage(
  options: Omit<SendMessageOptions, "data"> & { data: VoiceCallMessageData }
): Promise<void> {
  const { data, getAccessToken, apiUrl, setWorkflowState } = options;

  // Optimistically set workflow state
  setWorkflowState("WORKFLOW_STARTED", data.workflowId, null);

  try {
    // Get auth token
    const token = getAccessToken ? await getAccessToken() : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Execute mutation with voice-specific parameters
    const response = await fetch(`${apiUrl}/graphql`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: EXECUTE_WORKFLOW_MUTATION,
        variables: {
          id: data.workflowId,
          input: {
            message: data.message,
            chatId: data.chatId,
            conversationId: data.conversationId,
            userId: data.userId,
            providerId: "gravity-voice",
            isAudio: true, // Critical for voice routing
            metadata: {
              targetTriggerNode: data.targetTriggerNode,
              action: data.action,
              isAction: true,
              workflowId: data.workflowId,
              continuousStream: data.action === "START_CALL",
            },
          },
          mode: "PRODUCTION",
        },
      }),
    });

    const result = await response.json();
    if (result.errors) {
      console.error("[GraphQL] Voice call error:", result.errors);
    } else {
      console.log(`[GraphQL] Voice ${data.action} executed:`, result.data?.executeWorkflow);
    }
  } catch (error) {
    console.error("[GraphQL] Failed to send voice call message:", error);
  }
}

// =============================================================================
// AGENT MESSAGE
// =============================================================================

export interface AgentMessageData {
  /** Message content */
  content: string;
  /** Chat ID to associate with (for conversation continuity) */
  chatId: string;
  /** Agent display name */
  agentName?: string;
  /** Source identifier */
  source?: string;
  /** Additional component props (e.g., interactiveData for ListPicker) */
  props?: Record<string, any>;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Send an agent message through the server pipeline
 *
 * This routes agent messages (from Amazon Connect, etc.) through the same
 * pipeline as AI messages, ensuring components are loaded and history
 * is consistent across all templates.
 */
export function sendAgentMessage(ws: WebSocket | null, data: AgentMessageData): void {
  console.log("[sendAgentMessage] Called with ws state:", ws?.readyState, "OPEN=", WebSocket.OPEN);
  if (ws?.readyState === WebSocket.OPEN) {
    const message = JSON.stringify({
      type: "AGENT_MESSAGE",
      ...data,
    });
    console.log("[sendAgentMessage] Sending:", message.substring(0, 200));
    ws.send(message);
  } else {
    console.warn("[sendAgentMessage] WebSocket not open, cannot send agent message");
  }
}
