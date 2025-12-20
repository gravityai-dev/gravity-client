/**
 * Types for TemplateRenderer
 */

import type { HistoryManager, HistoryEntry } from "../../../core/HistoryManager";
import type { SessionParams, Suggestions } from "../../../core/types";
import type { AudioContext } from "../../../realtime/types";

export interface TemplateInfo {
  Component: React.ComponentType<any>;
  name: string;
  nodeId?: string;
  props: Record<string, any>;
}

/** Focus state for component-centric conversations */
export interface FocusState {
  /** ID of the focused component (matches component.id in history) */
  focusedComponentId: string | null;
  /** Target trigger node for routing messages when focused */
  targetTriggerNode: string | null;
  /** Chat ID to use when focused (same chatId = update existing component) */
  chatId: string | null;
}

export interface ClientContext {
  /** Send a message to the workflow - handles history + server communication */
  sendMessage: (message: string, options?: { targetTriggerNode?: string; chatId?: string }) => void;
  /** Send an agent message through server pipeline (for live agent, Amazon Connect, etc.) */
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
  /** Suggestions from workflow (FAQs, Actions, Recommendations) */
  suggestions?: Suggestions;
  /** WebSocket URL for audio connections */
  wsUrl?: string;
  /** Audio utilities for voice calls */
  audio?: AudioContext;
  /** Focus state for component-centric conversations */
  focusState?: FocusState;
  /** Open focus mode for a component */
  openFocus?: (componentId: string, targetTriggerNode: string | null, chatId: string | null) => void;
  /** Close focus mode */
  closeFocus?: () => void;
}

export interface TemplateRendererProps {
  template?: TemplateInfo | null;
  templateStack?: TemplateInfo[];
  history: HistoryEntry[];
  historyManager: HistoryManager;
  sendUserAction: (action: string, data: Record<string, any>) => void;
  /** Send agent message through server pipeline */
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
