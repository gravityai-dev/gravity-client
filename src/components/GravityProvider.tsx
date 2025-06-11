/**
 * GravityProvider
 * Provides Gravity AI context and manages connection lifecycle
 */

import React, { useEffect } from 'react';
import { ApolloProvider } from '@apollo/client';
import { useGravityStore } from '../store';
import { GravityConfig } from '../types/config';

export interface GravityTheme {
  components: Record<string, React.ComponentType<any>>;
  fallback?: React.ComponentType<any>;
}

interface GravityProviderProps {
  config: GravityConfig;
  theme?: GravityTheme;
  children: React.ReactNode;
}

export const GravityProvider: React.FC<GravityProviderProps> = ({ 
  config, 
  theme,
  children 
}) => {
  const { connect, disconnect, client, setComponentConfig } = useGravityStore();
  
  // Set component configuration from theme
  useEffect(() => {
    if (theme?.components) {
      setComponentConfig(theme.components);
    }
  }, [theme, setComponentConfig]);
  
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

  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
};
