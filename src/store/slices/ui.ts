/**
 * UI Slice - Self-contained
 * Manages UI state and component configuration
 */

import React from 'react';
import { UIState } from '../types';

// UI slice interface
export interface UISlice {
  ui: UIState;
  components?: Record<string, React.ComponentType<any>>;
  fallback?: React.ComponentType<any>;
  toggleSidebar: (forceState?: boolean) => void;
  setActiveObject: (id: string | null) => void;
  setConnectionStatus: (isConnected: boolean, error?: string) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setComponents: (components: Record<string, React.ComponentType<any>>) => void;
  setFallback: (fallback: React.ComponentType<any>) => void;
}

// Initial state
const initialUIState: UIState = {
  sidebarOpen: true,
  activeObjectId: null,
  isConnected: false,
  connectionError: null,
  voiceEnabled: false,
};

// Create UI slice
export const createUISlice = (
  set: any,
  get: any,
  api: any
): UISlice => ({
  ui: initialUIState,
  components: undefined,
  fallback: undefined,

  toggleSidebar: (forceState?: boolean) => {
    set((state: any) => ({
      ui: {
        ...state.ui,
        sidebarOpen: forceState !== undefined ? forceState : !state.ui.sidebarOpen,
      },
    }));
  },

  setActiveObject: (id: string | null) => {
    set((state: any) => ({
      ui: {
        ...state.ui,
        activeObjectId: id,
      },
    }));
  },

  setConnectionStatus: (isConnected: boolean, error?: string) => {
    set((state: any) => ({
      ui: {
        ...state.ui,
        isConnected,
        connectionError: error || null,
      },
    }));
  },

  setVoiceEnabled: (enabled: boolean) => {
    set((state: any) => ({
      ui: {
        ...state.ui,
        voiceEnabled: enabled,
      },
    }));
  },

  setComponents: (components: Record<string, React.ComponentType<any>>) => {
    set((state: any) => ({
      components,
    }));
  },

  setFallback: (fallback: React.ComponentType<any>) => {
    set((state: any) => ({
      fallback,
    }));
  },
});
