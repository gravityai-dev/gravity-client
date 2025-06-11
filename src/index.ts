/**
 * Gravity Client Library
 * Clean, organized, self-contained client for Gravity AI
 */

// Store and hooks
export { useGravityStore } from './store';
export type { GravityStore } from './store';
export * from './hooks';

// Components
export * from './components';

// GraphQL
export { TALK_TO_AGENT, GET_CHAT_STATUS } from './graphql/operations';
export { AI_RESULT_SUBSCRIPTION } from './graphql/subscriptions';
// Note: GraphQL types exported separately to avoid conflicts

// Types
export * from './types';
