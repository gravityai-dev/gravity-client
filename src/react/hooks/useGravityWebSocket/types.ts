/**
 * Types for useGravityWebSocket hook
 */

import type { ServerMessage, SessionParams } from "../../../core/types";

// =============================================================================
// WEBSOCKET EVENT
// =============================================================================

export type WebSocketEvent = ServerMessage & {
  id?: string;
};

// =============================================================================
// HOOK OPTIONS
// =============================================================================

export interface UseGravityWebSocketOptions {
  /** Function to get access token for JWT auth */
  getAccessToken?: () => Promise<string | null>;
  /** API URL for GraphQL mutations (required for send_message) */
  apiUrl?: string;
  /** Callback when binary audio is received from server */
  onAudioReceived?: (audioData: ArrayBuffer) => void;
  /** Callback when audio state changes (AUDIO_SESSION_READY, NOVA_SPEECH_STARTED, etc.) */
  onAudioState?: (state: string, metadata?: Record<string, any>) => void;
}

// =============================================================================
// HOOK RETURN
// =============================================================================

export interface UseGravityWebSocketReturn {
  /** Whether WebSocket is connected */
  isConnected: boolean;
  /** Whether session is initialized and ready for messages */
  isReady: boolean;
  /** Stream of server events for history processing */
  events: WebSocketEvent[];
  /** Notify server that a component has mounted */
  sendComponentReady: (componentName: string, messageId: string) => void;
  /** Send a user action (message, click, etc.) to the workflow */
  sendUserAction: (action: string, data: Record<string, any>) => void;
  /** Load a template without sending a message */
  loadTemplate: (targetTriggerNode: string, options?: { chatId?: string }) => void;
  /** Send an agent message through the server pipeline */
  sendAgentMessage: (data: {
    content: string;
    chatId: string;
    agentName?: string;
    source?: string;
    props?: Record<string, any>;
    metadata?: Record<string, any>;
  }) => void;
  /** Send a voice call control message (START_CALL or END_CALL) */
  sendVoiceCallMessage: (data: {
    message: string;
    userId: string;
    chatId: string;
    conversationId: string;
    workflowId: string;
    targetTriggerNode: string;
    action: "START_CALL" | "END_CALL";
  }) => Promise<void>;
  /** Send binary audio data to server */
  sendAudio: (audioData: ArrayBuffer) => void;
  /** Send JSON message via WebSocket (for control messages like AUDIO_CONTROL) */
  sendMessage: (message: Record<string, any>) => void;
}

// =============================================================================
// MESSAGE HANDLER CONTEXT
// =============================================================================

export interface MessageHandlerContext {
  setIsReady: (ready: boolean) => void;
  setEvents: React.Dispatch<React.SetStateAction<WebSocketEvent[]>>;
  initComponent: (chatId: string, nodeId: string, componentType: string) => void;
  updateComponentData: (chatId: string, nodeId: string, data: any) => void;
  removeComponent: (chatId: string, nodeId: string) => void;
  setWorkflowState: (state: string, workflowId: string, workflowRunId: string | null) => void;
  sessionParams: SessionParams;
  onAudioState?: (state: string, metadata?: Record<string, any>) => void;
}
