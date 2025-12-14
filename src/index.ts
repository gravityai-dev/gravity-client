/**
 * @gravityai-dev/gravity-client
 *
 * React SDK for Gravity AI - Real-time AI workflow streaming
 */

// Core (framework-agnostic)
export {
  HistoryManager,
  historyManager,
  type UserMessage,
  type AssistantResponse,
  type ComponentEntry,
  type HistoryEntry,
  type HistoryMetadata,
} from "./core";

export {
  type GravityConfig,
  type SessionParams,
  type StreamingState,
  type WorkflowState,
  type ServerMessage,
  type ComponentInitMessage,
  type ComponentDataMessage,
  type ComponentRemoveMessage,
  type WorkflowStateMessage,
  type UserActionType,
  type UserActionPayload,
} from "./core";

// React bindings
export {
  // Main component
  GravityClient,
  // Additional components
  ErrorBoundary,
  ShadowDOMWrapper,
  ComponentRenderer,
  TemplateRenderer,
  // Hooks
  useGravityWebSocket,
  useHistoryManager,
  useComponentLoader,
  useGraphQL,
  // Store
  useComponentData,
  useAIContext,
  // Context
  UserProvider,
  useUser,
  // HOC
  withZustandData,
} from "./react";

// Profile API (data only, UI in app)
export {
  useProfileData,
  type ProfileData,
  type Memory,
  type Insights,
  type UseProfileDataOptions,
  type UseProfileDataReturn,
} from "./react/profile";

// Auth (Provider-Agnostic OIDC)
export {
  GravityAuthProvider,
  useGravityAuth,
  type GravityAuthConfig,
  type GravityUser,
  type GravityAuthState,
} from "./auth";

// WebSocket endpoint paths
export const WS_ENDPOINTS = {
  GRAVITY: "/ws/gravity", // Unified endpoint for UI + audio
  GRAVITY_DS: "/ws/gravity-ds", // Deprecated - use GRAVITY
  AUDIO: "/ws/audio", // Deprecated - use GRAVITY
} as const;

// Realtime Audio Utilities
export {
  useRealtimeWebSocket,
  useAudioCapture,
  useAudioPlayback,
  type UseRealtimeWebSocketOptions,
  type UseRealtimeWebSocketReturn,
  type AudioStateEvent,
  type UseAudioCaptureOptions,
  type UseAudioCaptureReturn,
  type UseAudioPlaybackOptions,
  type UseAudioPlaybackReturn,
} from "./realtime";

export {
  float32ToInt16,
  int16ToArrayBuffer,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  addSilencePadding,
  calculateDuration,
} from "./realtime/audioUtils";
