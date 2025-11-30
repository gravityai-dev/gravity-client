/**
 * HistoryManager - Framework-agnostic conversation history manager
 *
 * Manages the timeline of user messages and assistant responses
 * Each assistant response can contain multiple components and has its own streaming state
 */

export interface UserMessage {
  id: string;
  type: "user_message";
  role: "user";
  content: string;
  chatId: string;
  timestamp: string;
  metadata: Record<string, any>;
}

export interface ComponentEntry {
  id: string;
  componentType: string;
  componentUrl: string;
  nodeId: string;
  chatId: string;
  props: Record<string, any>;
  metadata: Record<string, any>;
  /** Loaded component (framework-specific) */
  Component?: any;
}

export interface AssistantResponse {
  id: string;
  type: "assistant_response";
  role: "assistant";
  chatId: string;
  streamingState: "idle" | "streaming" | "complete";
  components: ComponentEntry[];
  timestamp: string;
}

export type HistoryEntry = UserMessage | AssistantResponse;

export interface HistoryMetadata {
  conversationId: string | null;
  userId: string | null;
  chatId: string | null;
}

type HistoryEventType = "init" | "add" | "update" | "clear" | "change";
type HistoryListener = (event: HistoryEventType, data?: any) => void;

export class HistoryManager {
  private history: HistoryEntry[] = [];
  private listeners: Set<HistoryListener> = new Set();
  private metadata: HistoryMetadata = {
    conversationId: null,
    userId: null,
    chatId: null,
  };

  /**
   * Initialize with session metadata
   */
  init(metadata: Partial<HistoryMetadata>): void {
    this.metadata = { ...this.metadata, ...metadata };
    this.emit("init", this.metadata);
  }

  /**
   * Add user message to history
   * Generates a unique chatId for request-response matching
   */
  addUserMessage(message: string, metadata: Record<string, any> & { chatId?: string } = {}): UserMessage {
    const chatId = metadata.chatId || this.generateId("chat");

    const entry: UserMessage = {
      id: this.generateId("user"),
      type: "user_message",
      role: "user",
      content: message,
      chatId,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.history.push(entry);
    this.emit("add", entry);
    this.emit("change", this.history);

    return entry;
  }

  /**
   * Add a new assistant response to history
   */
  addResponse(responseData: Partial<AssistantResponse> & { chatId: string }): AssistantResponse {
    const entry: AssistantResponse = {
      id: responseData.id || this.generateId("resp"),
      type: "assistant_response",
      role: "assistant",
      chatId: responseData.chatId,
      streamingState: responseData.streamingState || "streaming",
      components: responseData.components || [],
      timestamp: new Date().toISOString(),
    };

    this.history.push(entry);
    this.emit("add", entry);
    this.emit("change", this.history);

    return entry;
  }

  /**
   * Update an existing response (e.g., change streaming state)
   */
  updateResponse(id: string, updates: Partial<AssistantResponse>): AssistantResponse | null {
    const index = this.history.findIndex((entry) => entry.id === id);
    if (index === -1) {
      console.warn(`[HistoryManager] Response not found: ${id}`);
      return null;
    }

    this.history[index] = { ...this.history[index], ...updates } as AssistantResponse;
    this.emit("update", this.history[index]);
    this.emit("change", this.history);

    return this.history[index] as AssistantResponse;
  }

  /**
   * Add a component to an existing response
   */
  addComponentToResponse(
    responseId: string,
    componentData: Partial<ComponentEntry> & { type: string },
    loadedComponent: any = null
  ): AssistantResponse | null {
    const response = this.history.find((entry) => entry.id === responseId) as AssistantResponse;
    if (!response) {
      console.warn(`[HistoryManager] Response not found: ${responseId}`);
      return null;
    }

    const component: ComponentEntry = {
      id: componentData.id || this.generateId("comp"),
      componentType: componentData.type,
      componentUrl: componentData.componentUrl || "",
      nodeId: componentData.nodeId || "",
      chatId: componentData.chatId || "",
      props: componentData.props || {},
      metadata: componentData.metadata || {},
      Component: loadedComponent,
    };

    response.components.push(component);
    this.emit("update", response);
    this.emit("change", this.history);

    return response;
  }

  /**
   * Update an existing entry
   */
  updateEntry(id: string, updates: Partial<HistoryEntry>): HistoryEntry | null {
    const index = this.history.findIndex((entry) => entry.id === id);
    if (index === -1) {
      console.warn(`[HistoryManager] Entry not found: ${id}`);
      return null;
    }

    this.history[index] = { ...this.history[index], ...updates } as HistoryEntry;
    this.emit("update", this.history[index]);
    this.emit("change", this.history);

    return this.history[index];
  }

  /**
   * Get full history
   */
  getHistory(): HistoryEntry[] {
    return [...this.history];
  }

  /**
   * Get history filtered by type
   */
  getByType(type: "user_message" | "assistant_response"): HistoryEntry[] {
    return this.history.filter((entry) => entry.type === type);
  }

  /**
   * Get history filtered by role
   */
  getByRole(role: "user" | "assistant"): HistoryEntry[] {
    return this.history.filter((entry) => entry.role === role);
  }

  /**
   * Get only assistant responses
   */
  getResponses(): AssistantResponse[] {
    return this.history.filter((entry) => entry.type === "assistant_response") as AssistantResponse[];
  }

  /**
   * Get all components from all responses (flattened)
   */
  getAllComponents(): ComponentEntry[] {
    return this.history
      .filter((entry) => entry.type === "assistant_response")
      .flatMap((response) => (response as AssistantResponse).components);
  }

  /**
   * Get only user messages
   */
  getUserMessages(): UserMessage[] {
    return this.history.filter((entry) => entry.type === "user_message") as UserMessage[];
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
    this.emit("clear");
    this.emit("change", this.history);
  }

  /**
   * Subscribe to history changes
   */
  subscribe(listener: HistoryListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: HistoryEventType, data?: any): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event, data);
      } catch (err) {
        console.error("[HistoryManager] Listener error:", err);
      }
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string = "entry"): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export history as JSON
   */
  toJSON(): { metadata: HistoryMetadata; history: HistoryEntry[] } {
    return {
      metadata: this.metadata,
      history: this.history.map((entry) => ({
        ...entry,
        // Don't serialize Component functions
        ...(entry.type === "assistant_response"
          ? {
              components: (entry as AssistantResponse).components.map((c) => ({
                ...c,
                Component: c.Component ? "[Function]" : undefined,
              })),
            }
          : {}),
      })),
    };
  }

  /**
   * Get conversation stats
   */
  getStats(): {
    total: number;
    userMessages: number;
    responses: number;
    streamingResponses: number;
    totalComponents: number;
    conversationId: string | null;
    userId: string | null;
  } {
    const responses = this.getResponses();
    const streamingResponses = responses.filter((r) => r.streamingState === "streaming");

    return {
      total: this.history.length,
      userMessages: this.getUserMessages().length,
      responses: responses.length,
      streamingResponses: streamingResponses.length,
      totalComponents: this.getAllComponents().length,
      conversationId: this.metadata.conversationId,
      userId: this.metadata.userId,
    };
  }
}

/**
 * Create singleton instance (optional)
 */
export const historyManager = new HistoryManager();
