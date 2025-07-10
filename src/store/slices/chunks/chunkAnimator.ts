import { MessageChunkProps } from "../../../types/public";

export interface ChunkAnimatorState {
  chunks: MessageChunkProps[];
  animatedChunks: MessageChunkProps[];
  completedChunkIndices: Set<number>;
}

/**
 * Simplified ChunkAnimator that manages message chunks
 */
export class ChunkAnimator {
  private state: ChunkAnimatorState = {
    chunks: [],
    animatedChunks: [],
    completedChunkIndices: new Set<number>(),
  };

  private animationCallbacks: Map<string, (chunk: MessageChunkProps) => void> = new Map();

  constructor(private conversationId: string, private messageId: string) {}

  /**
   * Add a chunk to the state
   */
  addChunk(chunk: MessageChunkProps): void {
    // Skip duplicates
    if (this.state.chunks.find((c) => c.index === chunk.index)) {
      return;
    }

    // Add to chunks array (for immediate display)
    this.state.chunks.push(chunk);
    this.state.chunks.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

    // Try to animate chunks in order
    this.tryAnimateNextChunk();
  }

  /**
   * Try to animate the next chunk in sequence
   */
  private tryAnimateNextChunk(): void {
    // Find the next chunk to animate
    const nextIndex = this.state.animatedChunks.length === 0 
      ? Math.min(...this.state.chunks.map(c => c.index ?? 0))
      : Math.max(...this.state.animatedChunks.map(c => c.index ?? 0)) + 1;
    
    const nextChunk = this.state.chunks.find(c => c.index === nextIndex);
    if (!nextChunk || this.state.animatedChunks.find(c => c.index === nextIndex)) {
      return;
    }

    // Animate the chunk
    this.state.animatedChunks.push(nextChunk);
    this.animationCallbacks.forEach((callback) => callback(nextChunk));

    // Mark as completed and try next
    setTimeout(() => {
      this.state.completedChunkIndices.add(nextChunk.index ?? 0);
      this.tryAnimateNextChunk();
    }, 50);
  }

  /**
   * Register a callback for chunk animations
   */
  onChunkAnimate(id: string, callback: (chunk: MessageChunkProps) => void): void {
    this.animationCallbacks.set(id, callback);
  }

  /**
   * Unregister a callback
   */
  offChunkAnimate(id: string): void {
    this.animationCallbacks.delete(id);
  }

  /**
   * Get all chunks (for immediate display)
   */
  getChunks(): MessageChunkProps[] {
    return [...this.state.chunks];
  }

  /**
   * Get animated chunks
   */
  getAnimatedChunks(): MessageChunkProps[] {
    return [...this.state.animatedChunks];
  }

  /**
   * Check if all chunks have been animated
   */
  isComplete(): boolean {
    return this.state.chunks.length > 0 &&
           this.state.animatedChunks.length === this.state.chunks.length;
  }

  /**
   * Mark conversation as complete and check for missing chunks
   */
  markConversationComplete(): void {
    if (this.state.chunks.length > 0) {
      const indices = this.state.chunks.map(c => c.index ?? 0).sort((a, b) => a - b);
      const minIndex = indices[0];
      const maxIndex = indices[indices.length - 1];
      const expectedCount = maxIndex - minIndex + 1;
      
      if (indices.length < expectedCount) {
        const missing: number[] = [];
        for (let i = minIndex; i <= maxIndex; i++) {
          if (!indices.includes(i)) {
            missing.push(i);
          }
        }
        console.warn(
          `⚠️  [ChunkAnimator] Missing chunks! Expected ${expectedCount}, got ${indices.length}. Missing: ${missing.join(', ')}`
        );
      }
    }
  }

  /**
   * Reset the animator state
   */
  reset(): void {
    this.state = {
      chunks: [],
      animatedChunks: [],
      completedChunkIndices: new Set<number>(),
    };
  }
}
