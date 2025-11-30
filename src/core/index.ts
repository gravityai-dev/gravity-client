/**
 * Core exports - Framework agnostic
 */

export { HistoryManager, historyManager } from "./HistoryManager";
export type { UserMessage, AssistantResponse, ComponentEntry, HistoryEntry, HistoryMetadata } from "./HistoryManager";

export type {
  GravityConfig,
  SessionParams,
  StreamingState,
  WorkflowState,
  ServerMessageType,
  ServerMessage,
  ComponentInitMessage,
  ComponentDataMessage,
  ComponentRemoveMessage,
  WorkflowStateMessage,
  SessionReadyMessage,
  UserActionType,
  UserActionPayload,
} from "./types";
