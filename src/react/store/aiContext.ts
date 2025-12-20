import { create } from "zustand";
import type { StreamingState, WorkflowState, Suggestions } from "../../core/types";
import type { AudioState } from "../../realtime/types";

/**
 * AI Context Store - Shared state for all streamed components
 * Components can read/write to this shared context
 */

/**
 * Component Action - emitted by streamed components, consumed by client apps
 */
export interface ComponentAction {
  type: string;
  data: any;
  timestamp: number;
  componentId?: string;
}

/**
 * Focus State - for component-centric conversations
 * When a component is focused, messages route to its trigger and update it in place
 */
export interface FocusState {
  /** ID of the focused component (matches component.id in history) */
  focusedComponentId: string | null;
  /** Target trigger node for routing messages when focused */
  targetTriggerNode: string | null;
  /** Chat ID to use when focused (same chatId = update existing component) */
  chatId: string | null;
}

/**
 * Audio/Voice call state
 */
export type CallStatus = "idle" | "connecting" | "connected" | "ended" | "error";

interface AIContextState {
  // Identity
  userId: string | null;
  conversationId: string | null;
  chatId: string | null;

  // Session data - shared between components
  sessionData: Record<string, any>;

  // Streaming state
  streamingState: StreamingState;
  streamingComponent: string | null;

  // Workflow state
  workflowState: WorkflowState;
  workflowId: string | null;
  workflowRunId: string | null;

  // Audio/Voice state
  audioState: AudioState | null;
  callStatus: CallStatus;
  isAssistantSpeaking: boolean;
  isUserSpeaking: boolean;

  // Configuration
  apiBaseUrl: string;

  // Suggestions - FAQs, Actions, Recommendations from workflow
  suggestions: Suggestions;

  // Component Actions - universal event bus for component-to-client communication
  lastAction: ComponentAction | null;

  // Focus Mode - for component-centric conversations
  focusState: FocusState;

  // Component Data - universal state for ALL Design System components
  // Keyed by `${chatId}_${nodeId}` to support multiple instances
  componentData: Record<string, Record<string, any>>;

  // Actions
  initContext: (context: {
    userId?: string;
    conversationId?: string;
    chatId?: string;
    sessionData?: Record<string, any>;
  }) => void;
  updateSessionData: (updates: Record<string, any>) => void;
  setStreamingState: (streamingState: StreamingState, componentName?: string | null) => void;
  setWorkflowState: (state: WorkflowState, workflowId?: string | null, workflowRunId?: string | null) => void;
  setAudioState: (audioState: AudioState | null) => void;
  setCallStatus: (callStatus: CallStatus) => void;
  setAssistantSpeaking: (isSpeaking: boolean) => void;
  setUserSpeaking: (isSpeaking: boolean) => void;
  emitAction: (type: string, data: any, componentId?: string) => void;
  setSuggestions: (suggestions: Suggestions) => void;
  clearSuggestions: () => void;
  clearContext: () => void;
  /** Open focus mode for a component */
  openFocus: (componentId: string, targetTriggerNode: string | null, chatId: string | null) => void;
  /** Close focus mode */
  closeFocus: () => void;

  // Component Data Actions
  /** Set component data (for COMPONENT_INIT) */
  setComponentData: (key: string, data: Record<string, any>) => void;
  /** Update component data (for COMPONENT_DATA or user interactions) */
  updateComponentData: (key: string, updates: Record<string, any>) => void;
  /** Get component data */
  getComponentData: (key: string) => Record<string, any> | undefined;
}

