/**
 * Public types for Gravity Client consumers
 * Only expose what's necessary for using the library
 */

// Re-export safe types from shared
export type { GravityMessage, ComponentSpec, BaseMessage, SendMessageParams } from './shared';

// Import ComponentSpec for use in this file
import type { ComponentSpec } from './shared';

// Connection states
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Response states  
export type ResponseStatus = 'idle' | 'loading' | 'streaming' | 'complete' | 'error';

// Message chunk type for internal use
export interface MessageChunk {
  __typename?: 'MessageChunk';
  chatId: string;
  conversationId: string;
  userId: string;
  providerId?: string;
  timestamp?: string;
  component?: ComponentSpec;
}

// Minimal types for component props
export interface MessageChunkProps {
  text: string;
  index?: number;
}

export interface ProgressUpdateProps {
  message: string;
  progress?: number;
}

// Add other minimal types as needed...
