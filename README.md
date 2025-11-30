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
        apiKey: "your-api-key",
      }}
      session={{
        conversationId: "conv_123",
        userId: "user_456",
        workflowId: "wf-htmn4a",
        targetTriggerNode: "inputtrigger8",
      }}
      onReady={({ sendUserAction }) => {
        console.log("Connected to Gravity!");
      }}
    />
  );
}
```

## Features

- **WebSocket Connection** - Real-time bidirectional communication
- **Component Streaming** - Dynamic component loading and data streaming
- **History Management** - Conversation history with user messages and AI responses
- **State Management** - Zustand-based stores for component data and AI context
- **Template Support** - Dynamic template loading and switching

## API

### Components

#### `<GravityClient>`

Main client component that handles connection and rendering.

```tsx
<GravityClient
  config={GravityConfig}
  session={SessionParams}
  onReady?: (context) => void
  onStateChange?: (state) => void
  LoadingComponent?: React.ComponentType
>
  {/* Optional render prop for custom rendering */}
  {({ template, client, isConnected, isReady }) => (
    <YourCustomLayout />
  )}
</GravityClient>
```

#### `<UserProvider>`

Provides user context with automatic ID generation and persistence.

```tsx
<UserProvider>{children}</UserProvider>
```

### Hooks

#### `useUser()`

Access user context.

```tsx
const { userId, loading, updateUserId } = useUser();
```

#### `useGravityWebSocket(sessionParams, wsUrl)`

Low-level WebSocket hook.

```tsx
const { isConnected, isReady, events, sendUserAction } = useGravityWebSocket(
  sessionParams,
  "ws://localhost:4100/ws/gravity-ds"
);
```

#### `useHistoryManager(sessionParams, options)`

Manage conversation history.

```tsx
const { history, addUserMessage, activeTemplate } = useHistoryManager(sessionParams, {
  loadComponent,
  sendComponentReady,
  events,
});
```

#### `useComponentLoader(apiUrl)`

Dynamic component loading.

```tsx
const { loadComponent, componentCache } = useComponentLoader("http://localhost:4100");
```

#### `useGraphQL(apiUrl, apiKey, query, variables)`

Simple GraphQL client.

```tsx
const { data, loading, error, refetch } = useGraphQL("http://localhost:4100", "api-key", QUERY, { id: "123" });
```

### Stores

#### `useComponentData`

Zustand store for streaming component data.

```tsx
const { data, updateComponentData } = useComponentData();
```

#### `useAIContext`

Zustand store for AI/workflow state.

```tsx
const { workflowState, streamingState, setWorkflowState } = useAIContext();
```

### HOC

#### `withZustandData(Component)`

Wrap components to automatically receive streaming data.

```tsx
const StreamingComponent = withZustandData(MyComponent);
```

## Types

```typescript
interface GravityConfig {
  apiUrl: string;
  wsUrl: string;
  graphqlUrl?: string;
  apiKey?: string;
  debug?: boolean;
}

interface SessionParams {
  conversationId: string;
  userId: string;
  workflowId: string;
  targetTriggerNode: string;
  chatId?: string;
  initialQuery?: string;
  template?: string;
}
```

## License

MIT
