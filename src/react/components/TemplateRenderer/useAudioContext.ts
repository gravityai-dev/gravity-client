/**
 * useAudioContext - Hook for managing audio capture, playback, and state
 *
 * Handles:
 * - Audio capture with VAD (muted when assistant is speaking)
 * - Audio playback
 * - AUDIO_STATE event tracking (SPEECH_STARTED, SPEECH_ENDED)
 * - Building the AudioContext for templates
 */

import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useAudioCapture } from "../../../realtime/useAudioCapture";
import { useAudioPlayback } from "../../../realtime/useAudioPlayback";
import type { AudioContext } from "../../../realtime/types";

interface UseAudioContextOptions {
  /** Send binary audio data via unified WebSocket */
  sendAudio?: (audioData: ArrayBuffer) => void;
  /** Ref to set playAudio callback for receiving audio */
  playAudioRef?: React.MutableRefObject<(audioData: ArrayBuffer) => void>;
  /** Ref to set audio state callback for templates to subscribe to */
  audioStateCallbackRef?: React.MutableRefObject<((state: string, metadata?: Record<string, any>) => void) | null>;
  /** Send JSON message via WebSocket */
  sendMessage?: (message: Record<string, any>) => void;
}

export function useAudioContext({
  sendAudio: sendAudioProp,
  playAudioRef: playAudioRefProp,
  audioStateCallbackRef,
  sendMessage,
}: UseAudioContextOptions): AudioContext {
  // Ref for sending audio - uses prop from GravityClient (unified WebSocket)
  const sendAudioRef = useRef<(data: ArrayBuffer) => void>(() => {});

  // Update sendAudioRef when prop changes
  useEffect(() => {
    if (sendAudioProp) {
      sendAudioRef.current = sendAudioProp;
    }
  }, [sendAudioProp]);

  // Memoized callback for audio capture
  const handleAudioData = useCallback((audioData: ArrayBuffer) => {
    sendAudioRef.current(audioData);
  }, []);

  // Audio playback hook - isPlaying is the source of truth for assistant speaking
  const audioPlayback = useAudioPlayback();

  // Wire up playback to the ref from GravityClient so it receives audio from unified WebSocket
  useEffect(() => {
    if (playAudioRefProp) {
      playAudioRefProp.current = audioPlayback.playAudio;
    }
  }, [playAudioRefProp, audioPlayback.playAudio]);

  // Ref to store template's audio state callback (set via onAudioState)
  const templateAudioStateCallbackRef = useRef<
    ((event: { state: any; metadata?: Record<string, any> }) => void) | null
  >(null);

  // Handle audio state events from GravityClient
  // SPEECH_ENDED marks the queue as complete so isPlaying becomes false when last chunk finishes
  const handleAudioState = useCallback(
    (state: string, metadata?: Record<string, unknown>) => {
      console.log("[useAudioContext] Audio state received:", state);

      if (state === "SPEECH_ENDED" || state === "SESSION_ENDED") {
        console.log("[useAudioContext] SPEECH_ENDED - marking queue complete");
        // Mark queue as complete - isPlaying will become false when last chunk finishes
        audioPlayback.markAsLastChunk();
      }

      // Forward to template's callback if registered
      if (templateAudioStateCallbackRef.current) {
        templateAudioStateCallbackRef.current({ state: state as any, metadata });
      }
    },
    [audioPlayback]
  );

  // Wire up the audio state handler to GravityClient's callback ref
  useEffect(() => {
    if (audioStateCallbackRef) {
      audioStateCallbackRef.current = handleAudioState;
    }
    return () => {
      if (audioStateCallbackRef) {
        audioStateCallbackRef.current = null;
      }
    };
  }, [audioStateCallbackRef, handleAudioState]);

  // isAssistantSpeaking is simply whether audio is playing
  // - true when first audio chunk starts playing (useAudioPlayback sets isPlaying=true)
  // - false when last audio chunk finishes (after SPEECH_ENDED + markAsLastChunk)
  const isAssistantSpeaking = audioPlayback.isPlaying;

  // Log state changes for debugging
  useEffect(() => {
    console.log("[useAudioContext] isAssistantSpeaking changed:", isAssistantSpeaking);
  }, [isAssistantSpeaking]);

  // Audio capture hook - sends audio to websocket when speech ends
  // Mute mic when assistant is speaking (from SPEECH_STARTED event)
  const audioCapture = useAudioCapture({
    onAudioData: handleAudioData,
    isMuted: isAssistantSpeaking,
  });

  // Build audio context for templates
  const audioContext: AudioContext = useMemo(
    () => ({
      capture: {
        startCapture: audioCapture.startCapture,
        stopCapture: audioCapture.stopCapture,
        isCapturing: audioCapture.isCapturing,
        isSpeaking: audioCapture.isSpeaking,
        isLoading: audioCapture.isLoading,
        error: audioCapture.error,
      },
      // Expose assistant speaking state so templates can react to it
      isAssistantSpeaking,
      playback: {
        playAudio: audioPlayback.playAudio,
        stopAll: audioPlayback.stopAll,
        isPlaying: audioPlayback.isPlaying,
      },
      websocket: {
        connect: () => Promise.resolve(), // Already connected via GravityClient
        disconnect: () => {}, // Managed by GravityClient
        sendAudio: sendAudioRef.current,
        sendControl: (type: string, data?: Record<string, any>) => {
          // Send control message via WebSocket (e.g., AUDIO_CONTROL)
          sendMessage?.({ type, ...data });
        },
        isConnected: true, // Always connected if GravityClient is connected
      },
      // Subscribe to audio state changes (SESSION_READY, SPEECH_STARTED, etc.)
      onAudioState: (callback) => {
        // Store template's callback - handleAudioState will forward events to it
        templateAudioStateCallbackRef.current = callback;
        // Return unsubscribe function
        return () => {
          templateAudioStateCallbackRef.current = null;
        };
      },
      // Wait for a specific audio state (e.g., SESSION_READY before starting mic)
      waitForState: (targetState, timeoutMs = 30000) => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Timeout waiting for ${targetState}`));
          }, timeoutMs);

          if (audioStateCallbackRef) {
            const previousCallback = audioStateCallbackRef.current;
            audioStateCallbackRef.current = (state, metadata) => {
              // Call previous callback if exists
              if (previousCallback) {
                previousCallback(state, metadata);
              }
              // Check if this is the target state
              if (state === targetState) {
                clearTimeout(timeout);
                // Restore previous callback
                audioStateCallbackRef.current = previousCallback;
                resolve({ state: state as any, metadata });
              }
            };
          } else {
            // No callback ref - resolve immediately (fallback)
            clearTimeout(timeout);
            resolve({ state: targetState, metadata: {} });
          }
        });
      },
    }),
    [audioCapture, audioPlayback, sendAudioProp, audioStateCallbackRef, isAssistantSpeaking]
  );

  return audioContext;
}
