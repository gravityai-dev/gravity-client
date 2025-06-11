/**
 * Shared types for Gravity Client
 */

// Message types for the 3-tier architecture
export interface GravityMessage {
  id: string;
  type: string;
  content: any; // Flexible JSON content
  timestamp: string;
  source: 'user' | 'agent';
}

// Component specification for UI rendering
export interface ComponentSpec {
  type: string;
  props: Record<string, any>;
}

// Base message structure
export interface BaseMessage {
  conversationId: string;
  chatId: string;
  userId: string;
  timestamp?: string;
}

// Send message parameters
export interface SendMessageParams {
  message: string;
  userId: string;
  conversationId?: string;
  chatId?: string;
  providerId?: string;
  timestamp?: string;
  metadata?: {
    workflowId?: string;
    targetAgent?: string;
    enableAudio?: boolean;
    [key: string]: any;
  };
}
