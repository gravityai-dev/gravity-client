/**
 * UI Slice - Self-contained
 * Manages UI state and component configuration
 */

import React from 'react';
import { UIState } from '../types';

// UI slice interface - flattened for easy access
export interface UISlice extends UIState {
  toggleSidebar: (forceState?: boolean) => void;
  setComponentConfig: (config: Record<string, React.ComponentType<any>>) => void;
}

// Initial state
const initialUIState: UIState = {
  sidebarOpen: false,
  componentConfig: {},
};

// Create UI slice
export const createUISlice = (
  set: any,
  get: any,
  api: any
): UISlice => ({
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
});
