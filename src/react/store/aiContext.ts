import { create } from "zustand";
import type { StreamingState, WorkflowState } from "../../core/types";

/**
 * AI Context Store - Shared state for all streamed components
 * Components can read/write to this shared context
 */

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
    });
  },
}));
