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
  /** API URL for GraphQL mutations (required for send_message) */
  apiUrl?: string;
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
  const { getAccessToken, apiUrl } = options;
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
    async (action: string, data: Record<string, any>) => {
      // For send_message, use GraphQL to ensure auth token is passed
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
            console.log("[GraphQL] 📦 Including component state:", componentState);
          }
        }

        // Use GraphQL mutation with JWT auth
        try {
          const token = getAccessToken ? await getAccessToken() : null;
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }

          const mutation = `
            mutation ExecuteWorkflow($id: ID!, $input: JSON!, $mode: ExecutionMode) {
              executeWorkflow(id: $id, input: $input, mode: $mode) {
                executionId
                status
              }
            }
          `;

          const response = await fetch(`${apiUrl}/graphql`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              query: mutation,
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
        return;
      }

      // For other actions, use WebSocket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "USER_ACTION",
            action,
            data,
          })
        );
      }
    },
    [setWorkflowState, getAccessToken, apiUrl, conversationId, userId]
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
