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
  componentConfig: Record<string, React.ComponentType<any>>;
  activeObjectId?: string;

  // App-level workflow state
  workflowId: string | null;
  workflowRunId: string | null;
  appState: "idle" | "thinking" | "responding" | "waiting" | "complete" | "error";
  isProcessing: boolean;



  // Actions
  toggleSidebar: (forceState?: boolean) => void;
  setComponentConfig: (config: Record<string, React.ComponentType<any>>) => void;
  setActiveObject: (objectId?: string) => void;

  // Workflow state actions
  setWorkflowState: (
    workflowId: string,
    workflowRunId: string
  ) => void;
  updateAppState: (appState: UISlice["appState"]) => void;
  setProcessing: (isProcessing: boolean) => void;
  resetWorkflow: () => void;


}

// Initial state
const initialUIState: UIState = {
  sidebarOpen: false,
  componentConfig: {},
  activeObjectId: undefined,

  // App-level workflow state
  workflowId: null,
  workflowRunId: null,
  appState: "idle",
  isProcessing: false,

  // Workflow execution state
  workflowExecution: {
    executionId: null,
    status: null,
    completedNodes: {},
    pendingSignals: {},
    activeNodes: [],
    timestamp: null,
  },
};

// Create UI slice
export const createUISlice = (set: any, get: any, api: any): UISlice => ({
  ...initialUIState,

  toggleSidebar: (forceState?: boolean) => {
    set((state: any) => ({
      ...state,
      sidebarOpen: forceState !== undefined ? forceState : !state.sidebarOpen,
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

  setWorkflowState: (
    workflowId: string,
    workflowRunId: string
  ) => {
    set((state: any) => ({
      ...state,
      workflowId,
      workflowRunId,
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
      appState: "idle",
      isProcessing: false,
    }));
  },


});
