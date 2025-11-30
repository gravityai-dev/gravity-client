import React from "react";
import { ShadowDOMWrapper } from "./ShadowDOMRenderer";
import { useComponentData } from "../store/componentData";
import { useAIContext } from "../store/aiContext";
import { ErrorBoundary } from "./ErrorBoundary";

interface ComponentData {
  Component: React.ComponentType<any>;
  name: string;
  props: Record<string, any>;
  nodeId?: string;
}

interface ComponentRendererProps {
  component: ComponentData;
  onAction?: (actionType: string, actionData: any) => void;
}

/**
 * Renders a dynamically loaded component in Shadow DOM for CSS isolation
 * Uses the universal ShadowDOMRenderer for consistent behavior
 */
export function ComponentRenderer({ component, onAction }: ComponentRendererProps): JSX.Element {
  const { Component, name, props, nodeId } = component;

  if (!Component) {
    return (
      <div
        style={{
          border: "1px solid #fecaca",
          backgroundColor: "#fef2f2",
          borderRadius: "8px",
          padding: "16px",
        }}
      >
        <p style={{ color: "#dc2626", fontSize: "14px", margin: 0 }}>Failed to load component: {name}</p>
      </div>
    );
  }

  // Get data from Zustand store if nodeId exists
  const storeData = nodeId ? useComponentData((state) => state.data[nodeId] || {}) : {};

  // Get workflow state from AI context for templates
  const { workflowState, workflowId, workflowRunId } = useAIContext();
  const streamingState = useAIContext((state) => state.streamingState);

  // Merge store data with props (store data takes precedence)
  const mergedProps = {
    ...props,
    ...storeData,
  };

  // Enhance props with generic action handlers AND workflow state
  const enhancedProps = {
    ...mergedProps,

    // Workflow state from Zustand (for templates)
    workflowState,
    isStreaming: streamingState === "streaming",
    workflowId,
    workflowRunId,

    // Generic action sender
    onAction: (actionType: string, actionData: any) => {
      onAction?.(actionType, actionData);
    },

    // Convenience handlers
    onSend: (message: string) => {
      onAction?.("send_message", { message });
    },

    onClick: (data: any) => {
      onAction?.("click", data);
    },

    onSubmit: (data: any) => {
      onAction?.("submit", data);
    },

    onChange: (data: any) => {
      onAction?.("change", data);
    },
  };

  // Layout templates (ChatLayout, etc.) should fill available space
  const isLayout = name.includes("Layout");
  const containerStyle: React.CSSProperties = isLayout
    ? { width: "100%", flex: 1, display: "flex", flexDirection: "column" }
    : { width: "100%", height: "100%", minHeight: "200px" };

  // Use ShadowDOMWrapper with ErrorBoundary
  return (
    <div style={containerStyle}>
      <ErrorBoundary componentName={name} showRetry>
        <ShadowDOMWrapper
          Component={Component}
          componentName={name}
          props={enhancedProps}
          className={isLayout ? "layout-container" : ""}
        />
      </ErrorBoundary>
    </div>
  );
}

export default ComponentRenderer;
