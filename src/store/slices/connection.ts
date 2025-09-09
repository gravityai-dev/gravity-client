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

// Helper function to create subscriptions with consistent error handling
function createSubscription(
  client: any,
  query: any,
  variables: any,
  handlers: {
    onData: (result: any) => void;
    onError?: (error: any) => void;
    subscriptionName?: string;
  }
) {
  const { onData, onError, subscriptionName = "subscription" } = handlers;

  const subscription = client.subscribe({
    query,
    variables,
    errorPolicy: "ignore", // Don't stop subscription on network/GraphQL errors
  });

  return subscription.subscribe({
    next: (result: any) => {
      if (result.errors) {
        console.error(`❌ [${subscriptionName}] Subscription errors:`, result.errors);
        result.errors.forEach((error: any, index: number) => {
          console.error(`  Error ${index + 1}:`, {
            message: error.message,
            path: error.path,
            extensions: error.extensions,
          });
        });
      }

      onData(result);
    },
    error: (error: any) => {
      // Check if this is an AbortError (happens when we clean up subscriptions)
      const isAbortError = error?.name === "AbortError" || error?.message?.includes("AbortError");
      if (isAbortError) {
        console.log(`[${subscriptionName}] Subscription aborted (expected during cleanup)`);
        return;
      }

      // Check if this is a network error that should trigger reconnection
      const isNetworkError =
        error?.message?.includes("INCOMPLETE_CHUNKED_ENCODING") ||
        error?.message?.includes("ERR_INCOMPLETE_CHUNK") ||
        error?.message?.includes("net::") ||
        error?.networkError ||
        error?.message?.includes("network error");

      if (isNetworkError) {
        console.warn(`🔄 [${subscriptionName}] Network error detected, will auto-reconnect:`, {
          message: error?.message,
          networkError: error?.networkError?.message,
        });

        // Don't call onError for network issues - let subscription auto-reconnect
        return;
      }

      // For non-network errors, log as warning but don't terminate
      console.warn(`⚠️ [${subscriptionName}] Subscription error (non-fatal):`, {
        message: error?.message,
        graphQLErrors: error?.graphQLErrors?.length || 0,
      });

      // Only call onError for truly critical errors
      if (onError && !isNetworkError) {
        onError(error);
      }
    },
  });
}

// Connection slice interface - flattened for easy access
export interface ConnectionSlice extends ConnectionState {
  connect: (config: ConnectionConfig) => Promise<void>;
  disconnect: () => void;
  cleanupSubscription: () => void;
  updateSubscription: () => void;
}

