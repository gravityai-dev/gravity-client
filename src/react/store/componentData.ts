import { create } from "zustand";

/**
 * Component Data Store
 * Stores streaming data for components keyed by chatId:nodeId
 *
 * Architecture:
 * - Server sends COMPONENT_INIT (mounts component)
 * - Server sends COMPONENT_DATA (updates data)
 * - Component subscribes to data by chatId:nodeId (isolates per conversation turn)
 * - React auto-re-renders on data changes
 */

interface ComponentDataState {
  /** Component data keyed by chatId:nodeId */
  data: Record<string, Record<string, any>>;
  /** Mounted components (tracks which components are active) */
  mounted: Set<string>;
  /** Initialize component (COMPONENT_INIT message) */
  initComponent: (chatId: string, nodeId: string, componentType: string) => void;
  /** Update component data (COMPONENT_DATA message) */
  updateComponentData: (chatId: string, nodeId: string, newData: Record<string, any>) => void;
  /** Remove component (COMPONENT_REMOVE message) */
  removeComponent: (chatId: string, nodeId: string) => void;
  /** Clear all component data (on disconnect/reset) */
  clearAll: () => void;
  /** Get data for a specific component */
  getComponentData: (nodeId: string) => Record<string, any>;
}

export const useComponentData = create<ComponentDataState>((set, get) => ({
  data: {},
  mounted: new Set(),

  initComponent: (chatId: string, nodeId: string, _componentType: string) => {
    const key = chatId && nodeId ? `${chatId}:${nodeId}` : nodeId;
    set((state) => ({
      mounted: new Set([...state.mounted, key]),
      data: {
        ...state.data,
        [key]: state.data[key] || {},
      },
    }));
  },

  updateComponentData: (chatId: string, nodeId: string, newData: Record<string, any>) => {
    const key = chatId && nodeId ? `${chatId}:${nodeId}` : nodeId;
    set((state) => ({
      data: {
        ...state.data,
        [key]: {
          ...state.data[key],
          ...newData,
        },
      },
    }));
  },

  removeComponent: (chatId: string, nodeId: string) => {
    const key = chatId && nodeId ? `${chatId}:${nodeId}` : nodeId;
    set((state) => {
      const newMounted = new Set(state.mounted);
      newMounted.delete(key);

      const newData = { ...state.data };
      delete newData[key];

      return {
        mounted: newMounted,
        data: newData,
      };
    });
  },

  clearAll: () => {
    set({
      data: {},
      mounted: new Set(),
    });
  },

  getComponentData: (nodeId: string) => {
    return get().data[nodeId] || {};
  },
}));
