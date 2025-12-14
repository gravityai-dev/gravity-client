/**
 * useGravityWebSocket
 *
 * Core WebSocket hook for Gravity AI client.
 * Manages real-time communication with the Gravity server.
 *
 * Responsibilities:
 * - WebSocket connection lifecycle (connect, disconnect)
 * - Message parsing and routing to handlers
 * - Zustand store updates for component state
 * - GraphQL mutations for workflow execution
 * - Template loading without workflow execution
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useComponentData } from "../../store/componentData";
import { useAIContext } from "../../store/aiContext";
import type { SessionParams, ServerMessage } from "../../../core/types";
import type { WebSocketEvent, UseGravityWebSocketOptions, UseGravityWebSocketReturn } from "./types";
import { handleServerMessage } from "./messageHandlers";
import {
  sendMessageViaGraphQL,
  sendActionViaWebSocket,
  sendComponentReadyMessage,
  sendLoadTemplateMessage,
  sendAgentMessage as sendAgentMessageAction,
  sendVoiceCallMessage as sendVoiceCallMessageAction,
  type AgentMessageData,
  type VoiceCallMessageData,
} from "./actions";

// Re-export types for consumers
export type { UseGravityWebSocketOptions, UseGravityWebSocketReturn, WebSocketEvent } from "./types";

// =============================================================================
// HOOK
// =============================================================================

export function useGravityWebSocket(
  sessionParams: SessionParams,
  wsUrl: string,
  options: UseGravityWebSocketOptions = {}
): UseGravityWebSocketReturn {
  const { getAccessToken, apiUrl, onAudioReceived, onAudioState } = options;
  const { conversationId, userId } = sessionParams;

  // Zustand stores
  const { initComponent, updateComponentData, removeComponent } = useComponentData();
  const { setWorkflowState } = useAIContext();

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // ===========================================================================
  // CONNECTION LIFECYCLE
  // ===========================================================================

  useEffect(() => {
    if (!conversationId || !userId) {
      console.warn("[WS] Missing required params: conversationId or userId");
      return;
    }

    let ws: WebSocket | null = null;
    let isCancelled = false;

    const connect = async () => {
      // Get JWT token if auth is configured
      let token: string | null = null;
      if (getAccessToken) {
        try {
          token = await getAccessToken();
        } catch (error) {
          console.error("[WS] Failed to get access token:", error);
        }
      }

      if (isCancelled) return;

      // Connect (token in query param since WebSocket doesn't support headers)
      const urlWithAuth = token ? `${wsUrl}?token=${encodeURIComponent(token)}` : wsUrl;
      ws = new WebSocket(urlWithAuth);
      wsRef.current = ws;

      // Connection opened
      ws.onopen = () => {
        console.log("[WS] Connected", token ? "(authenticated)" : "(no auth)");
        setIsConnected(true);
        ws!.send(JSON.stringify({ type: "INIT_SESSION", ...sessionParams }));
      };

      // Message received
      ws.onmessage = (event) => {
        // Handle binary audio data
        if (event.data instanceof ArrayBuffer) {
          onAudioReceived?.(event.data);
          return;
        }
        if (event.data instanceof Blob) {
          event.data.arrayBuffer().then((buffer) => {
            onAudioReceived?.(buffer);
          });
          return;
        }

        // Handle JSON messages
        try {
          const data = JSON.parse(event.data) as ServerMessage;
          handleServerMessage(data, ws!, {
            setIsReady,
            setEvents,
            initComponent,
            updateComponentData,
            removeComponent,
            setWorkflowState,
            sessionParams,
            onAudioState,
          });
        } catch (error) {
          console.error("[WS] Failed to parse message:", error);
        }
      };

      // Error and close
      ws.onerror = (error) => console.error("[WS] Error:", error);
      ws.onclose = () => {
        setIsConnected(false);
        setIsReady(false);
      };
    };

    connect();

    return () => {
      isCancelled = true;
      if (ws?.readyState === WebSocket.OPEN) ws.close();
    };
  }, [conversationId, userId, wsUrl, getAccessToken]);

  // ===========================================================================
  // CLIENT ACTIONS
  // ===========================================================================

  /**
   * Notify server that a component has mounted
   */
  const sendComponentReady = useCallback((componentName: string, messageId: string) => {
    sendComponentReadyMessage(wsRef.current, componentName, messageId);
  }, []);

  /**
   * Send a user action to the workflow
   */
  const sendUserAction = useCallback(
    async (action: string, data: Record<string, any>) => {
      if (action === "send_message") {
        await sendMessageViaGraphQL({
          data,
          getAccessToken,
          apiUrl,
          conversationId,
          userId,
          setWorkflowState,
        });
      } else {
        sendActionViaWebSocket(wsRef.current, action, data);
      }
    },
    [getAccessToken, apiUrl, conversationId, userId, setWorkflowState]
  );

  /**
   * Load a template without sending a message
   */
  const loadTemplate = useCallback(
    (targetTriggerNode: string, options?: { chatId?: string }) => {
      sendLoadTemplateMessage(wsRef.current, sessionParams.workflowId, targetTriggerNode, options?.chatId);
    },
    [sessionParams.workflowId]
  );

  /**
   * Send an agent message through the server pipeline
   * Routes agent messages (Amazon Connect, etc.) through same flow as AI messages
   */
  const sendAgentMessage = useCallback((data: AgentMessageData) => {
    sendAgentMessageAction(wsRef.current, data);
  }, []);

  /**
   * Send a voice call control message (START_CALL or END_CALL)
   */
  const sendVoiceCallMessage = useCallback(
    async (data: VoiceCallMessageData) => {
      await sendVoiceCallMessageAction({
        data,
        getAccessToken,
        apiUrl,
        conversationId,
        userId,
        setWorkflowState,
      });
    },
    [getAccessToken, apiUrl, conversationId, userId, setWorkflowState]
  );

  // ===========================================================================
  // RETURN
  // ===========================================================================

  // Send binary audio data
  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(audioData);
    } else {
      console.warn("[WS] Cannot send audio - not connected");
    }
  }, []);

  // Send JSON message via WebSocket (for control messages like AUDIO_CONTROL)
  const sendMessage = useCallback((message: Record<string, any>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("[WS] Cannot send message - not connected");
    }
  }, []);

  return {
    isConnected,
    isReady,
    events,
    sendComponentReady,
    sendUserAction,
    loadTemplate,
    sendAgentMessage,
    sendVoiceCallMessage,
    sendAudio,
    sendMessage,
  };
}

export default useGravityWebSocket;
