import { useState, useEffect, useRef, useCallback } from "react";
import { useComponentData } from "../store/componentData";
import { useAIContext } from "../store/aiContext";
import type {
  SessionParams,
  ServerMessage,
  ComponentInitMessage,
  ComponentDataMessage,
  ComponentRemoveMessage,
  WorkflowStateMessage,
} from "../../core/types";

type WebSocketEvent = ServerMessage & {
  id?: string;
};

interface UseGravityWebSocketOptions {
  /** Function to get access token for JWT auth */
  getAccessToken?: () => Promise<string | null>;
}

interface UseGravityWebSocketReturn {
  isConnected: boolean;
  isReady: boolean;
  events: WebSocketEvent[];
  sendComponentReady: (componentName: string, messageId: string) => void;
  sendUserAction: (action: string, data: Record<string, any>) => void;
}

/**
 * Hook to manage Gravity WebSocket connection
 * Supports JWT authentication via getAccessToken option
 */
export function useGravityWebSocket(
  sessionParams: SessionParams,
  wsUrl: string,
  options: UseGravityWebSocketOptions = {}
): UseGravityWebSocketReturn {
  const { getAccessToken } = options;
  const { conversationId, userId } = sessionParams;
  const { initComponent, updateComponentData, removeComponent } = useComponentData();
  const { setWorkflowState } = useAIContext();
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!conversationId || !userId) {
      console.warn("[WS] Missing required params");
      return;
    }

    let ws: WebSocket | null = null;
    let isCancelled = false;

    // Async function to get token and connect
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

      // Check if effect was cancelled during async token fetch
      if (isCancelled) return;

      // Connect with token in query param (WebSocket doesn't support headers)
      const urlWithAuth = token ? `${wsUrl}?token=${encodeURIComponent(token)}` : wsUrl;
      ws = new WebSocket(urlWithAuth);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WS] Connected", token ? "(authenticated)" : "(no auth)");
        setIsConnected(true);

        // Send INIT_SESSION with all session params
        const initMessage = {
          type: "INIT_SESSION",
          ...sessionParams,
        };

        ws!.send(JSON.stringify(initMessage));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ServerMessage;

          // Handle different message types
          if (data.type === "SESSION_READY") {
            console.log("[WS] Session ready");
            setIsReady(true);

            // Send initial query if provided
            if (sessionParams.initialQuery) {
              console.log("[WS] Sending initial query:", sessionParams.initialQuery);

              const chatId = sessionParams.chatId || `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

              ws!.send(
                JSON.stringify({
                  type: "USER_ACTION",
                  action: "send_message",
                  data: {
                    message: sessionParams.initialQuery,
                    chatId: chatId,
                    workflowId: sessionParams.workflowId,
                    targetTriggerNode: sessionParams.targetTriggerNode,
                  },
                })
              );
            }
          } else if (data.type === "COMPONENT_INIT") {
            const msg = data as ComponentInitMessage;
            if (!msg.chatId) {
              console.error("[WS] ❌ COMPONENT_INIT missing chatId");
              return;
            }

            console.log("[WS] 🚀 COMPONENT_INIT:", msg.component.type, msg.nodeId);
            initComponent(msg.chatId, msg.nodeId, msg.component.type);

            // If COMPONENT_INIT includes props, update Zustand immediately
            if (msg.component.props && Object.keys(msg.component.props).length > 0) {
              updateComponentData(msg.chatId, msg.nodeId, msg.component.props);
            }

            setEvents((prev) => [...prev, { ...data, id: `${msg.nodeId}_${Date.now()}` }]);
          } else if (data.type === "COMPONENT_DATA") {
            const msg = data as ComponentDataMessage;
            if (!msg.chatId) {
              console.error("[WS] ❌ COMPONENT_DATA missing chatId");
              return;
            }

            updateComponentData(msg.chatId, msg.nodeId, msg.data);
          } else if (data.type === "COMPONENT_REMOVE") {
            const msg = data as ComponentRemoveMessage;
            if (!msg.chatId) {
              console.error("[WS] ❌ COMPONENT_REMOVE missing chatId");
              return;
            }
            console.log("[WS] 🗑️ REMOVE:", msg.component.type, msg.nodeId);
            removeComponent(msg.chatId, msg.nodeId);
          } else if (data.type === "WORKFLOW_STATE") {
            const msg = data as WorkflowStateMessage;
            console.log(`[WS] 🔄 WORKFLOW_STATE: ${msg.state}`, {
              chatId: msg.chatId,
              workflowId: msg.workflowId,
              workflowRunId: msg.workflowRunId,
              metadata: msg.metadata,
            });

            // Update Zustand store with workflow state
            setWorkflowState(msg.state, msg.workflowId, msg.workflowRunId);

            // Ensure event has a unique ID for queue processing
            const eventWithId: WebSocketEvent = {
              ...data,
              id: `${msg.state}_${msg.chatId}_${msg.workflowRunId}`,
            };

            setEvents((prev) => [...prev, eventWithId]);
          }
        } catch (error) {
          console.error("[WS] Failed to parse message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("[WS] Error:", error);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsReady(false);
      };
    };

    // Start connection
    connect();

    // Cleanup
    return () => {
      isCancelled = true;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [conversationId, userId, wsUrl, getAccessToken]);

  const sendComponentReady = useCallback((componentName: string, messageId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "COMPONENT_READY",
          componentName,
          messageId,
        })
      );
    }
  }, []);

  const sendUserAction = useCallback(
    (action: string, data: Record<string, any>) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        // Optimistically set workflow state to STARTED when sending a message
        if (action === "send_message") {
          setWorkflowState("WORKFLOW_STARTED", data.workflowId, null);

          // If chatId is provided in data, include component state from Zustand
          if (data.chatId) {
            const store = useComponentData.getState();

            // Filter all components for this chatId
            const componentState = Object.entries(store.data)
              .filter(([key]) => key.startsWith(`${data.chatId}:`))
              .reduce((acc, [key, value]) => {
                const nodeId = key.split(":")[1];
                acc[nodeId] = value;
                return acc;
              }, {} as Record<string, any>);

            // Add componentState to data if any components exist
            if (Object.keys(componentState).length > 0) {
              data.componentState = componentState;
              console.log("[WS] 📦 Including component state:", componentState);
            }
          }
        }

        wsRef.current.send(
          JSON.stringify({
            type: "USER_ACTION",
            action,
            data,
          })
        );
      }
    },
    [setWorkflowState]
  );

  return {
    isConnected,
    isReady,
    events,
    sendComponentReady,
    sendUserAction,
  };
}

export default useGravityWebSocket;
