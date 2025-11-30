import { useState, useEffect, useCallback } from "react";

interface UseGraphQLOptions {
  skip?: boolean;
  fetchPolicy?: "cache-first" | "network-only";
}

interface UseGraphQLReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: (newVariables?: Record<string, any>) => Promise<T>;
}

/**
 * Simple GraphQL hook using fetch - no Apollo required
 * Supports JWT auth via getAccessToken function
 */
export function useGraphQL<T = any>(
  apiUrl: string,
  getAccessToken: (() => Promise<string | null>) | undefined,
  query: string,
  variables?: Record<string, any>,
  options: UseGraphQLOptions = {}
): UseGraphQLReturn<T> {
  const { skip = false } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (overrideVariables?: Record<string, any>): Promise<T> => {
      setLoading(true);
      setError(null);

      try {
        // Get JWT token
        const token = getAccessToken ? await getAccessToken() : null;
        console.log("[GraphQL] Token present:", !!token);

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        } else {
          console.warn("[GraphQL] No access token available");
        }

        const response = await fetch(`${apiUrl}/graphql`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            query,
            variables: overrideVariables || variables,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors) {
          throw new Error(result.errors[0]?.message || "GraphQL error");
        }

        setData(result.data);
        return result.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [query, variables, apiUrl, getAccessToken]
  );

  // Auto-execute on mount if not skipped
  useEffect(() => {
    if (!skip && variables) {
      execute();
    }
  }, [skip, JSON.stringify(variables)]);

  const refetch = useCallback(
    (newVariables?: Record<string, any>) => {
      return execute(newVariables || variables);
    },
    [execute, variables]
  );

  return { data, loading, error, refetch };
}

export default useGraphQL;
