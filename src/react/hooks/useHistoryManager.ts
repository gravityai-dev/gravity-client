import { useState, useEffect, useRef, useCallback } from "react";
import { HistoryManager, HistoryEntry } from "../../core/HistoryManager";
import type { SessionParams, WorkflowStateMessage } from "../../core/types";

interface TemplateInfo {
  Component: any;
  name: string;
  nodeId?: string;
  props: Record<string, any>;
}

interface ComponentInitEvent {
  type: "COMPONENT_INIT";
  id?: string;
  chatId: string;
  nodeId: string;
  component: {
    type: string;
    componentUrl: string;
    props?: Record<string, any>;
    metadata?: Record<string, any>;
  };
}

interface WorkflowStateEvent extends WorkflowStateMessage {
  id?: string;
}

type HistoryEvent = ComponentInitEvent | WorkflowStateEvent;

interface UseHistoryManagerOptions {
  loadComponent?: (url: string, name: string) => Promise<any>;
  sendComponentReady?: (componentName: string, messageId: string) => void;
  events?: HistoryEvent[];
  withZustandData?: (Component: any) => any;
}

interface UseHistoryManagerReturn {
  history: HistoryEntry[];
  stats: ReturnType<HistoryManager["getStats"]>;
  activeTemplate: TemplateInfo | null;
  templateStack: TemplateInfo[];
  addUserMessage: HistoryManager["addUserMessage"];
  addResponse: HistoryManager["addResponse"];
  updateResponse: HistoryManager["updateResponse"];
  addComponentToResponse: HistoryManager["addComponentToResponse"];
  getResponses: HistoryManager["getResponses"];
  addComponent: HistoryManager["addComponentToResponse"];
  updateEntry: HistoryManager["updateEntry"];
  processEvent: (event: HistoryEvent) => Promise<void>;
  getAllComponents: HistoryManager["getAllComponents"];
  getUserMessages: HistoryManager["getUserMessages"];
  getByType: HistoryManager["getByType"];
  getByRole: HistoryManager["getByRole"];
  clear: HistoryManager["clear"];
  toJSON: HistoryManager["toJSON"];
  manager: HistoryManager;
}

/**
 * Hook to use HistoryManager with React state
 *
 * Uses an event queue to process events in strict order, preventing race conditions
 * when async operations (like component loading) would otherwise cause events to
 * be processed out of order.
 */
