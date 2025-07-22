/**
 * UI Slice - Self-contained
 * Manages UI state and component configuration
 */

import React from "react";
import { UIState } from "../types";

// UI slice interface - flattened for easy access
export interface UISlice {
  // State
  sidebarOpen: boolean;
  sidebarMode: "closed" | "compact" | "expanded"; // New: explicit sidebar modes
  componentConfig: Record<string, React.ComponentType<any>>;
  activeObjectId?: string;

  // App-level workflow state
  workflowId: string | null;
  workflowRunId: string | null;
  conversationId: string | null; // Single source of truth for conversation ID
  appState: "idle" | "thinking" | "responding" | "waiting" | "complete" | "error";
  isProcessing: boolean;

  // Application-level components that persist across messages
  form: any | null;

  // Actions
  toggleSidebar: (forceState?: boolean) => void;
  setSidebarMode: (mode: "closed" | "compact" | "expanded") => void; // New action
  setComponentConfig: (config: Record<string, React.ComponentType<any>>) => void;
  setActiveObject: (objectId?: string) => void;

  // Workflow state actions
  setWorkflowState: (workflowId: string, workflowRunId: string) => void;
  setConversationId: (conversationId: string) => void;
  updateAppState: (appState: UISlice["appState"]) => void;
  setProcessing: (isProcessing: boolean) => void;
  resetWorkflow: () => void;
  setForm: (form: any | null) => void;
}

// Initial UI state
const initialUIState: UIState = {
  sidebarOpen: false,
  sidebarMode: "closed" as "closed" | "compact" | "expanded",
  componentConfig: {},
  activeObjectId: undefined,

  // App-level workflow state
  workflowId: null,
  workflowRunId: null,
  conversationId: null,
  appState: "idle" as "idle" | "thinking" | "responding" | "waiting" | "complete" | "error",
  isProcessing: false,

  // Application-level components
  form: null,
};

// Create UI slice
export const createUISlice = (set: any, get: any, api: any): UISlice => ({
  ...initialUIState,

  toggleSidebar: (forceState?: boolean) => {
    set((state: any) => {
      const newOpen = forceState !== undefined ? forceState : !state.sidebarOpen;
      return {
        ...state,
        sidebarOpen: newOpen,
        // Update sidebar mode based on open state
        sidebarMode: newOpen ? (state.form || state.isProcessing ? "expanded" : "compact") : "closed",
      };
    });
  },

  setSidebarMode: (mode: "closed" | "compact" | "expanded") => {
    set((state: any) => ({
      ...state,
      sidebarMode: mode,
      sidebarOpen: mode !== "closed",
    }));
  },

  setComponentConfig: (config: Record<string, React.ComponentType<any>>) => {
    set((state: any) => ({
      ...state,
      componentConfig: config,
    }));
  },

  setActiveObject: (objectId?: string) => {
    set((state: any) => ({
      ...state,
      activeObjectId: objectId,
    }));
  },

  setWorkflowState: (workflowId: string, workflowRunId: string) => {
    set((state: any) => ({
      ...state,
      workflowId,
      workflowRunId,
    }));
  },

  setConversationId: (conversationId: string) => {
    console.log(`[UISlice] Setting conversationId to: ${conversationId}`);
    set((state: any) => ({
      ...state,
      conversationId,
    }));
  },

  updateAppState: (appState: UISlice["appState"]) => {
    set((state: any) => ({
      ...state,
      appState,
    }));
  },

  setProcessing: (isProcessing: boolean) => {
    set((state: any) => ({
      ...state,
      isProcessing,
    }));
  },

  resetWorkflow: () => {
    set((state: any) => ({
      ...state,
      workflowId: null,
      workflowRunId: null,
      conversationId: null,
      appState: "idle",
      isProcessing: false,
      form: null, // Reset form on workflow reset
    }));
  },

  setForm: (form: any | null) => {
    set((state: any) => ({
      ...state,
      form,
      // Automatically expand sidebar when form arrives
      sidebarMode: form && state.sidebarOpen ? "expanded" : state.sidebarMode,
    }));
  },
});
