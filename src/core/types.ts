/**
 * Core types for Gravity Client SDK
 */

/**
 * Configuration for the Gravity client
 */
export interface GravityConfig {
  /** Base API URL (e.g., http://localhost:4100) */
  apiUrl: string;
  /** Base WebSocket URL (e.g., ws://localhost:4100) */
  wsUrl: string;
  /** Optional GraphQL URL (defaults to apiUrl + /graphql) */
  graphqlUrl?: string;
  /** Function to get access token (for JWT auth) */
  getAccessToken?: () => Promise<string | null>;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Session parameters for a workflow connection
 */
export interface SessionParams {
  /** Unique conversation ID */
  conversationId: string;
  /** User ID */
  userId: string;
  /** Workflow ID to execute */
  workflowId: string;
  /** Target trigger node in the workflow */
  targetTriggerNode: string;
  /** Optional chat ID for message grouping */
  chatId?: string;
  /** Optional initial query to send on connect */
  initialQuery?: string;
  /** Optional template name */
  template?: string;
}

/**
 * Streaming state enum
 */
export type StreamingState = "idle" | "streaming" | "complete";

/**
 * Workflow state from server
 */
export type WorkflowState =
  | "WORKFLOW_STARTED"
  | "WORKFLOW_COMPLETED"
  | "WORKFLOW_ERROR"
  | "THINKING"
  | "RESPONDING"
  | "WAITING"
  | "COMPLETE"
  | "ERROR"
  | null;

/**
 * WebSocket message types from server
 */
export type ServerMessageType =
  | "SESSION_READY"
  | "COMPONENT_INIT"
  | "COMPONENT_DATA"
  | "COMPONENT_REMOVE"
  | "WORKFLOW_STATE";

/**
 * Component initialization message
 */
export interface ComponentInitMessage {
  type: "COMPONENT_INIT";
  chatId: string;
  nodeId: string;
  component: {
    type: string;
    componentUrl: string;
    props?: Record<string, any>;
    metadata?: Record<string, any>;
  };
}

/**
 * Component data update message
 */
export interface ComponentDataMessage {
  type: "COMPONENT_DATA";
  chatId: string;
  nodeId: string;
  data: Record<string, any>;
}

/**
 * Component remove message
 */
export interface ComponentRemoveMessage {
  type: "COMPONENT_REMOVE";
  chatId: string;
  nodeId: string;
  component: {
    type: string;
  };
}

/**
 * Workflow state message
 */
export interface WorkflowStateMessage {
  type: "WORKFLOW_STATE";
  state: WorkflowState;
  chatId: string;
  workflowId: string;
  workflowRunId: string;
  metadata?: {
    template?: string;
    templateMode?: "switch" | "stack" | "replace";
  };
}

/**
 * Session ready message
 */
export interface SessionReadyMessage {
  type: "SESSION_READY";
}

/**
 * Union of all server messages
 */
export type ServerMessage =
  | SessionReadyMessage
  | ComponentInitMessage
  | ComponentDataMessage
  | ComponentRemoveMessage
  | WorkflowStateMessage;

/**
 * User action types
 */
export type UserActionType = "send_message" | "click" | "submit" | "change";

/**
 * User action payload
 */
export interface UserActionPayload {
  message?: string;
  chatId?: string;
  workflowId?: string;
  targetTriggerNode?: string;
  componentState?: Record<string, any>;
  [key: string]: any;
}
