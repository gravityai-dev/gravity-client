/**
 * useHistoryManager - React hook for managing chat history
 *
 * Uses an event queue to process events in strict order, preventing race conditions
 * when async operations (like component loading) would otherwise cause events to
 * be processed out of order.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { HistoryManager, HistoryEntry } from "../../../core/HistoryManager";
import type { SessionParams } from "../../../core/types";
import type { TemplateInfo, HistoryEvent, UseHistoryManagerOptions, UseHistoryManagerReturn } from "./types";
import { processWorkflowState } from "./processWorkflowState";
import { processComponentInit } from "./processComponentInit";

export function useHistoryManager(
  sessionParams: SessionParams,
  options: UseHistoryManagerOptions = {}
): UseHistoryManagerReturn {
  const {
    loadComponent,
    sendComponentReady,
    events,
    withZustandData,
    openFocus,
    setComponentData,
    updateComponentData,
  } = options;

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
        await processWorkflowState({
          event,
          manager,
          activeResponsesRef,
          loadComponent,
          setActiveTemplate,
          setTemplateStack,
        });
        return;
      }

      // Handle COMPONENT_INIT events
      if (event.type === "COMPONENT_INIT") {
        await processComponentInit({
          event,
          manager,
          activeResponsesRef,
          loadComponent,
          sendComponentReady,
          withZustandData,
          setActiveTemplate,
          openFocus,
          setComponentData,
        });
        return;
      }
    },
    [loadComponent, sendComponentReady, withZustandData, manager, openFocus, setComponentData, updateComponentData]
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

  // Memoize bound functions to prevent new references on every render
  // This is critical for preventing unnecessary re-renders in consumers
  const boundFunctions = useMemo(
    () => ({
      addUserMessage: manager.addUserMessage.bind(manager),
      addResponse: manager.addResponse.bind(manager),
      updateResponse: manager.updateResponse.bind(manager),
      addComponentToResponse: manager.addComponentToResponse.bind(manager),
      getResponses: manager.getResponses.bind(manager),
      addComponent: manager.addComponentToResponse.bind(manager),
      updateEntry: manager.updateEntry.bind(manager),
      getAllComponents: manager.getAllComponents.bind(manager),
      getUserMessages: manager.getUserMessages.bind(manager),
      getByType: manager.getByType.bind(manager),
      getByRole: manager.getByRole.bind(manager),
      clear: manager.clear.bind(manager),
      toJSON: manager.toJSON.bind(manager),
    }),
    [manager]
  );

  return {
    history,
    stats,
    activeTemplate,
    templateStack,
    ...boundFunctions,
    processEvent,
    manager,
  };
}

export default useHistoryManager;
