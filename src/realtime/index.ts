/**
 * Realtime Audio Utilities
 *
 * Provider-agnostic audio streaming utilities for voice LLM integrations.
 * These utilities handle microphone capture, audio playback, and WebSocket transport.
 * The actual voice provider (Nova, OpenAI Realtime, etc.) is determined by the workflow node.
 */

export { useRealtimeWebSocket } from "./useRealtimeWebSocket";
export type { UseRealtimeWebSocketOptions, UseRealtimeWebSocketReturn, AudioStateEvent } from "./useRealtimeWebSocket";

export { useAudioCapture } from "./useAudioCapture";
export type { UseAudioCaptureOptions, UseAudioCaptureReturn } from "./useAudioCapture";

export { useAudioPlayback } from "./useAudioPlayback";
export type { UseAudioPlaybackOptions, UseAudioPlaybackReturn } from "./useAudioPlayback";

export * from "./audioUtils";

export type { AudioContext, ConnectionStatus, AudioState, ControlMessage } from "./types";
