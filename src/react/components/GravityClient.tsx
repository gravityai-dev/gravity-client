import React, { useEffect, useMemo } from "react";
import { useGravityWebSocket } from "../hooks/useGravityWebSocket";
import { useComponentLoader } from "../hooks/useComponentLoader";
import { useHistoryManager } from "../hooks/useHistoryManager";
import { withZustandData } from "../hoc/withZustandData";
import { TemplateRenderer } from "./TemplateRenderer";
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
  history: {
    entries: HistoryEntry[];
    addUserMessage: HistoryManager["addUserMessage"];
    addResponse: HistoryManager["addResponse"];
    updateResponse: HistoryManager["updateResponse"];
    addComponentToResponse: HistoryManager["addComponentToResponse"];
    getResponses: HistoryManager["getResponses"];
  };
  websocket: {
    sendUserAction: (action: string, data: Record<string, any>) => void;
  };
  session: SessionParams;
}

interface GravityClientProps {
  /** Gravity server configuration */
  config: GravityConfig;
  /** Session parameters */
  session: SessionParams;
  /** Callback when connection is ready */
  onReady?: (context: {
    historyManager: ReturnType<typeof useHistoryManager>;
    sendUserAction: (action: string, data: Record<string, any>) => void;
    sessionParams: SessionParams;
  }) => void;
  /** Callback when template state changes */
  onStateChange?: (state: any) => void;
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
  onReady,
  onStateChange,
  LoadingComponent,
  children,
}: GravityClientProps): JSX.Element {
  // WebSocket connection - build full URL from base
  const wsFullUrl = `${config.wsUrl}${WS_ENDPOINTS.GRAVITY_DS}`;
  const { isConnected, isReady, events, sendComponentReady, sendUserAction } = useGravityWebSocket(session, wsFullUrl);

  // Component loader
  const { loadComponent } = useComponentLoader(config.apiUrl);

  // History manager
  const historyManager = useHistoryManager(session, {
    loadComponent,
    sendComponentReady,
    events: events as any,
    withZustandData,
  });

  // Notify parent when ready
  useEffect(() => {
    if (isReady) {
      onReady?.({ historyManager, sendUserAction, sessionParams: session });
    }
  }, [isReady]);

  // Build client context
  const clientContext: ClientContext = useMemo(
    () => ({
      history: {
        entries: historyManager.history,
        addUserMessage: historyManager.addUserMessage,
        addResponse: historyManager.addResponse,
        updateResponse: historyManager.updateResponse,
        addComponentToResponse: historyManager.addComponentToResponse,
        getResponses: historyManager.getResponses,
      },
      websocket: {
        sendUserAction,
      },
      session,
    }),
    [historyManager, sendUserAction, session]
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
          sessionParams={session}
          onStateChange={onStateChange}
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