// Track last subscription update to prevent rapid successive calls
let lastSubscriptionUpdate: { conversationId: string; timestamp: number } | null = null;

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
      // Create HTTP link for queries/mutations
      const httpLink = new HttpLink({
        uri: config.endpoint,
        headers: {
          ...config.headers,
          ...(config.apiKey ? { "x-agent-key": config.apiKey } : {}),
        },
      });

      // Create SSE link for subscriptions using YogaLink
      // IMPORTANT: We use SSE (YogaLink) and NOT WebSockets for subscription support????   testing on WS
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

      // Don't set up subscriptions here - wait for client to provide conversationId
      console.log(`[GravityClient] Connected successfully. Waiting for conversationId from client.`);

      // Clean up any existing subscriptions before creating new ones
      const existingSubscriptions = get().subscriptions;
      if (existingSubscriptions && existingSubscriptions.size > 0) {
        console.log(`[GravityClient] Cleaning up ${existingSubscriptions.size} existing subscriptions`);
        existingSubscriptions.forEach((sub: any, key: string) => {
          if (sub && typeof sub.unsubscribe === "function") {
            try {
              sub.unsubscribe();
            } catch (error) {
              console.error(`[GravityClient] Error unsubscribing ${key}:`, error);
            }
          }
        });
        existingSubscriptions.clear();
      }

      // Subscription will be set up when client provides conversationId via sendMessage
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

    console.log(`🧹 [ConnectionSlice] Disconnecting - cleaning up ${subscriptions.size} subscriptions`);

    // Cleanup subscriptions
    subscriptions.forEach((sub: any, key: string) => {
      console.log(`🧹 [ConnectionSlice] Unsubscribing from: ${key}`);
      if (sub && typeof sub.unsubscribe === "function") {
        try {
          sub.unsubscribe();
        } catch (error) {
          console.error(`❌ [ConnectionSlice] Error unsubscribing from ${key}:`, error);
        }
      }
    });
    subscriptions.clear();

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

    console.log(`🧹 [ConnectionSlice] Cleaning up ${subscriptions.size} subscriptions`);

    subscriptions.forEach((entry: any, key: string) => {
      console.log(`🧹 [ConnectionSlice] Cleaning up subscription: ${key}`);
      if (entry?.subscription && typeof entry.subscription.unsubscribe === "function") {
        try {
          entry.subscription.unsubscribe();
          // Mark as closed to prevent reuse
          entry.closed = true;
        } catch (error) {
          console.error(`❌ [ConnectionSlice] Error cleaning up subscription ${key}:`, error);
        }
      }
    });
    subscriptions.clear();
  },

  updateSubscription: () => {
    const state = get();
    const { client, subscriptions, conversationId } = state;

    if (!conversationId) {
      console.warn("[GravityClient] Cannot update subscription - no conversationId set in UI state");
      return;
    }

    if (!client) {
      console.warn("[GravityClient] Cannot update subscription - no client connected");
      return;
    }

    // Check if we already have a subscription for this conversation ID
    const subscriptionKey = `session:${conversationId}`;
    const existingEntry = subscriptions.get(subscriptionKey);

    // If we have an active subscription for this exact conversation ID, do NOT recreate
    if (existingEntry && !existingEntry.closed && existingEntry.subscription) {
      console.log(`[GravityClient] Subscription already exists for ${conversationId}, skipping`);
      return;
    }

    // Also check if we're in the process of creating a subscription (pending state)
    if (existingEntry && existingEntry.pending) {
      console.log(`[GravityClient] Subscription creation pending for ${conversationId}, skipping`);
      return;
    }

    // Additional safeguard: Check if we just updated this same conversation ID (within 500ms)
    const now = Date.now();
    if (
      lastSubscriptionUpdate &&
      lastSubscriptionUpdate.conversationId === conversationId &&
      now - lastSubscriptionUpdate.timestamp < 500
    ) {
      console.log(`[GravityClient] Skipping duplicate subscription update for ${conversationId} (too soon)`);
      return;
    }

    // Clean up any other subscriptions (different conversation IDs)
    if (subscriptions.size > 0) {
      subscriptions.forEach((entry: any, key: string) => {
        // Only clean up subscriptions for DIFFERENT conversation IDs
        if (key !== subscriptionKey && entry?.subscription && typeof entry.subscription.unsubscribe === "function") {
          try {
            entry.subscription.unsubscribe();
            subscriptions.delete(key);
          } catch (error) {
            console.error(`❌ [GravityClient] Error unsubscribing from ${key}:`, error);
          }
        }
      });
    }

    // Set up new subscription with new conversationId
    try {
      console.log(`🔄 Subscribing to conversation: ${conversationId}`);

      // Mark subscription as pending to prevent duplicate creation attempts
      subscriptions.set(subscriptionKey, {
        subscription: null,
        conversationId,
        createdAt: Date.now(),
        closed: false,
        pending: true,
      });

      // Record this subscription update
      lastSubscriptionUpdate = { conversationId, timestamp: Date.now() };
      const messageSubscription = createSubscription(
        client,
        AI_RESULT_SUBSCRIPTION,
        {
          conversationId,
        },
        {
          onData: (result: any) => {
            if (result?.data?.aiResult) {
              const processMessage = get().processMessage;
              if (processMessage) {
                processMessage(result.data.aiResult);
              }
            }
          },
          subscriptionName: "message",
        }
      );

      // Update the subscription entry with the actual subscription (no longer pending)
      subscriptions.set(subscriptionKey, {
        subscription: messageSubscription,
        conversationId,
        createdAt: Date.now(),
        closed: false,
        pending: false,
      });
    } catch (error) {
      console.error("[GravityClient] ❌ Failed to update subscription:", error);
      // Remove the pending subscription on error
      subscriptions.delete(subscriptionKey);
    }
  },
});
