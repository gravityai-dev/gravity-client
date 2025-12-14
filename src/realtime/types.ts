/**
 * Shared types for realtime audio streaming
 */

export type ConnectionStatus = "idle" | "connecting" | "connected" | "error" | "ended";

export type AudioState =
  | "SESSION_READY"
  | "SESSION_ENDED"
  | "SPEECH_STARTED"
  | "SPEECH_STREAMING"
  | "SPEECH_ENDED"
  | "TOOL_USE";

export interface AudioStateMessage {
  type: "audioState";
  state: AudioState;
  metadata?: Record<string, any>;
}

export interface ControlMessage {
  type: string;
  state?: AudioState;
  audioState?: AudioState;
  metadata?: Record<string, any>;
  [key: string]: any;
}

/**
 * Audio context passed to templates via client.audio
 * Provides access to audio capture, playback, and WebSocket utilities
 */
export interface AudioStateEvent {
  state: AudioState;
  metadata?: Record<string, any>;
  message?: string;
}

export interface AudioContext {
  /** Microphone capture with VAD */
  capture: {
    startCapture: () => Promise<{ success: boolean; reason?: string }>;
    stopCapture: () => Promise<{ success: boolean; reason?: string }>;
    isCapturing: boolean;
    /** Whether user is currently speaking (VAD detected speech) */
    isSpeaking: boolean;
    isLoading: boolean;
    error: string | null;
  };
  /** Whether assistant is currently speaking (from SPEECH_STARTED/SPEECH_ENDED events) */
  isAssistantSpeaking: boolean;
  /** Audio playback */
  playback: {
    playAudio: (audioData: ArrayBuffer) => void;
    stopAll: () => void;
    isPlaying: boolean;
  };
  /** WebSocket for audio streaming */
  websocket: {
    connect: () => Promise<void>;
    disconnect: () => void;
    sendAudio: (audioData: ArrayBuffer) => void;
    sendControl: (type: string, data?: Record<string, any>) => void;
    isConnected: boolean;
  };
  /** Subscribe to audio state changes (SESSION_READY, SPEECH_STARTED, etc.) */
  onAudioState?: (callback: (event: AudioStateEvent) => void) => () => void;
  /** Wait for a specific audio state (e.g., SESSION_READY before starting mic) */
  waitForState?: (targetState: AudioState, timeoutMs?: number) => Promise<AudioStateEvent>;
}
