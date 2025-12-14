/**
 * useAudioPlayback - Audio playback with timeline-based event scheduling
 *
 * Handles LPCM audio playback with precise timing for mic mute/unmute synchronization.
 * Uses Web Audio API for low-latency playback and accurate timing.
 *
 * Audio format: LPCM Int16, 24kHz, mono (from Nova Speech)
 */

import { useRef, useCallback, useEffect, useState } from "react";

/**
 * Decode LPCM audio data to AudioBuffer
 * Format: Int16, 24kHz, mono (from Nova Speech)
 */
function decodeLPCM(audioContext: AudioContext, data: ArrayBuffer): AudioBuffer {
  const sampleRate = 24000;
  const int16 = new Int16Array(data);
  const numSamples = int16.length;

  // Create AudioBuffer
  const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  // Convert Int16 (-32768 to 32767) to Float32 (-1 to 1)
  for (let i = 0; i < numSamples; i++) {
    channelData[i] = int16[i] / 32768;
  }

  return audioBuffer;
}

export interface UseAudioPlaybackOptions {
  /** Callback when playback starts */
  onPlaybackStart?: () => void;
  /** Callback when playback ends */
  onPlaybackEnd?: () => void;
  /** Callback when a chunk starts playing */
  onChunkStart?: () => void;
}

export interface UseAudioPlaybackReturn {
  /** Play audio data (LPCM Int16 ArrayBuffer) */
  playAudio: (audioData: ArrayBuffer) => void;
  /** Stop all audio playback */
  stopAll: () => void;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Current AudioContext time */
  getCurrentTime: () => number;
  /** Get the next scheduled audio time (when next chunk will play) */
  getNextTime: () => number;
  /** Mark that no more audio chunks are coming - onPlaybackEnd fires when last chunk finishes */
  markAsLastChunk: () => void;
  /** Schedule a callback to fire at a specific audio timeline time */
  scheduleEvent: (callback: () => void, audioTime: number) => void;
  /** Schedule a callback to fire when the next audio chunk starts playing */
  scheduleOnNextChunk: (callback: () => void) => void;
}

interface QueuedAudio {
  audioData: ArrayBuffer;
  timestamp: number;
}

