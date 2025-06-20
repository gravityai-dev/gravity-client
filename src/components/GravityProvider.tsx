/**
 * GravityProvider
 * Provides Gravity AI context and manages connection lifecycle
 */

import React, { useEffect } from "react";
import { ApolloProvider } from "@apollo/client";
import { useGravityStore } from "../store";
import { GravityConfig } from "../types/config";

interface GravityProviderProps {
  config: GravityConfig;
  children: React.ReactNode;
}

export const GravityProvider: React.FC<GravityProviderProps> = ({ config, children }) => {
  const { connect, disconnect, client } = useGravityStore();

  // Connect on mount with config
  useEffect(() => {
    connect(config);

    return () => {
      disconnect();
    };
  }, [config, connect, disconnect]);

  // If no Apollo client yet, show loading
  if (!client) {
    return <div>Connecting to Gravity AI...</div>;
  }

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
