import React, { useEffect, useMemo, useCallback } from "react";
import { useGravityWebSocket } from "../hooks/useGravityWebSocket";
import { useComponentLoader } from "../hooks/useComponentLoader";
import { useHistoryManager } from "../hooks/useHistoryManager";
import { withZustandData } from "../hoc/withZustandData";
import { TemplateRenderer } from "./TemplateRenderer/index";
import { useAIContext } from "../store/aiContext";
import type { GravityConfig, SessionParams } from "../../core/types";
import type { HistoryManager, HistoryEntry } from "../../core/HistoryManager";
import { WS_ENDPOINTS } from "../../index";

interface TemplateInfo {
  Component: React.ComponentType<any>;
  name: string;
  nodeId?: string;
  props: Record<string, any>;
}

interface ClientContext {
  /** Send a message to the workflow - handles history + server communication */
  sendMessage: (message: string, options?: { targetTriggerNode?: string }) => void;
  /** Load a template without sending a message (template switch only) */
  loadTemplate: (targetTriggerNode: string, options?: { chatId?: string }) => void;
  /** Send an agent message through server pipeline (for live agent, Amazon Connect, etc.) */
  sendAgentMessage: (data: {
    content: string;
    chatId: string;
    agentName?: string;
    source?: string;
    props?: Record<string, any>;
    metadata?: Record<string, any>;
  }) => void;
  /** Emit a custom action event (for cross-boundary communication) */
  emitAction: (type: string, data: any) => void;
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
  /** History for rendering (read-only) */
  history: {
    entries: HistoryEntry[];
    getResponses: HistoryManager["getResponses"];
  };
  /** Session context */
  session: SessionParams;
}

interface GravityClientProps {
  /** Gravity server configuration */
  config: GravityConfig;
  /** Session parameters */
  session: SessionParams;
  /** Extra props to pass to all templates (e.g., amazonConnectConfig) */
  templateProps?: Record<string, any>;
  /** Callback when connection is ready */
  onReady?: (context: {
    sendMessage: (message: string, options?: { targetTriggerNode?: string }) => void;
    loadTemplate: (targetTriggerNode: string, options?: { chatId?: string }) => void;
    sessionParams: SessionParams;
  }) => void;
  /** Callback when template state changes */
  onStateChange?: (state: any) => void;
  /** Callback when component triggers an action (click, submit, etc.) */
  onAction?: (actionType: string, actionData: any) => void;
  /** Custom loading component */
  LoadingComponent?: React.ComponentType<{ isConnected: boolean; isReady: boolean }>;
  /** Custom template renderer */
  children?: (context: {
    template: TemplateInfo | null;
    templateStack: TemplateInfo[];
    client: ClientContext;
    isConnected: boolean;
    isReady: boolean;
  }) => React.ReactNode;
}

/**
 * GravityClient - Main client component for Gravity AI
 *
 * Handles all the boilerplate for connecting to Gravity:
 * - WebSocket connection
 * - Component loading
 * - History management
 * - Template rendering
 */
