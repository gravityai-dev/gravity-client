/**
 * Types for useHistoryManager hook
 */

import type { HistoryManager, HistoryEntry } from "../../../core/HistoryManager";
import type { WorkflowStateMessage } from "../../../core/types";

export interface TemplateInfo {
  Component: any;
  name: string;
  nodeId?: string;
  props: Record<string, any>;
}

export interface ComponentInitEvent {
  type: "COMPONENT_INIT";
  id?: string;
  chatId: string;
  nodeId: string;
  component: {
    type: string;
    componentUrl: string;
    props?: Record<string, any>;
    metadata?: Record<string, any>;
  };
}

export interface WorkflowStateEvent extends WorkflowStateMessage {
  id?: string;
}

export type HistoryEvent = ComponentInitEvent | WorkflowStateEvent;

export interface UseHistoryManagerOptions {
  loadComponent?: (url: string, name: string) => Promise<any>;
  sendComponentReady?: (componentName: string, messageId: string) => void;
  events?: HistoryEvent[];
  withZustandData?: (Component: any) => any;
  /** Callback to auto-focus focusable components on load */
  openFocus?: (componentId: string, targetTriggerNode: string | null, chatId: string | null) => void;
  /** Callback to set component data in Zustand (for COMPONENT_INIT) */
  setComponentData?: (key: string, data: Record<string, any>) => void;
  /** Callback to update component data in Zustand (for COMPONENT_DATA) */
  updateComponentData?: (key: string, updates: Record<string, any>) => void;
}

export interface UseHistoryManagerReturn {
  history: HistoryEntry[];
  stats: ReturnType<HistoryManager["getStats"]>;
  activeTemplate: TemplateInfo | null;
  templateStack: TemplateInfo[];
  addUserMessage: HistoryManager["addUserMessage"];
  addResponse: HistoryManager["addResponse"];
  updateResponse: HistoryManager["updateResponse"];
  addComponentToResponse: HistoryManager["addComponentToResponse"];
  getResponses: HistoryManager["getResponses"];
  addComponent: HistoryManager["addComponentToResponse"];
  updateEntry: HistoryManager["updateEntry"];
  processEvent: (event: HistoryEvent) => Promise<void>;
  getAllComponents: HistoryManager["getAllComponents"];
  getUserMessages: HistoryManager["getUserMessages"];
  getByType: HistoryManager["getByType"];
  getByRole: HistoryManager["getByRole"];
  clear: HistoryManager["clear"];
  toJSON: HistoryManager["toJSON"];
  manager: HistoryManager;
}
