/**
 * useHistoryManager - Re-export from modular structure
 *
 * This file is kept for backward compatibility.
 * The actual implementation is in ./historyManager/
 */

export { useHistoryManager, default } from "./historyManager";
export type {
  TemplateInfo,
  ComponentInitEvent,
  WorkflowStateEvent,
  HistoryEvent,
  UseHistoryManagerOptions,
  UseHistoryManagerReturn,
} from "./historyManager";
