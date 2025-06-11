/**
 * Connection Slice - Self-contained
 * Handles GraphQL client setup and SSE connection management
 */

import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { YogaLink } from '@graphql-yoga/apollo-link';
import { getMainDefinition } from '@apollo/client/utilities';
import { ConnectionState } from '../types';
import { ConnectionConfig } from '../../types/config';

// Connection slice interface
export interface ConnectionSlice {
  connection: ConnectionState;
  connect: (config: ConnectionConfig) => Promise<void>;
  disconnect: () => void;
  setupSubscription: (conversationId: string) => void;
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
};

// Create connection slice
export const createConnectionSlice = (
  set: any,
  get: any,
  api: any
): ConnectionSlice => ({
  connection: initialConnectionState,

  connect: async (config: ConnectionConfig) => {
    set((state: any) => ({
      connection: {
        ...state.connection,
        isConnecting: true,
        error: null,
        config,
      },
    }));

    try {
      // Create HTTP link for queries/mutations
      const httpLink = new HttpLink({
        uri: config.endpoint,
        headers: {
          ...config.headers,
          ...(config.apiKey ? { 'x-api-key': config.apiKey } : {}),
        },
      });

      // Create SSE link for subscriptions using YogaLink
      // IMPORTANT: We use SSE (YogaLink) and NOT WebSockets for subscription support
      const sseLink = new YogaLink({
        endpoint: config.endpoint, // Use the same HTTP endpoint - not a WebSocket URL
        headers: {
          ...config.headers,
          ...(config.apiKey ? { 'x-api-key': config.apiKey } : {}),
        },
        credentials: 'include',
      });

      // Split link based on operation type
      const splitLink = split(
        ({ query }) => {
          const definition = getMainDefinition(query);
          return (
            definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
          );
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
            errorPolicy: 'all',
          },
          query: {
            errorPolicy: 'all',
          },
        },
      });

      set((state: any) => ({
        connection: {
          ...state.connection,
          client,
          isConnected: true,
          isConnecting: false,
          lastConnected: new Date(),
        },
      }));

      console.log('✓ Connected to Gravity AI with SSE support');
    } catch (error) {
      console.error('Failed to connect to Gravity AI:', error);
      set((state: any) => ({
        connection: {
          ...state.connection,
          isConnecting: false,
          error: error instanceof Error ? error.message : 'Connection failed',
        },
      }));
      throw error;
    }
  },

  disconnect: () => {
    const state = get();
    const { client, subscriptions } = state.connection;

    // Cleanup subscriptions
    subscriptions.forEach((sub: any) => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });

    // Stop Apollo client
    if (client) {
      client.stop();
    }

    set((state: any) => ({
      connection: {
        ...initialConnectionState,
        config: state.connection.config, // Keep config for reconnection
      },
    }));

    console.log('✓ Disconnected from Gravity AI');
  },

  setupSubscription: (conversationId: string) => {
    // TODO: Implement SSE subscription setup
    console.log('Setting up SSE subscription for:', conversationId);
  },

  cleanupSubscription: () => {
    const state = get();
    state.connection.subscriptions.clear();
  },
});
