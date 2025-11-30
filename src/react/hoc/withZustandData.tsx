import React from "react";
import { useComponentData } from "../store/componentData";

/**
 * Higher-Order Component that wraps design system components with Zustand subscription
 *
 * This allows components to automatically re-render when their data updates in Zustand,
 * enabling real-time streaming updates from AI workflows.
 */
export function withZustandData<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & { nodeId?: string; chatId?: string }> {
  return function WrappedComponent({ nodeId, chatId, ...props }: P & { nodeId?: string; chatId?: string }) {
    // Subscribe using chatId + nodeId to isolate component instances per conversation turn
    const subscriptionKey = chatId && nodeId ? `${chatId}:${nodeId}` : nodeId || "";

    const storeData = useComponentData((state) => state.data[subscriptionKey] || {});

    // Merge props: static props from history + dynamic data from Zustand
    // Zustand data takes precedence (spread last)
    const mergedProps = {
      ...props,
      ...storeData,
    } as P;

    // Render the pure component with merged data
    return <Component {...mergedProps} />;
  };
}

export default withZustandData;
