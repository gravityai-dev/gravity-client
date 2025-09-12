/**
 * Connection Slice - Refactored
 * Main entry point for connection management
 */

import { ConnectionState } from "../../types";
import { ConnectionConfig } from "../../../types/config";
import { createApolloClient } from "./apolloClient";
import { updateSubscriptions, cleanupSubscriptions } from "./subscriptionManager";
import { gql } from "@apollo/client";
import type { ConnectionSlice } from "./types";

// Re-export the type
export type { ConnectionSlice } from "./types";

// Initial state
const initialState: ConnectionState = {
  client: null,
  isConnected: false,
  isConnecting: false,
  error: null,
  config: null,
  subscriptions: new Map(),
  lastConnected: null,
  workflowId: null,
};

// Create connection slice
export const createConnectionSlice = (set: any, get: any, api: any): ConnectionSlice => ({
  ...initialState,

  connect: async (config: ConnectionConfig) => {
    set((state: any) => ({
      ...state,
      isConnecting: true,
      error: null,
      config,
    }));

    try {
      const client = createApolloClient(config);

      // Test the connection with a simple introspection query
      const testResult = await client.query({
        query: gql`
          query TestConnection {
            __typename
          }
        `,
      });

      if (!testResult.data) {
        throw new Error("Failed to connect to GraphQL endpoint");
      }

      console.log("✅ [ConnectionSlice] Connected to GraphQL endpoint");

      set((state: any) => ({
        ...state,
        client,
        isConnected: true,
        isConnecting: false,
        lastConnected: new Date(),
      }));
    } catch (error: any) {
      console.error("❌ [ConnectionSlice] Connection error:", error);
      set((state: any) => ({
        ...state,
        isConnecting: false,
        error: error.message || "Failed to connect",
      }));
      throw error;
    }
  },

  disconnect: () => {
    console.log("🔌 [ConnectionSlice] Disconnecting...");
    const { client, subscriptions } = get();

    // Clean up subscriptions
    cleanupSubscriptions(subscriptions);

    // Stop Apollo client
    if (client) {
      try {
        client.stop();
      } catch (error) {
        console.error("❌ [ConnectionSlice] Error stopping Apollo client:", error);
      }
    }

    set((state: any) => ({
      ...initialState,
      config: state.config, // Keep config for reconnection
    }));
  },

  cleanupSubscription: () => {
    const state = get();
    const { subscriptions } = state;
    cleanupSubscriptions(subscriptions);
  },

  updateSubscription: () => {
    const state = get();
    const { client, subscriptions, conversationId } = state;

    updateSubscriptions({
      client,
      conversationId,
      subscriptions,
      processMessage: get().processMessage,
      processGravityEvent: get().processGravityEvent,
    });
  },
});
