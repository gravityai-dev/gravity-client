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

// GraphQL
export { TALK_TO_AGENT, STEP_WORKFLOW, GET_CHAT_STATUS, INVOKE_NODE_INTERACTION, FLUSH_WORKFLOW_CACHE } from "./graphql/operations";
export { AI_RESULT_SUBSCRIPTION } from "./graphql/subscriptions";
// Note: GraphQL types exported separately to avoid conflicts

// Types
export * from "./types";