export const useAIContext = create<AIContextState>((set) => ({
  // Initial state
  userId: null,
  conversationId: null,
  chatId: null,
  sessionData: {},
  streamingState: "idle",
  streamingComponent: null,
  workflowState: null,
  workflowId: null,
  workflowRunId: null,
  audioState: null,
  callStatus: "idle",
  isAssistantSpeaking: false,
  isUserSpeaking: false,
  apiBaseUrl: "",
  suggestions: { faqs: [], actions: [], recommendations: [] },
  lastAction: null,
  focusState: { focusedComponentId: null, targetTriggerNode: null, chatId: null },
  componentData: {},

  // Actions
  initContext: (context) => {
    set({
      userId: context.userId || null,
      conversationId: context.conversationId || null,
      chatId: context.chatId || null,
      sessionData: context.sessionData || {},
    });
  },

  updateSessionData: (updates) => {
    set((state) => ({
      sessionData: {
        ...state.sessionData,
        ...updates,
      },
    }));
  },

  setStreamingState: (streamingState, componentName = null) => {
    set({
      streamingState,
      streamingComponent: componentName,
    });
  },

  setWorkflowState: (state, workflowId = null, workflowRunId = null) => {
    const updates: Partial<AIContextState> = {
      workflowState: state,
      workflowId,
      workflowRunId,
    };

    // Auto-update streamingState based on workflow state
    if (state === "WORKFLOW_STARTED" || state === "THINKING" || state === "RESPONDING" || state === "WAITING") {
      updates.streamingState = "streaming";
    } else if (
      state === "WORKFLOW_COMPLETED" ||
      state === "COMPLETE" ||
      state === "ERROR" ||
      state === "WORKFLOW_ERROR"
    ) {
      updates.streamingState = "complete";
    }

    set(updates);
  },

  setAudioState: (audioState) => {
    const updates: Partial<AIContextState> = { audioState };
    // Auto-update speaking states based on audio state
    if (audioState === "SPEECH_STARTED") {
      updates.isAssistantSpeaking = true;
    } else if (audioState === "SPEECH_ENDED") {
      updates.isAssistantSpeaking = false;
    } else if (audioState === "SESSION_READY") {
      updates.callStatus = "connected";
    } else if (audioState === "SESSION_ENDED") {
      updates.callStatus = "ended";
      updates.isAssistantSpeaking = false;
      updates.isUserSpeaking = false;
    }
    set(updates);
  },

  setCallStatus: (callStatus) => {
    set({ callStatus });
  },

  setAssistantSpeaking: (isSpeaking) => {
    set({ isAssistantSpeaking: isSpeaking });
  },

  setUserSpeaking: (isSpeaking) => {
    set({ isUserSpeaking: isSpeaking });
  },

  emitAction: (type, data, componentId) => {
    set({
      lastAction: {
        type,
        data,
        timestamp: Date.now(),
        componentId,
      },
    });
  },

  setSuggestions: (suggestions) => {
    set({ suggestions });
  },

  clearSuggestions: () => {
    set({ suggestions: { faqs: [], actions: [], recommendations: [] } });
  },

  clearContext: () => {
    set({
      userId: null,
      conversationId: null,
      chatId: null,
      sessionData: {},
      streamingState: "idle",
      streamingComponent: null,
      workflowState: null,
      workflowId: null,
      workflowRunId: null,
      audioState: null,
      callStatus: "idle",
      isAssistantSpeaking: false,
      isUserSpeaking: false,
      suggestions: { faqs: [], actions: [], recommendations: [] },
      lastAction: null,
      focusState: { focusedComponentId: null, targetTriggerNode: null, chatId: null },
    });
  },

  openFocus: (componentId, targetTriggerNode, chatId) => {
    set({
      focusState: {
        focusedComponentId: componentId,
        targetTriggerNode,
        chatId,
      },
    });
  },

  closeFocus: () => {
    set({
      focusState: {
        focusedComponentId: null,
        targetTriggerNode: null,
        chatId: null,
      },
    });
  },

  // Component Data Actions
  setComponentData: (key, data) => {
    set((state) => ({
      componentData: {
        ...state.componentData,
        [key]: data,
      },
    }));
  },

  updateComponentData: (key, updates) => {
    set((state) => ({
      componentData: {
        ...state.componentData,
        [key]: {
          ...(state.componentData[key] || {}),
          ...updates,
        },
      },
    }));
  },

  getComponentData: (key) => {
    return useAIContext.getState().componentData[key];
  },
}));
