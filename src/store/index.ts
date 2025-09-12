/**
 * Main Gravity Client Store
 * Clean, organized, self-contained slices
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { createConnectionSlice, ConnectionSlice } from './slices/connection/index';
import { createConversationSlice, ConversationSlice } from './slices/conversation';
import { createResponseSlice, ResponseSlice } from './slices/response';
import { createUISlice, UISlice } from './slices/ui';

// Combined store interface
export interface GravityStore extends 
  ConnectionSlice,
  ConversationSlice, 
  ResponseSlice,
  UISlice {}

// Create the store
export const useGravityStore = create<GravityStore>()(
  devtools(
    subscribeWithSelector(
      (...args) => ({
        ...createConnectionSlice(...args),
        ...createConversationSlice(...args),
        ...createResponseSlice(...args),
        ...createUISlice(...args),
      }),
    ),
    {
      name: 'gravity-store',
    }
  )
);

// Export types
export * from './types';
