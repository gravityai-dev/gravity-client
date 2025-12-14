/**
 * Types for TemplateRenderer
 */

import type { HistoryManager, HistoryEntry } from "../../../core/HistoryManager";
import type { SessionParams } from "../../../core/types";
import type { AudioContext } from "../../../realtime/types";

export interface TemplateInfo {
  Component: React.ComponentType<any>;
  name: string;
  nodeId?: string;
  props: Record<string, any>;
}

export interface ClientContext {
  /** Send a message to the workflow - handles history + server communication */
  sendMessage: (message: string, options?: { targetTriggerNode?: string }) => void;
  /** Send an agent message through server pipeline (for live agent, Amazon Connect, etc.) */
  sendAgentMessage: (data: {
    content: string;
    chatId: string;
    agentName?: string;
    source?: string;
    props?: Record<string, any>;
    metadata?: Record<string, any>;
  }) => void;
  /** Send a voice call control message (START_CALL or END_CALL) */
  sendVoiceCallMessage?: (data: {
    message: string;
    userId: string;
    chatId: string;
    conversationId: string;
    workflowId: string;
    targetTriggerNode: string;
    action: "START_CALL" | "END_CALL";
  }) => Promise<void>;
  /** Emit a custom action event (for cross-boundary communication) */
  emitAction: (type: string, data: any) => void;
  /** History for rendering (read-only) */
  history: {
    entries: HistoryEntry[];
    getResponses: HistoryManager["getResponses"];
  };
  /** Session context */
  session: SessionParams;
  /** WebSocket URL for audio connections */
  wsUrl?: string;
  /** Audio utilities for voice calls */
  audio?: AudioContext;
}

export interface TemplateRendererProps {
  template?: TemplateInfo | null;
  templateStack?: TemplateInfo[];
  history: HistoryEntry[];
  historyManager: HistoryManager;
  sendUserAction: (action: string, data: Record<string, any>) => void;
  /** Send agent message through server pipeline */
  sendAgentMessage: (data: {
    content: string;
    chatId: string;
    agentName?: string;
    source?: string;
    props?: Record<string, any>;
    metadata?: Record<string, any>;
  }) => void;
  /** Send voice call message (START_CALL or END_CALL) */
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
  /** WebSocket URL for audio connections */
  wsUrl?: string;
  /** Extra props to merge into template (e.g., amazonConnectConfig, salesforceConfig) */
  templateProps?: Record<string, any>;
  onStateChange?: (state: any) => void;
  onAction?: (actionType: string, actionData: any) => void;
  /** Send binary audio data via unified WebSocket */
  sendAudio?: (audioData: ArrayBuffer) => void;
  /** Ref to set playAudio callback for receiving audio */
  playAudioRef?: React.MutableRefObject<(audioData: ArrayBuffer) => void>;
  /** Ref to set audio state callback for templates to subscribe to */
  audioStateCallbackRef?: React.MutableRefObject<((state: string, metadata?: Record<string, any>) => void) | null>;
  /** Send JSON message via WebSocket (for control messages like AUDIO_CONTROL) */
  sendMessage?: (message: Record<string, any>) => void;
}
