# Gravity Client

Clean, organized client library for Gravity AI with real-time streaming and intelligent component architecture.

## Features

- **Smart Components** - Drop-in components that automatically connect to Gravity state
- **Granular State Control** - Precise control over what state each component receives
- **Real-time Streaming** - Built-in support for AI message streaming with SSE
- **3-Tier JSON Architecture** - Flexible message handling (Raw JSON, Semantic Messages, Direct UI)
- **Zero Configuration** - Components work anywhere without setup
- **Render Prop Pattern** - Flexible UI rendering with GravityContainer
- **TypeScript First** - Full type safety throughout
- **Zustand State** - Flattened, intuitive state management

## Quick Start

### Installation

```bash
npm install @gravityai-dev/gravity-client
```

### Basic Setup

```jsx
import { GravityProvider } from 'gravity-client';

function App() {
  return (
    <GravityProvider
      config={{
        endpoint: 'http://localhost:4100/graphql',
        apiKey: 'your-api-key'
      }}
    >
      <YourApp />
    </GravityProvider>
  );
}
```

## Smart Components

The revolutionary feature of Gravity Client is **Smart Components** - components that automatically connect to Gravity state and can be dropped anywhere in your app.

### Creating Smart Components

Use the `withGravity` HOC to create intelligent components:

```jsx
import { withGravity } from 'gravity-client';
import { ProgressUpdateUI } from './ui/ProgressUpdateUI';

// Smart component with granular state control
const ProgressUpdate = withGravity(ProgressUpdateUI, {
  select: (gravity) => ({
    isLoading: gravity.isLoading,
    connectionStatus: gravity.connectionStatus,
    progress: gravity.activeResponse?.progress
  })
});

// Now use anywhere in your app:
<ProgressUpdate message="Processing..." progress={75} />
```

### Smart Component Examples

```jsx
// Message streaming component
const MessageChunk = withGravity(MessageChunkUI, {
  select: (gravity) => ({
    isStreaming: gravity.activeResponse?.isStreaming,
    currentText: gravity.activeResponse?.streamingText
  })
});

// Action suggestions with conversation context
const ActionSuggestion = withGravity(ActionSuggestionUI, {
  select: (gravity) => ({
    sendMessage: gravity.sendMessage,
    conversationId: gravity.conversationId,
    isLoading: gravity.isLoading
  })
});

// Pure UI component (no state needed)
const SimpleButton = withGravity(ButtonUI);
```

### Drop Anywhere Magic 

Smart components work anywhere without configuration:

```jsx
// In chat interface
<div className="chat">
  <MessageChunk text="Here's what I found..." />
  <ProgressUpdate message="Thinking..." progress={25} />
  <ActionSuggestion title="Try this" actions={[...]} />
</div>

// In sidebar
<div className="sidebar">
  <ProgressUpdate message="Syncing..." progress={80} />
  <ActionSuggestion title="Quick action" />
</div>

// In modals, anywhere!
<Modal>
  <ProgressUpdate message="Processing request..." />
</Modal>
```

## State Management

### Hooks

```jsx
import { useGravity, useActiveResponse, useConnection } from 'gravity-client';

function MyComponent() {
  const {
    // Connection state
    connectionStatus,
    isConnected,
    
    // Conversation state
    conversationId,
    messages,
    isLoading,
    
    // UI state
    sidebarOpen,
    activeObjectId,
    
    // Actions
    sendMessage,
    toggleSidebar,
    setActiveObject
  } = useGravity();

  const {
    // Active response state
    isStreaming,
    streamingText,
    currentChunk,
    progress,
    state,
    
    // Response messages
    messages: responseMessages
  } = useActiveResponse();
}
```

### Direct Store Access

```jsx
import { useGravityStore } from 'gravity-client';

const store = useGravityStore();
store.sendMessage('Hello AI!');
store.toggleSidebar(true);
```

## Real-time Streaming

Gravity Client handles real-time AI streaming automatically:

```jsx
function StreamingChat() {
  const { sendMessage } = useGravity();
  const { isStreaming, streamingText } = useActiveResponse();

  return (
    <div>
      <div className="messages">
        {isStreaming && <div>{streamingText}</div>}
      </div>
      <button onClick={() => sendMessage('Hello!')}>
        Send Message
      </button>
    </div>
  );
}
```

## GraphQL Integration

Built-in GraphQL operations and subscriptions:

```jsx
import { 
  TALK_TO_AGENT, 
  AI_RESULT_SUBSCRIPTION,
  GET_CHAT_STATUS 
} from 'gravity-client';

// Operations are automatically handled by the library
// Just use the hooks and smart components!
```

## Architecture

### 3-Tier JSON Messaging

1. **Tier 1: Raw JSON** - Direct server data (`jsonData[]`)
2. **Tier 2: Semantic Messages** - Structured types (`MessageChunk`, `ProgressUpdate`, `ActionSuggestion`)
3. **Tier 3: Direct UI Render** - Component specs that bypass store for immediate rendering

### State Structure

```typescript
interface GravityStore {
  // Connection
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  isConnected: boolean;
  
  // Conversation
  conversationId: string | null;
  messages: GravityMessage[];
  isLoading: boolean;
  
  // Active Response
  isStreaming: boolean;
  streamingText: string;
  currentChunk: MessageChunk | null;
  progress?: number;
  state?: any;
  
  // UI
  sidebarOpen: boolean;
  activeObjectId?: string;
  componentConfig: Record<string, React.ComponentType<any>>;
  
  // Actions
  sendMessage: (message: string) => Promise<void>;
  toggleSidebar: (forceState?: boolean) => void;
  setActiveObject: (objectId?: string) => void;
}
```

## Advanced Usage

### Custom Component Maps

```jsx
import { componentMap } from './theme/componentMap';

const customComponents = {
  ProgressUpdate: MyCustomProgressUpdate,
  MessageChunk: MyCustomMessageChunk,
  ActionSuggestion: MyCustomActionSuggestion,
  ...componentMap
};

<GravityProvider config={config} components={customComponents}>
  <App />
</GravityProvider>
```

### Environment Configuration

```bash
# .env
VITE_GRAPHQL_HTTP_URL=http://localhost:4100/graphql
VITE_AGENT_API_KEY=your-api-key
```

## API Reference

### Components

- `GravityProvider` - Root provider component
- `withGravity(Component, options)` - HOC for creating smart components

### Hooks

- `useGravity()` - Main hook for gravity state and actions
- `useActiveResponse()` - Hook for active AI response state
- `useConnection()` - Hook for connection-specific state
- `useGravityStore()` - Direct store access

### Utilities

- `toggleSidebar(forceState?)` - Toggle sidebar state
- `setActiveObject(objectId?)` - Set active object ID

## Development

```bash
# Install dependencies
npm install

# Build library
npm run build

# Generate GraphQL types
npm run codegen

# Development mode
npm run dev
```

## License

MIT

## Support

For support and questions, please refer to the main Gravity AI documentation.
