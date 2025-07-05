/**
 * Configuration types for Gravity Client
 */

export interface GravityConfig {
  endpoint: string;
  apiKey?: string;
  headers?: Record<string, string>;
  subscriptionEndpoint?: string;
}

export interface ConnectionConfig extends GravityConfig {
  reconnectAttempts?: number;
  reconnectInterval?: number;
  conversationId?: string; // Optional: client can provide their own conversation ID
}