export function useHistoryManager(
  sessionParams: SessionParams,
  options: UseHistoryManagerOptions = {}
): UseHistoryManagerReturn {
  const { loadComponent, sendComponentReady, events, withZustandData } = options;

  const managerRef = useRef<HistoryManager | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [stats, setStats] = useState<ReturnType<HistoryManager["getStats"]>>({
    total: 0,
    userMessages: 0,
    responses: 0,
    streamingResponses: 0,
    totalComponents: 0,
    conversationId: null,
    userId: null,
  });
  const [activeTemplate, setActiveTemplate] = useState<TemplateInfo | null>(null);
  const [templateStack, setTemplateStack] = useState<TemplateInfo[]>([]);
  const processedEventIds = useRef<Set<string>>(new Set());
  const activeResponsesRef = useRef<Record<string, string>>({});

  // Event queue for sequential processing
  const eventQueueRef = useRef<HistoryEvent[]>([]);
  const isProcessingRef = useRef(false);

  // Initialize manager once
  if (!managerRef.current) {
    managerRef.current = new HistoryManager();
  }

  const manager = managerRef.current;

  // Initialize with session params
  useEffect(() => {
    if (sessionParams) {
      manager.init({
        conversationId: sessionParams.conversationId,
        userId: sessionParams.userId,
      });
    }
  }, [sessionParams?.conversationId, sessionParams?.userId]);

  // Subscribe to history changes
  useEffect(() => {
    const unsubscribe = manager.subscribe((event, data) => {
      if (event === "change") {
        setHistory([...data]);
        setStats(manager.getStats());
      }
    });

    // Initial state
    setHistory(manager.getHistory());
    setStats(manager.getStats());

    return unsubscribe;
  }, []);

  // Process a single event
  const processEvent = useCallback(
    async (event: HistoryEvent) => {
      // Handle WORKFLOW_STATE events
      if (event.type === "WORKFLOW_STATE") {
        const { state, chatId, workflowId, workflowRunId, metadata } = event as WorkflowStateEvent;

        if (state === "WORKFLOW_STARTED") {
          console.log("[History] WORKFLOW_STARTED", { chatId, workflowId });

          // Extract template from metadata if provided
          const template = metadata?.template;
          const templateMode = metadata?.templateMode || "switch";

          // Load template if provided AND it's different from current
          if (template && loadComponent) {
            setActiveTemplate((currentTemplate) => {
              if (currentTemplate?.name === template) {
                console.log(`[History] ⏭️ Template already active: ${template}, skipping switch`);
                return currentTemplate;
              }

              // Load new template
              (async () => {
                try {
                  const templateUrl = `/components/${template}.js`;
                  const TemplateComponent = await loadComponent(templateUrl, template);
                  const newTemplate: TemplateInfo = {
                    Component: TemplateComponent,
                    name: template,
                    props: {},
                  };

                  if (templateMode === "stack") {
                    setTemplateStack((prev) => [...prev, newTemplate]);
                    console.log(`[History] ✅ Template stacked: ${template}`);
                  } else if (templateMode === "replace") {
                    setTemplateStack((prev) => {
                      const newStack = [...prev];
                      newStack[newStack.length - 1] = newTemplate;
                      return newStack;
                    });
                    console.log(`[History] ✅ Template replaced: ${template}`);
                  } else {
                    setActiveTemplate(newTemplate);
                    setTemplateStack([newTemplate]);
                    console.log(`[History] ✅ Template switched: ${template}`);
                  }
                } catch (error) {
                  console.error("[History] Failed to load template:", template, error);
                }
              })();

              return currentTemplate;
            });
          }

          // Check if response already exists for this chatId
          const existingResponseId = activeResponsesRef.current[chatId];
          if (existingResponseId) {
            console.log("[History] ♻️ Reusing existing response for chatId:", chatId);
            manager.updateResponse(existingResponseId, { streamingState: "streaming" });
            return;
          }

          // Create response with streaming state
          const response = manager.addResponse({
            chatId,
            streamingState: "streaming",
            components: [],
          });

          activeResponsesRef.current[chatId] = response.id;
          console.log("[History] ✅ Response created:", response.id);
        } else if (state === "WORKFLOW_COMPLETED") {
          console.log("[History] ✅ WORKFLOW_COMPLETED - Updating response", {
            chatId,
            workflowId,
          });

          const responseId = activeResponsesRef.current[chatId];
          if (responseId) {
            manager.updateResponse(responseId, { streamingState: "complete" });
            console.log("[History] ✅ Response completed:", responseId);
          } else {
            console.warn("[History] ⚠️ No active response found for chatId:", chatId);
          }
        }

        return;
      }

      // Handle COMPONENT_INIT events
      if (event.type === "COMPONENT_INIT") {
        const { component, nodeId, chatId } = event as ComponentInitEvent;

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

        console.log("[History] Adding workflow component:", component.type, nodeId);

        // Load component and wrap with Zustand data HOC
        if (loadComponent) {
          const LoadedComponent = await loadComponent(component.componentUrl, component.type);

          // Wrap component with Zustand data HOC if provided
          const WrappedComponent = withZustandData ? withZustandData(LoadedComponent) : LoadedComponent;

          // Find the active response for this chatId
          const responseId = activeResponsesRef.current[chatId];
          if (responseId) {
            manager.addComponentToResponse(
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

            console.log("[History] Component added to response:", component.type, responseId);
          } else {
            console.warn("[History] No active response for chatId:", chatId);
          }

          sendComponentReady?.(component.type, event.id || "");
        }
        return;
      }
    },
    [loadComponent, sendComponentReady, withZustandData, manager]
  );

  // Process queue sequentially
  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) {
      console.log("[History] ⏳ Queue already processing, skipping");
      return;
    }
    isProcessingRef.current = true;

    console.log(`[History] 📋 Processing queue: ${eventQueueRef.current.length} events`);

    while (eventQueueRef.current.length > 0) {
      const event = eventQueueRef.current.shift()!;

      if (event.id && processedEventIds.current.has(event.id)) {
        console.log(`[History] ⏭️ Skipping already processed: ${event.type}`);
        continue;
      }

      console.log(`[History] ▶️ Processing: ${event.type}`);

      try {
        await processEvent(event);
        if (event.id) {
          processedEventIds.current.add(event.id);
        }
        console.log(`[History] ✅ Completed: ${event.type}`);
      } catch (error) {
        console.error("[History] ❌ Error processing event:", event.type, error);
      }
    }

    console.log("[History] 📋 Queue empty, processing complete");
    isProcessingRef.current = false;
  }, [processEvent]);

  // Process incoming events - add to queue
  useEffect(() => {
    if (!events || events.length === 0) return;

    events.forEach((event) => {
      if (event.id && processedEventIds.current.has(event.id)) return;

      const alreadyQueued = eventQueueRef.current.some((e) => e.id === event.id);
      if (!alreadyQueued) {
        eventQueueRef.current.push(event);
      }
    });

    processQueue();
  }, [events, processQueue]);

  return {
    history,
    stats,
    activeTemplate,
    templateStack,
    addUserMessage: manager.addUserMessage.bind(manager),
    addResponse: manager.addResponse.bind(manager),
    updateResponse: manager.updateResponse.bind(manager),
    addComponentToResponse: manager.addComponentToResponse.bind(manager),
    getResponses: manager.getResponses.bind(manager),
    addComponent: manager.addComponentToResponse.bind(manager),
    updateEntry: manager.updateEntry.bind(manager),
    processEvent,
    getAllComponents: manager.getAllComponents.bind(manager),
    getUserMessages: manager.getUserMessages.bind(manager),
    getByType: manager.getByType.bind(manager),
    getByRole: manager.getByRole.bind(manager),
    clear: manager.clear.bind(manager),
    toJSON: manager.toJSON.bind(manager),
    manager,
  };
}

export default useHistoryManager;
