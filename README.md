# @gravityai-dev/gravity-client

React SDK for Gravity AI - Real-time AI workflow streaming with WebSocket.

## Installation

```bash
npm install @gravityai-dev/gravity-client
```

## Quick Start

```tsx
import { GravityClient, UserProvider } from "@gravityai-dev/gravity-client";

function App() {
  return (
    <UserProvider>
      <ChatPage />
    </UserProvider>
  );
}

function ChatPage() {
  return (
    <GravityClient
      config={{
        apiUrl: "http://localhost:4100",
        wsUrl: "ws://localhost:4100/ws/gravity-ds",
      }}
      session={{
        conversationId: "conv_123",
        userId: "user_456",
        workflowId: "wf-abc123",
        targetTriggerNode: "inputtrigger1",
      }}
      onReady={({ sendMessage }) => {
        console.log("Connected to Gravity!");
      }}
    />
  );
}
```

---

## Core Concepts

### Session Initialization

When `GravityClient` mounts, it:

1. Connects to WebSocket
2. Sends `INIT_SESSION` with `workflowId` and `targetTriggerNode`
3. Server loads the template configured on that InputTrigger node
4. Template renders in the client

**No message is sent** - just the template loads.

### Sending Messages

Templates use `client.sendMessage()` to send user messages to the workflow.

### Template Switching

When you send a message with a **different** `targetTriggerNode`, the server:

1. Checks if the new trigger has a different template
2. If different, sends `COMPONENT_INIT` to switch templates
3. Executes the workflow from that trigger

---

## Client API

Templates receive a `client` object with these methods:

### `client.sendMessage(message, options?)`

Send a message to the workflow.

```typescript
// Basic message (uses session's default targetTriggerNode)
client.sendMessage("Hello, I need help");

// Message to a specific trigger (may switch template)
client.sendMessage("I want to speak to a person", {
  targetTriggerNode: "inputtrigger2",
});
```

| Parameter                   | Type      | Description                                               |
| --------------------------- | --------- | --------------------------------------------------------- |
| `message`                   | `string`  | The user's message                                        |
| `options.targetTriggerNode` | `string?` | InputTrigger to route to (switches template if different) |

**What happens:**

1. Adds user message to history
2. Sends to server via GraphQL
3. Server checks if template needs to switch
4. Server executes workflow from the trigger
5. Server streams components back via WebSocket

### `client.sendAgentMessage(data)`

Send an agent message through the server pipeline. Used for live agent integrations (Amazon Connect, etc.).

```typescript
client.sendAgentMessage({
  content: "Hello, I'm your live agent",
  chatId: "chat_123",
  agentName: "Support Agent",
  source: "amazon_connect",
  props: { interactiveData: { type: "ListPicker", elements: [...] } },
  metadata: { participantRole: "AGENT" },
});
```

| Parameter   | Type                   | Description                                        |
| ----------- | ---------------------- | -------------------------------------------------- |
| `content`   | `string`               | Message content                                    |
| `chatId`    | `string`               | Chat ID for conversation continuity                |
| `agentName` | `string?`              | Agent display name                                 |
| `source`    | `string?`              | Source identifier (e.g., "amazon_connect")         |
| `props`     | `Record<string, any>?` | Additional component props (e.g., interactiveData) |
| `metadata`  | `Record<string, any>?` | Additional metadata                                |

**What happens:**

1. Sends `AGENT_MESSAGE` to server via WebSocket
2. Server creates `WORKFLOW_STARTED` → `COMPONENT_INIT` → `WORKFLOW_COMPLETED` events
3. Client receives events, loads component, adds to history
4. Template renders agent message like any AI response

### `client.loadTemplate(targetTriggerNode, options?)`

Switch to a different template without sending a message.

```typescript
// Just switch template, no workflow execution
client.loadTemplate("inputtrigger1");

// Switch template and add to existing response (same chatId)
client.loadTemplate("inputtrigger1", { chatId: "chat_123" });
```

| Parameter           | Type      | Description                                      |
| ------------------- | --------- | ------------------------------------------------ |
| `targetTriggerNode` | `string`  | InputTrigger whose template to load              |
| `options.chatId`    | `string?` | Optional chatId to add template to same response |

**What happens:**

1. Sends `LOAD_TEMPLATE` via WebSocket
2. Server looks up template from the trigger (cached, fast)
3. If different from current, sends `COMPONENT_INIT`
4. Client loads and renders new template
5. **No workflow execution, no LLM call**

If `chatId` is provided, the template is associated with that response, allowing you to continue adding components to the same conversation turn.

### `client.emitAction(type, data)`

Emit a custom action event for cross-boundary communication.

```typescript
// Emit from template (inside Shadow DOM)
client.emitAction("end_live_chat", { reason: "user_ended" });
```

