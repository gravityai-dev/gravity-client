import React, { useEffect, useMemo, useCallback, useState } from "react";
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

interface FocusState {
  focusedComponentId: string | null;
  targetTriggerNode: string | null;
  chatId: string | null;
}

interface ClientContext {
  /** Send a message to the workflow - handles history + server communication */
  sendMessage: (message: string, options?: { targetTriggerNode?: string; chatId?: string }) => void;
  /** Load a template without sending a message (template switch only) */
  loadTemplate: (targetTriggerNode: string, options?: { chatId?: string }) => void;
  /** Send an agent message through server pipeline (for live agent, Amazon Connect, etc.) */
  sendAgentMessage: (data: {
    chatId: string;
    agentName?: string;
    source?: string;
    components: Array<{
      type: string;
      props: Record<string, any>;
      metadata?: Record<string, any>;
    }>;
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
  /** Suggestions from workflow (FAQs, Actions, Recommendations) */
  suggestions?: {
    faqs?: Array<{ id?: string; question: string }>;
    actions?: Array<{ id?: string; label: string; description?: string; icon?: string }>;
    recommendations?: Array<{ id?: string; text: string; confidence?: number; actionLabel?: string }>;
  };
  /** Focus state for component-centric conversations */
  focusState?: FocusState;
  /** Open focus mode for a component */
  openFocus?: (componentId: string, targetTriggerNode: string | null, chatId: string | null) => void;
  /** Close focus mode */
  closeFocus?: () => void;
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
  // Track current targetTriggerNode - updates when loadTemplate is called
  const [currentTargetTriggerNode, setCurrentTargetTriggerNode] = useState(session.targetTriggerNode);

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

  // Get Zustand actions for component data and focus
  const zustandOpenFocus = useAIContext((s) => s.openFocus);
  const zustandSetComponentData = useAIContext((s) => s.setComponentData);
  const zustandUpdateComponentData = useAIContext((s) => s.updateComponentData);

  // History manager - pass Zustand actions for state management
  const historyManager = useHistoryManager(session, {
    loadComponent,
    sendComponentReady,
    events: events as any,
    withZustandData,
    openFocus: zustandOpenFocus,
    setComponentData: zustandSetComponentData,
    updateComponentData: zustandUpdateComponentData,
  });

  // Get emitAction, suggestions, and focus state from Zustand store
  const zustandEmitAction = useAIContext((s) => s.emitAction);
  const suggestions = useAIContext((s) => s.suggestions);
  const focusState = useAIContext((s) => s.focusState);
  const openFocus = useAIContext((s) => s.openFocus);
  const closeFocus = useAIContext((s) => s.closeFocus);

  // Listen for CustomEvents from streamed components (cross-boundary communication)
  useEffect(() => {
    const handleGravityAction = (e: Event) => {
      const { type, data, componentId } = (e as CustomEvent).detail || {};
      if (type) {
        zustandEmitAction(type, data, componentId);
        onAction?.(type, data);
      }
    };
    window.addEventListener("gravity:action", handleGravityAction);
    return () => window.removeEventListener("gravity:action", handleGravityAction);
  }, [zustandEmitAction, onAction]);

  // Use ref for focusState in sendMessage to avoid recreating the callback
  // when focusState changes (sendMessage reads current value at call time)
  const focusStateRef = React.useRef(focusState);
  focusStateRef.current = focusState;

  // Helper to send a message (adds to history + triggers workflow)
  // FOCUS MODE: When focusState is set, routes to focused component's trigger with same chatId
  // This is universal - all templates get focus routing automatically
  // Uses ref for focusState to keep callback stable
  const sendMessage = useCallback(
    (message: string, options?: { targetTriggerNode?: string; chatId?: string }) => {
      // Read current focusState from ref (not stale closure)
      const currentFocusState = focusStateRef.current;

      // Focus Mode routing - if focused, use focusState values
      const effectiveTargetTriggerNode =
        options?.targetTriggerNode || currentFocusState?.targetTriggerNode || currentTargetTriggerNode;
      const effectiveChatId = options?.chatId || currentFocusState?.chatId;

      const userEntry = historyManager.addUserMessage(message, {
        workflowId: session.workflowId,
        targetTriggerNode: effectiveTargetTriggerNode,
        chatId: effectiveChatId, // Use focus chatId if available
      });

      sendUserAction("send_message", {
        message,
        chatId: effectiveChatId || userEntry.chatId, // Prefer focus chatId
        workflowId: session.workflowId,
        targetTriggerNode: effectiveTargetTriggerNode,
      });
    },
    [historyManager, sendUserAction, session.workflowId, currentTargetTriggerNode]
  );

  // Helper to emit action (for cross-boundary communication from templates)
  const emitAction = useCallback((type: string, data: any) => {
    window.dispatchEvent(
      new CustomEvent("gravity:action", {
        detail: { type, data, componentId: "template" },
      })
    );
  }, []);

  // Get setStreamingState from AI context to reset streaming when switching templates
  const setStreamingState = useAIContext((state) => state.setStreamingState);

  // Helper to load template without sending a message
  // IMPORTANT: Also updates the current targetTriggerNode so subsequent messages go to the right trigger
  // Also resets streaming state to prevent "Thinking..." from showing on the new template
  const loadTemplate = useCallback(
    (targetTriggerNode: string, options?: { chatId?: string }) => {
      setCurrentTargetTriggerNode(targetTriggerNode);
      // Reset streaming state when switching templates to prevent stale "Thinking..." state
      setStreamingState("idle");
      wsLoadTemplate(targetTriggerNode, options);
    },
    [wsLoadTemplate, setStreamingState]
  );

  // Helper to send agent messages through server pipeline
  const sendAgentMessage = useCallback(
    (data: {
      chatId: string;
      agentName?: string;
      source?: string;
      components: Array<{
        type: string;
        props: Record<string, any>;
        metadata?: Record<string, any>;
      }>;
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

  // ============================================
  // STABLE SUB-OBJECTS
  // Each sub-object is memoized independently so changes to one
  // don't cause re-renders in components that depend on another
  // ============================================

  // History context - ONLY changes when history array changes
  const historyContext = useMemo(
    () => ({
      entries: historyManager.history,
      getResponses: historyManager.getResponses,
    }),
    [historyManager.history, historyManager.getResponses]
  );

  // Session context - ONLY changes when session params change
  const sessionContext = useMemo(
    () => ({
      ...session,
      targetTriggerNode: currentTargetTriggerNode,
    }),
    [session, currentTargetTriggerNode]
  );

  // Actions context - stable functions for sending messages
  const actionsContext = useMemo(
    () => ({
      sendMessage,
      loadTemplate,
      sendAgentMessage,
      sendVoiceCallMessage: wsSendVoiceCallMessage,
      emitAction,
    }),
    [sendMessage, loadTemplate, sendAgentMessage, wsSendVoiceCallMessage, emitAction]
  );

  // Build client context using stable sub-objects
  // Now the context only recreates when the sub-objects themselves change
  const clientContext: ClientContext = useMemo(
    () => ({
      // Spread actions for backward compatibility
      ...actionsContext,
      // Stable sub-objects
      history: historyContext,
      session: sessionContext,
      suggestions,
      // Focus Mode - these are from Zustand, stable references
      focusState,
      openFocus,
      closeFocus,
    }),
    [actionsContext, historyContext, sessionContext, suggestions, focusState, openFocus, closeFocus]
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
          sessionParams={{ ...session, targetTriggerNode: currentTargetTriggerNode }}
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
