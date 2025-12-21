/**
 * useClientContext - Hook for building the client context for templates
 *
 * ARCHITECTURE: Stable Sub-Objects Pattern
 * =========================================
 * Each sub-object (history, focus, suggestions, etc.) is memoized separately
 * so that changes to one don't cause unnecessary re-renders of components
 * that only depend on another.
 *
 * Example: When focusState changes (open/close focus mode), the history
 * object reference stays stable, so templates that depend on history
 * don't re-render or trigger scroll-to-bottom effects.
 *
 * Provides:
 * - sendMessage (adds to history + triggers workflow)
 * - sendAgentMessage
 * - sendVoiceCallMessage
 * - emitAction
 * - history (read-only) - STABLE: only changes when history content changes
 * - session
 * - audio context
 * - focusState - STABLE: only changes when focus state changes
 * - suggestions - STABLE: only changes when suggestions change
 */

import { useMemo, useCallback, useRef } from "react";
import type { HistoryManager, HistoryEntry } from "../../../core/HistoryManager";
import type { SessionParams, Suggestions } from "../../../core/types";
import type { AudioContext } from "../../../realtime/types";
import type { ClientContext } from "./types";
import { useAIContext } from "../../store/aiContext";

interface UseClientContextOptions {
  history: HistoryEntry[];
  historyManager: HistoryManager;
  sendUserAction: (action: string, data: Record<string, any>) => void;
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
  sendVoiceCallMessage?: (data: {
    message: string;
    userId: string;
    chatId: string;
    conversationId: string;
    workflowId: string;
    targetTriggerNode: string;
    action: "START_CALL" | "END_CALL";
  }) => Promise<void>;
  sessionParams: SessionParams;
  wsUrl?: string;
  audioContext: AudioContext;
}

export function useClientContext({
  history,
  historyManager,
  sendUserAction,
  sendAgentMessage,
  sendVoiceCallMessage,
  sessionParams,
  wsUrl,
  audioContext,
}: UseClientContextOptions): ClientContext {
  // Get suggestions from Zustand store (reactive)
  const suggestions = useAIContext((s) => s.suggestions);
  const clearSuggestions = useAIContext((s) => s.clearSuggestions);

  // Get focus state from Zustand store (reactive)
  const focusState = useAIContext((s) => s.focusState);
  const openFocus = useAIContext((s) => s.openFocus);
  const closeFocus = useAIContext((s) => s.closeFocus);

  // Use ref for focusState in sendMessage to avoid recreating the callback
  // when focusState changes (sendMessage reads current value at call time)
  const focusStateRef = useRef(focusState);
  focusStateRef.current = focusState;

  // Helper to send a message (adds to history + triggers workflow)
  // Focus Mode: When focused, route to focusState.targetTriggerNode with focusState.chatId
  // Uses ref for focusState to keep callback stable
  const sendMessage = useCallback(
    (message: string, options?: { targetTriggerNode?: string; chatId?: string }) => {
      // Clear suggestions when user sends a new message
      clearSuggestions();

      // Read current focusState from ref (not stale closure)
      const currentFocusState = focusStateRef.current;

      // Focus Mode routing: use focusState if active and no explicit override
      const effectiveTargetTriggerNode =
        options?.targetTriggerNode ||
        (currentFocusState?.focusedComponentId ? currentFocusState.targetTriggerNode : null) ||
        sessionParams.targetTriggerNode;

      const effectiveChatId =
        options?.chatId || (currentFocusState?.focusedComponentId ? currentFocusState.chatId : null);

      const userEntry = historyManager.addUserMessage(message, {
        workflowId: sessionParams.workflowId,
        targetTriggerNode: effectiveTargetTriggerNode,
        chatId: effectiveChatId || undefined,
      });
      sendUserAction("send_message", {
        message,
        chatId: effectiveChatId || userEntry.chatId,
        workflowId: sessionParams.workflowId,
        targetTriggerNode: effectiveTargetTriggerNode,
      });
    },
    [historyManager, sendUserAction, sessionParams, clearSuggestions]
  );

  // Helper to emit action (for cross-boundary communication from templates)
  const emitAction = useCallback((type: string, data: any) => {
    window.dispatchEvent(
      new CustomEvent("gravity:action", {
        detail: { type, data, componentId: "template" },
      })
    );
  }, []);

  // ============================================
  // STABLE SUB-OBJECTS
  // Each sub-object is memoized independently so changes to one
  // don't cause re-renders in components that depend on another
  // ============================================

  // History context - ONLY changes when history array changes
  const historyContext = useMemo(
    () => ({
      entries: history,
      getResponses: historyManager.getResponses.bind(historyManager),
    }),
    [history, historyManager]
  );

  // Actions context - stable functions for sending messages
  const actionsContext = useMemo(
    () => ({
      sendMessage,
      sendAgentMessage,
      sendVoiceCallMessage,
      emitAction,
    }),
    [sendMessage, sendAgentMessage, sendVoiceCallMessage, emitAction]
  );

  // Build client context for template
  // Now uses stable sub-objects, so the context only recreates when
  // the sub-objects themselves change (not when unrelated state changes)
  const clientContext: ClientContext = useMemo(() => {
    return {
      // Spread actions for backward compatibility
      ...actionsContext,
      // Stable sub-objects
      history: historyContext,
      session: sessionParams,
      suggestions,
      wsUrl,
      audio: audioContext,
      // Focus Mode - these are from Zustand, stable references
      focusState,
      openFocus,
      closeFocus,
    };
  }, [
    actionsContext,
    historyContext,
    sessionParams,
    suggestions,
    wsUrl,
    audioContext,
    focusState,
    openFocus,
    closeFocus,
  ]);

  return clientContext;
}
