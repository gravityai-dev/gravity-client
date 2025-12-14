/**
 * useAudioCapture - Microphone capture with Voice Activity Detection
 *
 * Captures audio from the microphone using VAD (Voice Activity Detection).
 * Outputs PCM audio segments when speech is detected.
 *
 * Uses @ricky0123/vad-web for VAD processing.
 */

import { useRef, useCallback, useEffect, useState } from "react";
import { float32ToInt16, addSilencePadding } from "./audioUtils";

export interface UseAudioCaptureOptions {
  /** Callback when audio segment is captured (PCM ArrayBuffer) */
  onAudioData?: (audioData: ArrayBuffer) => void;
  /** Callback when speech starts */
  onSpeechStart?: () => void;
  /** Callback when speech ends */
  onSpeechEnd?: () => void;
  /** Whether to mute capture (e.g., when assistant is speaking) */
  isMuted?: boolean;
  /** VAD positive speech threshold (default: 0.3) */
  positiveSpeechThreshold?: number;
  /** VAD negative speech threshold (default: 0.15) */
  negativeSpeechThreshold?: number;
}

export interface UseAudioCaptureReturn {
  /** Start microphone capture */
  startCapture: () => Promise<{ success: boolean; reason?: string }>;
  /** Stop microphone capture */
  stopCapture: () => Promise<{ success: boolean; reason?: string }>;
  /** Toggle capture on/off */
  toggleCapture: () => Promise<{ success: boolean; reason?: string }>;
  /** Whether currently capturing (mic is on) */
  isCapturing: boolean;
  /** Whether user is currently speaking (VAD detected speech) */
  isSpeaking: boolean;
  /** Whether VAD is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
}

export function useAudioCapture(options: UseAudioCaptureOptions = {}): UseAudioCaptureReturn {
  const {
    onAudioData,
    onSpeechStart,
    onSpeechEnd,
    isMuted = false,
    positiveSpeechThreshold = 0.3,
    negativeSpeechThreshold = 0.15,
  } = options;

  const [vadInstance, setVadInstance] = useState<any>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMutedRef = useRef(isMuted);
  const isMountedRef = useRef(true);

  // Update muted state ref and reset speaking state when muted
  // CRITICAL: Pause/resume VAD to prevent picking up assistant's speech
  useEffect(() => {
    isMutedRef.current = isMuted;

    if (isMuted) {
      // When muted, immediately clear speaking state and PAUSE VAD
      // This prevents the assistant's audio from being buffered/detected
      setIsSpeaking(false);
      if (vadInstance) {
        console.log("[AudioCapture] Pausing VAD - assistant speaking");
        try {
          // MicVAD.pause() may or may not return a promise
          const result = vadInstance.pause();
          if (result && typeof result.catch === "function") {
            result.catch((err: Error) => console.error("[AudioCapture] Error pausing VAD:", err));
          }
        } catch (err) {
          console.error("[AudioCapture] Error pausing VAD:", err);
        }
      }
    } else {
      // When unmuted, resume VAD to start listening again
      if (vadInstance) {
        console.log("[AudioCapture] Resuming VAD - assistant stopped");
        try {
          // MicVAD.start() may or may not return a promise
          const result = vadInstance.start();
          if (result && typeof result.catch === "function") {
            result.catch((err: Error) => console.error("[AudioCapture] Error resuming VAD:", err));
          }
        } catch (err) {
          console.error("[AudioCapture] Error resuming VAD:", err);
        }
      }
    }
  }, [isMuted, vadInstance]);

  // Process and send audio
  const processAndSendAudio = useCallback(
    (audio: Float32Array) => {
      // Convert Float32 to Int16 PCM
      const int16Data = float32ToInt16(audio);

      // Add silence padding for clean boundaries
      const paddedBuffer = addSilencePadding(int16Data, 1000, 25000);

      // Convert to ArrayBuffer and send
      if (onAudioData) {
        onAudioData(paddedBuffer.buffer as ArrayBuffer);
      }
    },
    [onAudioData]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (vadInstance) {
        vadInstance.destroy?.().catch?.(() => {});
      }
    };
  }, [vadInstance]);

  // Start VAD capture
  const startCapture = useCallback(async (): Promise<{ success: boolean; reason?: string }> => {
    console.log("[AudioCapture] startCapture called, vadInstance:", !!vadInstance);
    if (vadInstance) {
      console.log("[AudioCapture] VAD already running");
      return { success: true };
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("[AudioCapture] Loading MicVAD...");
      // Dynamic import to avoid SSR issues
      const { MicVAD } = await import("@ricky0123/vad-web");
      console.log("[AudioCapture] MicVAD loaded, creating instance...");

      const vad = await MicVAD.new({
        positiveSpeechThreshold,
        negativeSpeechThreshold,
        minSpeechFrames: 4,
        preSpeechPadFrames: 1,
        redemptionFrames: 8,
        onnxWASMBasePath: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/",
        baseAssetPath: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.27/dist/",
        onSpeechEnd: (audio: Float32Array) => {
          if (!isMutedRef.current) {
            setIsSpeaking(false);
            processAndSendAudio(audio);
            onSpeechEnd?.();
          }
        },
        onSpeechStart: () => {
          if (!isMutedRef.current) {
            setIsSpeaking(true);
            onSpeechStart?.();
          }
        },
      } as any);

      console.log("[AudioCapture] VAD created, starting...");
      await vad.start();
      console.log("[AudioCapture] VAD started successfully!");

      if (isMountedRef.current) {
        setVadInstance(vad);
        setIsCapturing(true);
        setIsLoading(false);
      }

      return { success: true };
    } catch (err: any) {
      console.error("[AudioCapture] Failed to start:", err);
      if (isMountedRef.current) {
        setError(err.message);
        setIsLoading(false);
      }
      return { success: false, reason: err.message };
    }
  }, [vadInstance, positiveSpeechThreshold, negativeSpeechThreshold, processAndSendAudio, onSpeechStart, onSpeechEnd]);

  // Stop VAD capture
  const stopCapture = useCallback(async (): Promise<{ success: boolean; reason?: string }> => {
    if (!vadInstance) {
      return { success: false, reason: "not_running" };
    }

    try {
      await vadInstance.pause();
      await vadInstance.destroy();

      setVadInstance(null);
      setIsCapturing(false);

      return { success: true };
    } catch (err: any) {
      console.error("[AudioCapture] Error stopping:", err);
      setError(err.message);
      return { success: false, reason: err.message };
    }
  }, [vadInstance]);

  // Toggle capture
  const toggleCapture = useCallback(async () => {
    if (isCapturing) {
      return await stopCapture();
    } else {
      return await startCapture();
    }
  }, [isCapturing, startCapture, stopCapture]);

  return {
    startCapture,
    stopCapture,
    toggleCapture,
    isCapturing,
    isSpeaking,
    isLoading,
    error,
  };
}
