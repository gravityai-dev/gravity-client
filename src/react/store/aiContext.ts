import { create } from "zustand";
import type { StreamingState, WorkflowState } from "../../core/types";

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

  // Configuration
  apiBaseUrl: string;

  // Component Actions - universal event bus for component-to-client communication
  lastAction: ComponentAction | null;

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
  emitAction: (type: string, data: any, componentId?: string) => void;
  clearContext: () => void;
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
  apiBaseUrl: "",
  lastAction: null,

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
      lastAction: null,
    });
  },
}));