The host app can listen via `onAction` prop on `GravityClient`.

### `client.history`

Access conversation history (read-only).

```typescript
// Read all entries
client.history.entries;

// Get only AI responses
client.history.getResponses();
```

> **Note:** Templates should NOT modify history directly. Use `client.sendAgentMessage()` for agent messages - this routes through the server pipeline ensuring consistent component loading.

### `client.sendVoiceCallMessage(data)`

Send a voice call control message (START_CALL or END_CALL) for voice streaming.

```typescript
// Start a voice call
await client.sendVoiceCallMessage({
  message: "Start call",
  userId: "user_123",
  chatId: "voice_session_123",
  conversationId: "conv_123",
  workflowId: "wf-voice",
  targetTriggerNode: "inputtrigger_voice",
  action: "START_CALL",
});

// End a voice call
await client.sendVoiceCallMessage({
  message: "END_CALL",
  userId: "user_123",
  chatId: "voice_session_123",
  conversationId: "conv_123",
  workflowId: "wf-voice",
  targetTriggerNode: "inputtrigger_voice",
  action: "END_CALL",
});
```

| Parameter           | Type                         | Description                      |
| ------------------- | ---------------------------- | -------------------------------- |
| `message`           | `string`                     | Message content                  |
| `userId`            | `string`                     | User ID                          |
| `chatId`            | `string`                     | Chat ID for this voice session   |
| `conversationId`    | `string`                     | Conversation ID                  |
| `workflowId`        | `string`                     | Workflow ID for voice processing |
| `targetTriggerNode` | `string`                     | InputTrigger for voice workflow  |
| `action`            | `"START_CALL" \| "END_CALL"` | Voice call action type           |

**What happens:**

1. Sends GraphQL mutation with `isAudio: true` flag
2. Server routes to voice workflow (e.g., AWS Nova Speech)
3. Audio WebSocket connection handles bidirectional streaming
4. Voice responses stream back via `/ws/audio/{sessionId}`

### `client.session`

Access session parameters.

```typescript
client.session.conversationId;
client.session.userId;
client.session.workflowId;
client.session.targetTriggerNode;
```

### `client.audio`

Audio utilities for voice calls. Provides microphone capture, audio playback, and WebSocket transport.

```typescript
interface AudioContext {
  capture: {
    startCapture: () => Promise<{ success: boolean; reason?: string }>;
    stopCapture: () => Promise<{ success: boolean; reason?: string }>;
    isCapturing: boolean;
    isLoading: boolean;
    error: string | null;
  };
  playback: {
    playAudio: (audioData: ArrayBuffer) => void;
    stopAll: () => void;
    isPlaying: boolean;
  };
  websocket: {
    connect: () => Promise<void>;
    disconnect: () => void;
    sendAudio: (audioData: ArrayBuffer) => void;
    sendControl: (type: string, data?: Record<string, any>) => void;
    isConnected: boolean;
  };
}
```

**Usage in voice templates:**

```typescript
// Start a voice call
const startCall = async () => {
  // 1. Connect WebSocket first
  await client.audio.websocket.connect();

  // 2. Send START_CALL via GraphQL
  await client.sendVoiceCallMessage({ action: "START_CALL", ... });

  // 3. Start microphone capture
  await client.audio.capture.startCapture();
};

// End a voice call
const endCall = async () => {
  await client.audio.capture.stopCapture();
  client.audio.playback.stopAll();
  client.audio.websocket.disconnect();
  await client.sendVoiceCallMessage({ action: "END_CALL", ... });
};
```

**Key points:**

- Audio utilities are instantiated by `TemplateRenderer` and passed to templates
- Templates should NOT implement audio logic - use `client.audio.*`
- WebSocket connects to `/ws/audio/{conversationId}` for bidirectional audio streaming
- Microphone capture uses VAD (Voice Activity Detection) for speech detection

---

## GravityClient Props

```tsx
<GravityClient
  config={GravityConfig}
  session={SessionParams}
  onReady?: ({ sendMessage, sessionParams }) => void
  onAction?: (type: string, data: any) => void
  onStateChange?: (state) => void
  templateProps?: Record<string, any>
  LoadingComponent?: React.ComponentType
/>
```

### `config`

```typescript
interface GravityConfig {
  apiUrl: string; // Server URL (e.g., "http://localhost:4100")
  wsUrl: string; // WebSocket URL (e.g., "ws://localhost:4100/ws/gravity-ds")
  getAccessToken?: () => Promise<string>; // Auth token provider
}
```

### `session`

```typescript
interface SessionParams {
  conversationId: string; // Unique conversation ID
  userId: string; // User ID
  workflowId: string; // Workflow to execute
  targetTriggerNode: string; // Default InputTrigger (loads its template)
}
```

