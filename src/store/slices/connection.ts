/**
 * Connection Slice - Self-contained
 * Handles GraphQL client setup and SSE connection management
 */

import { ApolloClient, InMemoryCache, split, HttpLink } from "@apollo/client";
import { YogaLink } from "@graphql-yoga/apollo-link";
import { getMainDefinition } from "@apollo/client/utilities";
import { ConnectionState } from "../types";
import { ConnectionConfig } from "../../types/config";
import { AI_RESULT_SUBSCRIPTION } from "../../graphql/subscriptions";

// Connection slice interface - flattened for easy access
export interface ConnectionSlice extends ConnectionState {
  connect: (config: ConnectionConfig) => Promise<void>;
  disconnect: () => void;
  cleanupSubscription: () => void;
}

// Initial state
const initialConnectionState: ConnectionState = {
  client: null,
  isConnected: false,
  isConnecting: false,
  error: null,
  config: null,
  subscriptions: new Map(),
  lastConnected: null,
  conversationId: null,
};

// Create connection slice
export const createConnectionSlice = (set: any, get: any, api: any): ConnectionSlice => ({
  ...initialConnectionState,

  connect: async (config: ConnectionConfig) => {
    set((state: any) => ({
      ...state,
      isConnecting: true,
      error: null,
      config,
    }));

    try {
      // Create HTTP link for queries/mutations
      const httpLink = new HttpLink({
        uri: config.endpoint,
        headers: {
          ...config.headers,
          ...(config.apiKey ? { "x-agent-key": config.apiKey } : {}),
        },
      });

      // Create SSE link for subscriptions using YogaLink
      // IMPORTANT: We use SSE (YogaLink) and NOT WebSockets for subscription support
      const sseLink = new YogaLink({
        endpoint: config.endpoint, // Use the same HTTP endpoint - not a WebSocket URL
        headers: {
          ...config.headers,
          ...(config.apiKey ? { "x-agent-key": config.apiKey } : {}),
        },
        credentials: "include",
      });

      // Split link based on operation type
      const splitLink = split(
        ({ query }) => {
          const definition = getMainDefinition(query);
          return definition.kind === "OperationDefinition" && definition.operation === "subscription";
        },
        sseLink,
        httpLink
      );

      // Create Apollo client with basic cache setup
      const client = new ApolloClient({
        link: splitLink,
        cache: new InMemoryCache({
          typePolicies: {
            Subscription: {
              fields: {
                aiResult: {
                  merge: false, // Don't merge subscription results
                },
              },
            },
          },
        }),
        defaultOptions: {
          watchQuery: {
            errorPolicy: "all",
          },
          query: {
            errorPolicy: "all",
          },
        },
      });

      set((state: any) => ({
        ...state,
        client,
        isConnected: true,
        isConnecting: false,
        lastConnected: new Date(),
      }));

      // Set up ONE subscription for the session
      // Get conversationId from cookie or generate new one
      let conversationId = localStorage.getItem("gravity-conversationId");
      if (!conversationId) {
        conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        localStorage.setItem("gravity-conversationId", conversationId);
      }

      try {
        const subscription = client.subscribe({
          query: AI_RESULT_SUBSCRIPTION,
          variables: { conversationId },
        });

        const observableSubscription = subscription.subscribe({
          next: (result: any) => {
            if (result.data?.aiResult) {
              console.log("📨 SUBSCRIPTION:", result.data.aiResult);
              const processMessage = get().processMessage;
              if (processMessage) {
                processMessage(result.data.aiResult);
              }
            }
          },
          error: (error: any) => {
            console.error("❌ Subscription error:", error);
          },
        });

        // Store the subscription and conversationId
        const subscriptions = get().subscriptions;
        subscriptions.set("session", observableSubscription);

        // Set this as the default conversationId for the session
        set((state: any) => ({
          ...state,
          conversationId: conversationId,
        }));
      } catch (error) {
        console.error("[GravityClient] ❌ Failed to setup subscription:", error);
      }
    } catch (error) {
      console.error("Failed to connect to Gravity AI:", error);
      set((state: any) => ({
        ...state,
        isConnecting: false,
        error: error instanceof Error ? error.message : "Connection failed",
      }));
      throw error;
    }
  },

  disconnect: () => {
    const state = get();
    const { client, subscriptions } = state;

    // Cleanup subscriptions
    subscriptions.forEach((sub: any) => {
      if (sub && typeof sub.unsubscribe === "function") {
        sub.unsubscribe();
      }
    });

    // Stop Apollo client
    if (client) {
      client.stop();
    }

    set((state: any) => ({
      ...initialConnectionState,
      config: state.config, // Keep config for reconnection
    }));
  },

  cleanupSubscription: () => {
    const state = get();
    state.subscriptions.clear();
  },
});
