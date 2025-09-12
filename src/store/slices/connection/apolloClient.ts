/**
 * Apollo Client setup
 */

import { ApolloClient, InMemoryCache, split, HttpLink, ApolloLink, Observable } from "@apollo/client";
import { YogaLink } from "@graphql-yoga/apollo-link";
import { getMainDefinition } from "@apollo/client/utilities";
import { ConnectionConfig } from "../../../types/config";

export function createApolloClient(config: ConnectionConfig): ApolloClient<any> {
  // Create HTTP link for queries/mutations
  const httpLink = new HttpLink({
    uri: config.endpoint,
    headers: {
      ...config.headers,
      ...(config.apiKey ? { "x-agent-key": config.apiKey } : {}),
    },
  });

  // Create a custom link that forces POST for SSE subscriptions
  const sseLink = new ApolloLink((operation, forward) => {
    // For subscriptions, we need to handle SSE manually
    return new Observable((observer: any) => {
      const controller = new AbortController();
      
      fetch(config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
          ...config.headers,
          ...(config.apiKey ? { "x-agent-key": config.apiKey } : {}),
        },
        body: JSON.stringify({
          query: operation.query.loc?.source.body,
          variables: operation.variables,
          operationName: operation.operationName,
        }),
        credentials: "include",
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          
          if (!reader) {
            throw new Error("No response body");
          }
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");
            
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  observer.next(data);
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }
          
          observer.complete();
        })
        .catch((error) => {
          observer.error(error);
        });
      
      // Cleanup function
      return () => {
        controller.abort();
      };
    });
  });

  // Split link based on operation type
  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === "OperationDefinition" && definition.operation === "subscription";
    },
    // Use YogaLink for subscriptions
    new YogaLink({
      endpoint: config.endpoint,
      headers: {
        ...config.headers,
        ...(config.apiKey ? { "x-agent-key": config.apiKey } : {}),
      },
    }),
    httpLink
  );

  // Create Apollo Client
  return new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache({
      typePolicies: {
        Subscription: {
          fields: {
            aiResult: {
              // Don't cache subscription results
              read() {
                return undefined;
              },
            },
            gravityResult: {
              // Don't cache subscription results
              read() {
                return undefined;
              },
            },
          },
        },
      },
    }),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "network-only",
      },
      query: {
        fetchPolicy: "network-only",
      },
    },
  });
}
