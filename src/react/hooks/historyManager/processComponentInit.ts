/**
 * Process COMPONENT_INIT events
 */

import type { HistoryManager } from "../../../core/HistoryManager";
import type { TemplateInfo, ComponentInitEvent } from "./types";

interface ProcessComponentInitOptions {
  event: ComponentInitEvent;
  manager: HistoryManager;
  activeResponsesRef: React.MutableRefObject<Record<string, string>>;
  loadComponent?: (url: string, name: string) => Promise<any>;
  sendComponentReady?: (componentName: string, messageId: string) => void;
  withZustandData?: (Component: any) => any;
  setActiveTemplate: React.Dispatch<React.SetStateAction<TemplateInfo | null>>;
  openFocus?: (
    componentId: string,
    targetTriggerNode: string | null,
    chatId: string | null,
    agentName?: string | null
  ) => void;
  setComponentData?: (key: string, data: Record<string, any>) => void;
}

export async function processComponentInit({
  event,
  manager,
  activeResponsesRef,
  loadComponent,
  sendComponentReady,
  withZustandData,
  setActiveTemplate,
  openFocus,
  setComponentData,
}: ProcessComponentInitOptions): Promise<void> {
  const { component, nodeId, chatId } = event;

  // Handle template components
  if (nodeId && nodeId.includes("_template")) {
    if (loadComponent) {
      try {
        const Component = await loadComponent(component.componentUrl, component.type);
        setActiveTemplate({
          Component,
          name: component.type,
          nodeId,
          props: component.props || {},
        });
        sendComponentReady?.(component.type, event.id || "");
      } catch (error) {
        console.error("[History] Failed to load template:", component.type, error);
      }
    }
    return;
  }

  if (!chatId) {
    console.error("[useHistoryManager] COMPONENT_INIT missing chatId:", event.id);
    return;
  }

  console.log("[History] 📦 Loading component:", component.type, component.componentUrl);

  // Load component and wrap with Zustand data HOC
  if (loadComponent) {
    const LoadedComponent = await loadComponent(component.componentUrl, component.type);

    if (!LoadedComponent) {
      console.error("[History] ❌ Failed to load component:", component.type);
      return;
    }

    console.log("[History] ✅ Component loaded:", component.type, typeof LoadedComponent);

    // Wrap component with Zustand data HOC if provided
    const WrappedComponent = withZustandData ? withZustandData(LoadedComponent) : LoadedComponent;

    // Find the active response for this chatId
    const responseId = activeResponsesRef.current[chatId];
    if (responseId) {
      const updatedResponse = manager.addComponentToResponse(
        responseId,
        {
          type: component.type,
          componentUrl: component.componentUrl,
          nodeId,
          chatId,
          props: component.props || {},
          metadata: component.metadata || {},
        },
        WrappedComponent
      );

      console.log("[History] ✅ Component added to response:", component.type, responseId);

      // Write component data to Zustand (keyed by chatId_nodeId)
      if (setComponentData && component.props) {
        const stateKey = `${chatId}_${nodeId}`;
        console.log("[History] 📝 Setting component data in Zustand:", stateKey);
        setComponentData(stateKey, component.props);
      }

      // Auto-focus focusable components on load
      if (component.props?.focusable === true && openFocus && updatedResponse) {
        // Get the component ID from the last added component in the response
        const addedComponent = updatedResponse.components[updatedResponse.components.length - 1];
        const targetTriggerNode = component.metadata?.targetTriggerNode || null;
        const agentName = component.props?.focusLabel || component.type || null;

        if (addedComponent?.id) {
          openFocus(addedComponent.id, targetTriggerNode, chatId, agentName);
        }
      }
    } else {
      console.warn("[History] ⚠️ No active response for chatId:", chatId);
    }

    sendComponentReady?.(component.type, event.id || "");
  } else {
    console.error("[History] ❌ loadComponent function not available");
  }
}
