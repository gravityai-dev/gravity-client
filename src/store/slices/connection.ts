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
function createSubscription(client: any, query: any, variables: any, handlers: {
  onData: (result: any) => void;
  onError?: (error: any) => void;
  subscriptionName?: string;
}) {
  const { onData, onError, subscriptionName = "subscription" } = handlers;
  
  const subscription = client.subscribe({ query, variables });
  
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
      console.error(`❌ [${subscriptionName}] Subscription error:`, error);
      console.error("  Error details:", {
        message: error.message,
        networkError: error.networkError,
        graphQLErrors: error.graphQLErrors,
      });

      if (error.graphQLErrors && Array.isArray(error.graphQLErrors)) {
        error.graphQLErrors.forEach((gqlError: any, index: number) => {
          console.error(`  GraphQL Error ${index + 1}:`, {
            message: gqlError.message,
            path: gqlError.path,
            extensions: gqlError.extensions,
          });
        });
      }
      
      if (onError) onError(error);
    },
  });
}

// Connection slice interface - flattened for easy access
export interface ConnectionSlice extends ConnectionState {
  connect: (config: ConnectionConfig) => Promise<void>;
  disconnect: () => void;
  cleanupSubscription: () => void;
  updateSubscription: (conversationId: string) => void;

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
  workflowId: null,
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

      // Set up subscriptions for the session
      // Get conversationId from cookie or generate new one
      let conversationId = localStorage.getItem("gravity-conversationId");
      if (!conversationId) {
        conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        localStorage.setItem("gravity-conversationId", conversationId);
      }

      try {
        // Set up message subscription
        const messageSubscription = createSubscription(client, AI_RESULT_SUBSCRIPTION, { conversationId }, {
          onData: (result: any) => {
            if (result.data?.aiResult) {
              // console.log("📨 SUBSCRIPTION data:", {
              //   type: result.data.aiResult.__typename,
              //   data: result.data.aiResult,
              // });
              // if (result.data.aiResult.__typename === "NodeExecution") {
              //   console.log("📝 NodeExecution event:", {
              //     nodeId: result.data.aiResult.nodeId,
              //     nodeType: result.data.aiResult.nodeType,
              //     status: result.data.aiResult.status,
              //     output: result.data.aiResult.output,
              //     error: result.data.aiResult.error,
              //     workflowId: result.data.aiResult.workflowId,
              //   });
              // }
              const processMessage = get().processMessage;
              if (processMessage) {
                processMessage(result.data.aiResult);
              }
            }
          },
          subscriptionName: "message",
        });

        // Store the message subscription and conversationId
        const subscriptions = get().subscriptions;
        subscriptions.set("session", messageSubscription);

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

  updateSubscription: (conversationId: string) => {
    const state = get();
    const { client, subscriptions } = state;

    if (!client) {
      console.warn("[GravityClient] Cannot update subscription - no client connected");
      return;
    }

    // Check if we already have a subscription for this conversationId
    const existingSubscription = subscriptions.get(`session:${conversationId}`);
    if (existingSubscription) {
      // Already subscribed to this conversationId, no need to recreate
      return;
    }

    // Cleanup existing subscriptions (different conversationIds)
    subscriptions.forEach((sub: any, key: string) => {
      console.log("[GravityClient] Cleaning up existing subscription:", key);
      if (sub && typeof sub.unsubscribe === "function") {
        sub.unsubscribe();
      }
    });
    subscriptions.clear();

    // Set up new subscription with new conversationId
    try {
      console.log("[GravityClient] Creating new subscription with conversationId:", conversationId);
      const subscription = createSubscription(client, AI_RESULT_SUBSCRIPTION, { conversationId }, {
        onData: (result: any) => {
          if (result.data?.aiResult) {
            // console.log("📨 SUBSCRIPTION data:", {
            //   type: result.data.aiResult.__typename,
            //   data: result.data.aiResult,
            // });
            // if (result.data.aiResult.__typename === "NodeExecution") {
            //   console.log("📝 NodeExecution event:", {
            //     nodeId: result.data.aiResult.nodeId,
            //     nodeType: result.data.aiResult.nodeType,
            //     status: result.data.aiResult.status,
            //     output: result.data.aiResult.output,
            //     error: result.data.aiResult.error,
            //     workflowId: result.data.aiResult.workflowId,
            //   });
            // }
            const processMessage = get().processMessage;
            if (processMessage) {
              processMessage(result.data.aiResult);
            }
          }
        },
        subscriptionName: "message",
      });

      // Store the new subscription and conversationId
      subscriptions.set(`session:${conversationId}`, subscription);

      // Update localStorage and state
      localStorage.setItem("gravity-conversationId", conversationId);

      // Set this as the default conversationId for the session
      set((state: any) => ({
        ...state,
        conversationId: conversationId,
      }));
    } catch (error) {
      console.error("[GravityClient] ❌ Failed to update subscription:", error);
    }
  },


});