### `onReady`

Called when connection is established and ready.

```typescript
onReady={({ sendMessage, sessionParams }) => {
  // Store sendMessage for use outside templates
  sendMessageRef.current = sendMessage;
}}
```

### `onAction`

Called when templates emit actions via `client.emitAction()`.

```typescript
onAction={(type, data) => {
  if (type === "end_live_chat") {
    // Handle end of live chat
    sendMessage("Return to main chat", { targetTriggerNode: "inputtrigger1" });
  }
}}
```

### `templateProps`

Props passed to all templates.

```typescript
templateProps={{
  amazonConnectConfig: { ... },
  theme: "dark",
}}
```

---

## Template Development

Templates receive a `client` prop with the full API:

```tsx
interface GravityTemplateProps {
  client: {
    sendMessage: (message: string, options?: { targetTriggerNode?: string }) => void;
    sendAgentMessage: (data: {
      content: string;
      chatId: string;
      agentName?: string;
      source?: string;
      props?: Record<string, any>;
      metadata?: Record<string, any>;
    }) => void;
    sendVoiceCallMessage: (data: {
      message: string;
      userId: string;
      chatId: string;
      conversationId: string;
      workflowId: string;
      targetTriggerNode: string;
      action: "START_CALL" | "END_CALL";
    }) => Promise<void>;
    emitAction: (type: string, data: any) => void;
    history: {
      entries: HistoryEntry[];
      getResponses: () => AssistantResponse[];
    };
    session: SessionParams;
  };
}

function MyTemplate({ client }: GravityTemplateProps) {
  const handleSend = (message: string) => {
    client.sendMessage(message);
  };

  const handleSwitchToLiveChat = () => {
    client.sendMessage("Connect me to an agent", {
      targetTriggerNode: "inputtrigger2", // Switches to live chat template
    });
  };

  // For live agent integrations (Amazon Connect, etc.)
  const handleAgentMessage = (response: AssistantResponse) => {
    const props = response.components?.[0]?.props || {};
    const { content, ...otherProps } = props;
    client.sendAgentMessage({
      content: content || "",
      chatId: response.chatId || `agent_${Date.now()}`,
      agentName: response.components?.[0]?.metadata?.agentName || "Agent",
      source: "amazon_connect",
      props: otherProps,
      metadata: response.components?.[0]?.metadata,
    });
  };

  const handleEndChat = () => {
    // Emit action to host app
    client.emitAction("end_live_chat", {});
  };

  return (
    <div>
      <ChatHistory entries={client.history.entries} />
      <ChatInput onSend={handleSend} />
    </div>
  );
}
```

---

## Message Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. GravityClient mounts                                        │
│     ↓                                                           │
│  2. WebSocket connects                                          │
│     ↓                                                           │
│  3. Sends INIT_SESSION { workflowId, targetTriggerNode }        │
│     ↓                                                           │
│  4. Server sends COMPONENT_INIT with template                   │
│     ↓                                                           │
│  5. Template loads and renders                                  │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  6. User types message                                          │
│     ↓                                                           │
│  7. Template calls client.sendMessage("hello")                  │
│     ↓                                                           │
│  8. GraphQL mutation to server                                  │
│     ↓                                                           │
│  9. Server executes workflow                                    │
│     ↓                                                           │
│  10. Server streams components via WebSocket                    │
│     ↓                                                           │
│  11. Components render in template                              │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  12. User clicks "Speak to Live Person"                         │
│     ↓                                                           │
│  13. Template calls client.sendMessage("...", {                 │
│        targetTriggerNode: "inputtrigger2"                       │
│      })                                                         │
│     ↓                                                           │
│  14. Server detects different template on inputtrigger2         │
│     ↓                                                           │
│  15. Server sends COMPONENT_INIT for new template               │
│     ↓                                                           │
│  16. New template loads and renders                             │
│     ↓                                                           │
│  17. Server executes workflow from inputtrigger2                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Low-Level Hooks

For advanced use cases, these hooks are available:

### `useUser()`

```tsx
const { userId, loading, updateUserId } = useUser();
```

### `useGravityWebSocket(sessionParams, wsUrl)`

```tsx
const { isConnected, isReady, events, sendUserAction } = useGravityWebSocket(
  sessionParams,
  "ws://localhost:4100/ws/gravity-ds"
);
```

### `useHistoryManager(sessionParams, options)`

```tsx
const { history, activeTemplate } = useHistoryManager(sessionParams, {
  loadComponent,
  sendComponentReady,
  events,
});
```

### `useComponentLoader(apiUrl)`

```tsx
const { loadComponent, componentCache } = useComponentLoader("http://localhost:4100");
```

---

## License

MIT
