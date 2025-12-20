import React from "react";
import { useAIContext } from "../store/aiContext";

/**
 * Higher-Order Component that wraps design system components with Zustand subscription
 *
 * This allows components to automatically re-render when their data updates in Zustand,
 * enabling real-time streaming updates from AI workflows.
 *
 * Key format: `${chatId}_${nodeId}` - isolates component instances per conversation turn
 */
export function withZustandData<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & { nodeId?: string; chatId?: string }> {
  return function WrappedComponent({ nodeId, chatId, ...props }: P & { nodeId?: string; chatId?: string }) {
    // Subscribe using chatId_nodeId to isolate component instances per conversation turn
    const stateKey = chatId && nodeId ? `${chatId}_${nodeId}` : nodeId || "";

    // Get component data from aiContext store
    const componentData = useAIContext((state) => state.componentData[stateKey] || {});
    const updateComponentData = useAIContext((state) => state.updateComponentData);

    // Create updateData function for component to update its own state
    const updateData = React.useCallback(
      (updates: Record<string, any>) => {
        if (stateKey) {
          updateComponentData(stateKey, updates);
        }
      },
      [stateKey, updateComponentData]
    );

    // Merge props: static props from history + dynamic data from Zustand
    // Zustand data takes precedence (spread last)
    const mergedProps = {
      ...props,
      ...componentData,
      nodeId,
      chatId,
      updateData, // Inject updateData function for component to update its state
    } as P;

    // Render the pure component with merged data
    return <Component {...mergedProps} />;
  };
}

export default withZustandData;
