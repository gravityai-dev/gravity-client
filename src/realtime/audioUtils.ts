/**
 * Audio utility functions for PCM conversion and processing
 */

/**
 * Convert Float32Array audio to Int16Array PCM (16-bit signed)
 * @param float32Audio - Audio data from Web Audio API (range -1 to 1)
 * @returns Int16Array PCM data
 */
export function float32ToInt16(float32Audio: Float32Array): Int16Array {
  const int16Data = new Int16Array(float32Audio.length);
  for (let i = 0; i < float32Audio.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Audio[i]));
    int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Data;
}

/**
 * Convert Int16Array PCM to ArrayBuffer
 */
export function int16ToArrayBuffer(int16Data: Int16Array): ArrayBuffer {
  return int16Data.buffer.slice(0) as ArrayBuffer;
}

/**
 * Convert ArrayBuffer to Base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Add silence padding to audio buffer
 * Useful for VAD to ensure clean audio boundaries
 */
export function addSilencePadding(
  audio: Int16Array,
  startSilenceSamples: number = 1000,
  endSilenceSamples: number = 25000
): Int16Array {
  const paddedBuffer = new Int16Array(startSilenceSamples + audio.length + endSilenceSamples);
  paddedBuffer.set(audio, startSilenceSamples);
  return paddedBuffer;
}

/**
 * Calculate audio duration in seconds
 * @param samples - Number of samples
 * @param sampleRate - Sample rate (default 16000 for Nova)
 */
export function calculateDuration(samples: number, sampleRate: number = 16000): number {
  return samples / sampleRate;
}
