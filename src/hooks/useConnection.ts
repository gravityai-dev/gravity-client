/**
 * Hook for accessing connection state
 */

import { useGravityStore } from '../store';

export const useConnection = () => {
  const store = useGravityStore();
  
  const {
    client,
    isConnected,
    isConnecting,
    error,
    config,
    connect,
    disconnect,
    setupSubscription,
    cleanupSubscription,
  } = store;

  return {
    // State
    client,
    isConnected,
    isConnecting,
    error,
    config,
    
    // Actions
    connect,
    disconnect,
    setupSubscription,
    cleanupSubscription,
  };
};
