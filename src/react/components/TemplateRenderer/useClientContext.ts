/**
 * useClientContext - Hook for building the client context for templates
 *
 * Provides:
 * - sendMessage (adds to history + triggers workflow)
 * - sendAgentMessage
 * - sendVoiceCallMessage
 * - emitAction
 * - history (read-only)
 * - session
 * - audio context
 */

import { useMemo, useCallback } from "react";
import type { HistoryManager, HistoryEntry } from "../../../core/HistoryManager";
import type { SessionParams } from "../../../core/types";
import type { AudioContext } from "../../../realtime/types";
import type { ClientContext } from "./types";

interface UseClientContextOptions {
  history: HistoryEntry[];
  historyManager: HistoryManager;
  sendUserAction: (action: string, data: Record<string, any>) => void;
  sendAgentMessage: (data: {
    content: string;
    chatId: string;
    agentName?: string;
    source?: string;
    props?: Record<string, any>;
    metadata?: Record<string, any>;
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
  // Helper to send a message (adds to history + triggers workflow)
  const sendMessage = useCallback(
    (message: string, options?: { targetTriggerNode?: string }) => {
      const userEntry = historyManager.addUserMessage(message, {
        workflowId: sessionParams.workflowId,
        targetTriggerNode: options?.targetTriggerNode || sessionParams.targetTriggerNode,
      });
      sendUserAction("send_message", {
        message,
        chatId: userEntry.chatId,
        workflowId: sessionParams.workflowId,
        targetTriggerNode: options?.targetTriggerNode || sessionParams.targetTriggerNode,
      });
    },
    [historyManager, sendUserAction, sessionParams]
  );

  // Helper to emit action (for cross-boundary communication from templates)
  const emitAction = useCallback((type: string, data: any) => {
    window.dispatchEvent(
      new CustomEvent("gravity:action", {
        detail: { type, data, componentId: "template" },
      })
    );
  }, []);

  // Build client context for template
  const clientContext: ClientContext = useMemo(() => {
    return {
      sendMessage,
      sendAgentMessage,
      sendVoiceCallMessage,
      emitAction,
      history: {
        entries: history,
        getResponses: historyManager.getResponses.bind(historyManager),
      },
      session: sessionParams,
      wsUrl,
      audio: audioContext,
    };
  }, [
    history,
    historyManager,
    sendMessage,
    sendAgentMessage,
    sendVoiceCallMessage,
    emitAction,
    sessionParams,
    wsUrl,
    audioContext,
  ]);

  return clientContext;
}
