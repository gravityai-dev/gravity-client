/**
 * Store types for Gravity Client
 */

import React from "react";
import { ApolloClient } from "@apollo/client";
import { GravityMessage, SendMessageParams } from "../types/shared";
import { ConnectionConfig } from "../types/config";

// Connection state
export interface ConnectionState {
  client: ApolloClient<any> | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  config: ConnectionConfig | null;
  subscriptions: Map<string, any>;
  lastConnected: Date | null;
}

// Active response state
export interface ActiveResponseState {
  conversationId: string | null;
  chatId: string | null;
  userId: string | null;
  state: "idle" | "thinking" | "responding" | "complete";
  messageSource: "user" | "agent" | null;

  // Flexible message storage - any JSON from server (3-tier architecture)
  messageChunks: any[]; // Streaming text chunks
  progressUpdate: any | null; // Latest progress update
  jsonData: any[]; // Raw JSON data from server
  actionSuggestion: any | null; // Latest action suggestions
  text: any | null; // Latest text message

  // Timing
  startTime: number | null;
  endTime: number | null;
}

// Conversation state
export interface ConversationState {
  conversationId: string | null;
  messages: GravityMessage[];
  isLoading: boolean;
}

// UI state
export interface UIState {
  sidebarOpen: boolean;
  componentConfig: Record<string, React.ComponentType<any>>;
}
