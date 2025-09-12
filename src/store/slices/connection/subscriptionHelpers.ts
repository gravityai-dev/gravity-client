/**
 * Subscription helper functions
 */

// Helper function to create subscriptions with consistent error handling
export function createSubscription(
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
