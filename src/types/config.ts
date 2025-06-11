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
}
