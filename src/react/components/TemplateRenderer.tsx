import React, { useMemo } from "react";
import { ComponentRenderer } from "./ComponentRenderer";
import type { HistoryManager, HistoryEntry } from "../../core/HistoryManager";
import type { SessionParams } from "../../core/types";

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
    addComponent?: HistoryManager["addComponentToResponse"];
    updateEntry?: HistoryManager["updateEntry"];
  };
  websocket: {
    sendUserAction: (action: string, data: Record<string, any>) => void;
  };
  session: SessionParams;
}

interface TemplateRendererProps {
  template?: TemplateInfo | null;
  templateStack?: TemplateInfo[];
  history: HistoryEntry[];
  historyManager: HistoryManager;
  sendUserAction: (action: string, data: Record<string, any>) => void;
  sessionParams: SessionParams;
  onStateChange?: (state: any) => void;
}

/**
 * TemplateRenderer - Universal template rendering component
 *
 * Renders any Gravity template with the standard client context.
 * Uses a single Shadow DOM for the template and all its child components.
 */
export function TemplateRenderer({
  template,
  templateStack,
  history,
  historyManager,
  sendUserAction,
  sessionParams,
  onStateChange,
}: TemplateRendererProps): JSX.Element | null {
  if (!template && (!templateStack || templateStack.length === 0)) {
    return null;
  }

  // Build client context for template
  // Include history in deps so context updates when history changes
  const clientContext: ClientContext = useMemo(() => {
    return {
      history: {
        entries: history,
        addUserMessage: historyManager.addUserMessage.bind(historyManager),
        addResponse: historyManager.addResponse.bind(historyManager),
        updateResponse: historyManager.updateResponse.bind(historyManager),
        addComponentToResponse: historyManager.addComponentToResponse.bind(historyManager),
        getResponses: historyManager.getResponses.bind(historyManager),
        // Backward compatibility
        addComponent: historyManager.addComponentToResponse.bind(historyManager),
        updateEntry: historyManager.updateEntry.bind(historyManager),
      },
      websocket: {
        sendUserAction,
      },
      session: sessionParams,
    };
  }, [history, historyManager, sendUserAction, sessionParams]);

  // If we have a template stack, render all templates as layers
  if (templateStack && templateStack.length > 0) {
    return (
      <div style={{ position: "relative", height: "100%", width: "100%" }}>
        {templateStack.map((tmpl, index) => {
          const isTop = index === templateStack.length - 1;
          return (
            <div
              key={`${tmpl.name}-${index}`}
              style={{
                position: "absolute",
                inset: 0,
                zIndex: index * 10,
                pointerEvents: isTop ? "auto" : "none",
              }}
            >
              <ComponentRenderer
                component={{
                  Component: tmpl.Component,
                  name: tmpl.name,
                  nodeId: tmpl.nodeId,
                  props: {
                    ...tmpl.props,
                    client: clientContext,
                    onStateChange: onStateChange,
                  },
                }}
              />
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback: single template (backward compatibility)
  if (!template) return null;

  return (
    <ComponentRenderer
      key={template.name}
      component={{
        Component: template.Component,
        name: template.name,
        nodeId: template.nodeId,
        props: {
          ...template.props,
          client: clientContext,
          onStateChange: onStateChange,
        },
      }}
    />
  );
}

export default TemplateRenderer;
