/**
 * Subscription management logic
 */

import { AI_RESULT_SUBSCRIPTION } from "../../../graphql/subscriptions";
import { GRAVITY_RESULT_SUBSCRIPTION } from "../../../graphql/gravitySubscriptions";
import { createSubscription } from "./subscriptionHelpers";

// Track last subscription update to prevent rapid successive calls
let lastSubscriptionUpdate: { conversationId: string; timestamp: number } | null = null;

export interface SubscriptionManagerOptions {
  client: any;
  conversationId: string;
  subscriptions: Map<string, any>;
  processMessage: (message: any) => void;
  processGravityEvent?: (event: any) => void;
}

export function updateSubscriptions({
  client,
  conversationId,
  subscriptions,
  processMessage,
  processGravityEvent,
}: SubscriptionManagerOptions) {
  if (!conversationId) {
    console.warn("[GravityClient] Cannot update subscription - no conversationId set");
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

    // Create both subscriptions
    // Temporarily disabled aiResult subscription
    /*
    const messageSubscription = createSubscription(
      client,
      AI_RESULT_SUBSCRIPTION,
      {
        conversationId,
      },
      {
        onData: (result: any) => {
          if (result?.data?.aiResult) {
            processMessage(result.data.aiResult);
          }
        },
        subscriptionName: "message",
      }
    );
    */

    // Add new GravityEvent subscription
    const gravitySubscription = createSubscription(
      client,
      GRAVITY_RESULT_SUBSCRIPTION,
      {
        conversationId,
      },
      {
        onData: (result: any) => {
          if (result?.data?.gravityResult) {
            if (processGravityEvent) {
              processGravityEvent(result.data.gravityResult);
            } else {
              // Default: just log the GravityEvent
              console.log("[GravityEvent]", result.data.gravityResult);
            }
          }
        },
        subscriptionName: "gravity",
      }
    );

    // Update the subscription entry with the actual subscription (no longer pending)
    subscriptions.set(subscriptionKey, {
      subscription: gravitySubscription, // Using gravity subscription as main subscription
      gravitySubscription,
      conversationId,
      createdAt: Date.now(),
      closed: false,
      pending: false,
    });
  } catch (error) {
    console.error("❌ [GravityClient] Error setting up subscriptions:", error);
    // Remove the pending entry on error
    subscriptions.delete(subscriptionKey);
    throw error;
  }
}

export function cleanupSubscriptions(subscriptions: Map<string, any>) {
  console.log(`🧹 [ConnectionSlice] Cleaning up ${subscriptions.size} subscriptions`);

  subscriptions.forEach((entry: any, key: string) => {
    console.log(`🧹 [ConnectionSlice] Cleaning up subscription: ${key}`);

    // Clean up aiResult subscription
    if (entry?.subscription && typeof entry.subscription.unsubscribe === "function") {
      try {
        entry.subscription.unsubscribe();
        // Mark as closed to prevent reuse
        entry.closed = true;
      } catch (error) {
        console.error(`❌ [ConnectionSlice] Error cleaning up subscription ${key}:`, error);
      }
    }

    // Clean up gravityResult subscription
    if (entry?.gravitySubscription && typeof entry.gravitySubscription.unsubscribe === "function") {
      try {
        entry.gravitySubscription.unsubscribe();
      } catch (error) {
        console.error(`❌ [ConnectionSlice] Error cleaning up gravity subscription ${key}:`, error);
      }
    }
  });

  subscriptions.clear();
}