export function GravityClient({
  config,
  session,
  templateProps,
  onReady,
  onStateChange,
  onAction,
  LoadingComponent,
  children,
}: GravityClientProps): JSX.Element {
  // WebSocket connection - build full URL from base
  const wsFullUrl = `${config.wsUrl}${WS_ENDPOINTS.GRAVITY}`;
  // Audio playback ref for receiving audio from server
  const playAudioRef = React.useRef<(audioData: ArrayBuffer) => void>(() => {});
  // Audio state callback ref for templates to subscribe to
  const audioStateCallbackRef = React.useRef<((state: string, metadata?: Record<string, any>) => void) | null>(null);

  const {
    isConnected,
    isReady,
    events,
    sendComponentReady,
    sendUserAction,
    loadTemplate: wsLoadTemplate,
    sendAgentMessage: wsSendAgentMessage,
    sendVoiceCallMessage: wsSendVoiceCallMessage,
    sendAudio,
    sendMessage: wsSendMessage,
  } = useGravityWebSocket(session, wsFullUrl, {
    getAccessToken: config.getAccessToken,
    apiUrl: config.apiUrl,
    onAudioReceived: (audioData) => {
      playAudioRef.current(audioData);
    },
    onAudioState: (state, metadata) => {
      if (audioStateCallbackRef.current) {
        audioStateCallbackRef.current(state, metadata);
      }
    },
  });

  // Component loader
  const { loadComponent } = useComponentLoader(config.apiUrl);

  // History manager
  const historyManager = useHistoryManager(session, {
    loadComponent,
    sendComponentReady,
    events: events as any,
    withZustandData,
  });

  // Get emitAction from Zustand store
  const zustandEmitAction = useAIContext((s) => s.emitAction);

  // Listen for CustomEvents from streamed components (cross-boundary communication)
  useEffect(() => {
    console.log("[GravityClient] Setting up gravity:action listener");
    const handleGravityAction = (e: Event) => {
      const { type, data, componentId } = (e as CustomEvent).detail || {};
      console.log("[GravityClient] Received gravity:action", { type, componentId, data });
      if (type) {
        zustandEmitAction(type, data, componentId);
        onAction?.(type, data);
      }
    };
    window.addEventListener("gravity:action", handleGravityAction);
    return () => window.removeEventListener("gravity:action", handleGravityAction);
  }, [zustandEmitAction, onAction]);

  // Helper to send a message (adds to history + triggers workflow)
  const sendMessage = useCallback(
    (message: string, options?: { targetTriggerNode?: string }) => {
      const userEntry = historyManager.addUserMessage(message, {
        workflowId: session.workflowId,
        targetTriggerNode: options?.targetTriggerNode || session.targetTriggerNode,
      });
      sendUserAction("send_message", {
        message,
        chatId: userEntry.chatId,
        workflowId: session.workflowId,
        targetTriggerNode: options?.targetTriggerNode || session.targetTriggerNode,
      });
    },
    [historyManager, sendUserAction, session]
  );

  // Helper to emit action (for cross-boundary communication from templates)
  const emitAction = useCallback((type: string, data: any) => {
    window.dispatchEvent(
      new CustomEvent("gravity:action", {
        detail: { type, data, componentId: "template" },
      })
    );
  }, []);

  // Helper to load template without sending a message
  const loadTemplate = useCallback(
    (targetTriggerNode: string, options?: { chatId?: string }) => {
      wsLoadTemplate(targetTriggerNode, options);
    },
    [wsLoadTemplate]
  );

  // Helper to send agent messages through server pipeline
  const sendAgentMessage = useCallback(
    (data: {
      content: string;
      chatId: string;
      agentName?: string;
      source?: string;
      props?: Record<string, any>;
      metadata?: Record<string, any>;
    }) => {
      wsSendAgentMessage(data);
    },
    [wsSendAgentMessage]
  );

  // Notify parent when ready
  useEffect(() => {
    if (isReady) {
      onReady?.({ sendMessage, loadTemplate, sessionParams: session });
    }
  }, [isReady, sendMessage, loadTemplate]);

  // Build client context
  const clientContext: ClientContext = useMemo(
    () => ({
      sendMessage,
      loadTemplate,
      sendAgentMessage,
      sendVoiceCallMessage: wsSendVoiceCallMessage,
      emitAction,
      history: {
        entries: historyManager.history,
        getResponses: historyManager.getResponses,
      },
      session,
    }),
    [historyManager, sendMessage, loadTemplate, sendAgentMessage, wsSendVoiceCallMessage, emitAction, session]
  );

  // If children render prop provided, use it
  if (children) {
    return (
      <>
        {children({
          template: historyManager.activeTemplate,
          templateStack: historyManager.templateStack,
          client: clientContext,
          isConnected,
          isReady,
        })}
      </>
    );
  }

  // Default: render active template using TemplateRenderer
  if (historyManager.activeTemplate || historyManager.templateStack.length > 0) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <TemplateRenderer
          template={historyManager.activeTemplate}
          templateStack={historyManager.templateStack}
          history={historyManager.history}
          historyManager={historyManager.manager}
          sendUserAction={sendUserAction}
          sendAgentMessage={sendAgentMessage}
          sendVoiceCallMessage={wsSendVoiceCallMessage}
          sessionParams={session}
          wsUrl={config.wsUrl}
          templateProps={templateProps}
          onStateChange={onStateChange}
          sendAudio={sendAudio}
          playAudioRef={playAudioRef}
          audioStateCallbackRef={audioStateCallbackRef}
          sendMessage={wsSendMessage}
        />
      </div>
    );
  }

  // Loading state
  if (LoadingComponent) {
    return <LoadingComponent isConnected={isConnected} isReady={isReady} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!isConnected && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: "2px solid #3b82f6",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#6b7280" }}>Connecting to Gravity...</p>
        </div>
      )}
      {isConnected && !isReady && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: "2px solid #3b82f6",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#6b7280" }}>Initializing session...</p>
        </div>
      )}
    </div>
  );
}

export default GravityClient;