export function useAudioPlayback(options: UseAudioPlaybackOptions = {}): UseAudioPlaybackReturn {
  const { onPlaybackStart, onPlaybackEnd, onChunkStart } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const queueRef = useRef<QueuedAudio[]>([]);
  const nextTimeRef = useRef<number>(0);
  const isProcessingRef = useRef(false);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const hasStartedRef = useRef(false);
  const lastChunkEndTimeRef = useRef<number>(0);
  // Track if we've received the signal that no more chunks are coming
  const isLastChunkRef = useRef(false);
  // Scheduled events on the audio timeline
  const scheduledEventsRef = useRef<Array<{ callback: () => void; audioTime: number }>>([]);
  const eventCheckerRef = useRef<number | null>(null);
  // Callbacks to fire when next chunk starts
  const onNextChunkCallbacksRef = useRef<Array<() => void>>([]);

  // Initialize AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
    return audioContextRef.current;
  }, []);

  // Get current time
  const getCurrentTime = useCallback(() => {
    return audioContextRef.current?.currentTime || 0;
  }, []);

  // Get next scheduled audio time
  const getNextTime = useCallback(() => {
    return nextTimeRef.current;
  }, []);

  // Schedule an event to fire at a specific audio timeline time
  const scheduleEvent = useCallback((callback: () => void, audioTime: number) => {
    scheduledEventsRef.current.push({ callback, audioTime });
    // Sort by time
    scheduledEventsRef.current.sort((a, b) => a.audioTime - b.audioTime);

    // Start event checker if not running
    if (!eventCheckerRef.current && audioContextRef.current) {
      eventCheckerRef.current = window.setInterval(() => {
        const now = audioContextRef.current?.currentTime || 0;
        // Fire all events that should have happened by now
        while (scheduledEventsRef.current.length > 0 && scheduledEventsRef.current[0].audioTime <= now) {
          const event = scheduledEventsRef.current.shift()!;
          console.log(`[AudioPlayback] Firing scheduled event at audio time ${now.toFixed(3)}s`);
          event.callback();
        }
        // Stop checker if no more events
        if (scheduledEventsRef.current.length === 0 && eventCheckerRef.current) {
          clearInterval(eventCheckerRef.current);
          eventCheckerRef.current = null;
        }
      }, 10);
    }
  }, []);

  // Schedule a callback to fire when the next audio chunk starts playing
  // If audio is already playing, fire immediately
  const scheduleOnNextChunk = useCallback((callback: () => void) => {
    // If audio is already playing, fire immediately at current time
    if (hasStartedRef.current && audioContextRef.current) {
      console.log("[AudioPlayback] Audio already playing - firing callback immediately");
      callback();
      return;
    }
    // Otherwise queue for next chunk
    onNextChunkCallbacksRef.current.push(callback);
  }, []);

  // Process audio queue
  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) return;
    if (queueRef.current.length === 0) return;

    isProcessingRef.current = true;
    const audioContext = getAudioContext();
    const gainNode = gainNodeRef.current!;

    while (queueRef.current.length > 0) {
      const item = queueRef.current.shift()!;

      try {
        // Decode LPCM audio (Int16, 24kHz, mono)
        const audioBuffer = decodeLPCM(audioContext, item.audioData);

        // Calculate start time
        const now = audioContext.currentTime;
        const startTime = Math.max(now, nextTimeRef.current);

        // Create source
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(gainNode);

        // Track active sources
        activeSourcesRef.current.add(source);

        // Fire playback start on first chunk
        if (!hasStartedRef.current) {
          hasStartedRef.current = true;
          setIsPlaying(true);
          onPlaybackStart?.();
        }

        onChunkStart?.();

        // Fire any callbacks waiting for next chunk
        while (onNextChunkCallbacksRef.current.length > 0) {
          const cb = onNextChunkCallbacksRef.current.shift()!;
          // Schedule to fire at the actual start time
          scheduleEvent(cb, startTime);
        }

        // Schedule playback
        source.start(startTime);

        // Update next time
        nextTimeRef.current = startTime + audioBuffer.duration;
        lastChunkEndTimeRef.current = nextTimeRef.current;

        // Cleanup when done
        source.onended = () => {
          activeSourcesRef.current.delete(source);

          // Only fire onPlaybackEnd when:
          // 1. isLastChunk is true (SPEECH_ENDED received)
          // 2. No more active sources
          // 3. No more queued chunks
          if (isLastChunkRef.current && activeSourcesRef.current.size === 0 && queueRef.current.length === 0) {
            console.log("[AudioPlayback] Last chunk finished playing - firing onPlaybackEnd");
            setIsPlaying(false);
            hasStartedRef.current = false;
            isLastChunkRef.current = false;
            onPlaybackEnd?.();
          }
        };
      } catch (error) {
        console.error("[AudioPlayback] Failed to decode audio:", error);
      }
    }

    isProcessingRef.current = false;
  }, [getAudioContext, onPlaybackStart, onPlaybackEnd, onChunkStart]);

  // Play audio
  const playAudio = useCallback(
    (audioData: ArrayBuffer) => {
      queueRef.current.push({ audioData, timestamp: Date.now() });
      processQueue();
    },
    [processQueue]
  );

  // Stop all audio
  const stopAll = useCallback(() => {
    // Stop all active sources
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        // Ignore errors from already stopped sources
      }
    });
    activeSourcesRef.current.clear();

    // Clear queue
    queueRef.current = [];

    // Reset state
    nextTimeRef.current = 0;
    hasStartedRef.current = false;
    isProcessingRef.current = false;
    isLastChunkRef.current = false;
    setIsPlaying(false);

    // Clear scheduled events
    scheduledEventsRef.current = [];
    onNextChunkCallbacksRef.current = [];
    if (eventCheckerRef.current) {
      clearInterval(eventCheckerRef.current);
      eventCheckerRef.current = null;
    }
  }, []);

  // Mark that no more audio chunks are coming
  // Called when SPEECH_ENDED is received - onPlaybackEnd fires when last chunk actually finishes
  const markAsLastChunk = useCallback(() => {
    console.log("[AudioPlayback] Marked as last chunk - will fire onPlaybackEnd when audio finishes");
    isLastChunkRef.current = true;

    // If nothing is playing and queue is empty, fire immediately
    if (activeSourcesRef.current.size === 0 && queueRef.current.length === 0 && hasStartedRef.current) {
      console.log("[AudioPlayback] No audio playing - firing onPlaybackEnd immediately");
      setIsPlaying(false);
      hasStartedRef.current = false;
      isLastChunkRef.current = false;
      onPlaybackEnd?.();
    }
  }, [onPlaybackEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (eventCheckerRef.current) {
        clearInterval(eventCheckerRef.current);
      }
    };
  }, [stopAll]);

  return {
    playAudio,
    stopAll,
    isPlaying,
    getCurrentTime,
    getNextTime,
    markAsLastChunk,
    scheduleEvent,
    scheduleOnNextChunk,
  };
}
