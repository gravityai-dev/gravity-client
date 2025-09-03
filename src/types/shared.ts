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
  metadata?: {
    workflowId?: string;
    targetTriggerNode?: string;
    silent?: boolean;
    enableAudio?: boolean;
    targetAgent?: string;
    [key: string]: any; // Allow additional metadata
  };
  conversationId?: string;
  chatId?: string;
  userId?: string;
  providerId?: string;
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
  conversationId: string;
  chatId: string;
  providerId?: string;
  timestamp?: string;
  silent?: boolean;  // If true, message won't be added to UI state
  metadata?: {
    workflowId?: string;
    targetAgent?: string;
    enableAudio?: boolean;
    [key: string]: any;
  };
}

// Send audio message parameters
export interface SendAudioMessageParams {
  audioInput: string; // Base64 encoded audio data
  userId: string;
  conversationId: string;
  chatId: string;
  providerId?: string;
  timestamp?: string;
  metadata?: {
    workflowId?: string;
    targetTriggerNode?: string;
    audioFormat?: string;
    sampleRate?: number;
    duration?: number;
    [key: string]: any;
  };
}
