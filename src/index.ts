/**
 * Gravity Client Library
 * Clean, organized, self-contained client for Gravity AI
 */

// Store and hooks
export { useGravityStore } from "./store";
export type { GravityStore } from "./store";
export { useGravity, useActiveResponse, useConnection } from "./hooks";

// Components
export * from "./components";

// Utility functions - these will be imported by client apps
// Note: These are standalone functions that access the store directly
import { useGravityStore } from "./store";

export const toggleSidebar = (forceState?: boolean) => {
  const store = useGravityStore.getState();
  store.toggleSidebar(forceState);
};

export const setActiveObject = (objectId?: string) => {
  const store = useGravityStore.getState();
  store.setActiveObject(objectId);
};

export const setSidebarMode = (mode: "closed" | "compact" | "expanded") => {
  const store = useGravityStore.getState();
  store.setSidebarMode(mode);
};

// GraphQL
export {
  TALK_TO_AGENT,
  TALK_TO_AGENT_WITH_AUDIO,
  STEP_WORKFLOW,
  GET_CHAT_STATUS,
  INVOKE_NODE_INTERACTION,
  FLUSH_WORKFLOW_CACHE,
} from "./graphql/operations";
export { AI_RESULT_SUBSCRIPTION } from "./graphql/subscriptions";

// Types - export existing types from types/index.ts (config, shared)
export * from "./types";

// Additional public types (connection/response status, component props, message types)
export type {
  ConnectionStatus,
  ResponseStatus,
  MessageChunk,
  MessageChunkProps,
  ProgressUpdateProps,
} from "./types/public";
