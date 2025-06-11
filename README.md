# Gravity Client

Clean, organized client library for Gravity AI with real-time streaming and 3-tier JSON architecture.

## Features

- 🚀 **Real-time streaming** with GraphQL SSE subscriptions
- 🏗️ **3-tier JSON architecture** for flexible data handling
- 🎯 **Self-contained Zustand slices** with no cross-dependencies
- 📦 **TypeScript throughout** with comprehensive type safety
- ⚛️ **React integration** with hooks and components
- 🔄 **Apollo Client** with split link architecture

## Installation

```bash
npm install @gravityai-dev/gravity-client
```

## Quick Start

```tsx
import React from 'react';
import { GravityProvider, GravityContainer } from '@gravityai-dev/gravity-client';

const config = {
  apiUrl: 'http://localhost:4000/graphql',
  apiKey: 'your-api-key',
};

function App() {
  return (
    <GravityProvider config={config}>
      <GravityContainer>
        {(gravity) => (
          <div>
            <h1>Chat State: {gravity.chatState}</h1>
            <div>Messages: {gravity.messages.length}</div>
            <button 
              onClick={() => gravity.sendMessage({ text: "Hello!" })}
              disabled={!gravity.isConnected}
            >
              Send Message
            </button>
          </div>
        )}
      </GravityContainer>
    </GravityProvider>
  );
}
```

## Architecture

### 3-Tier JSON Messaging

The library implements a sophisticated 3-tier architecture for handling different types of data:

- **Tier 1: Raw JSON Data** - Raw server data stored in `jsonData[]`
- **Tier 2: Structured Semantic Messages** - Parsed messages like `MessageChunk`, `ProgressUpdate`, `ActionSuggestion`
- **Tier 3: Direct UI Render JSON** - Bypasses state entirely for immediate UI rendering

### Store Slices

#### Connection Slice
- Apollo Client with split link (HTTP + SSE)
- Connection state management
- Subscription lifecycle

#### Conversation Slice  
- Message history
- Send message functionality
- Conversation management

#### Response Slice
- Real-time streaming response handling
- 3-tier message processing
- Progress tracking

#### UI Slice
- Component configuration
- UI state management

## API Reference

### Hooks

#### `useGravity()`
Main hook providing access to all Gravity functionality.

```tsx
const {
  // Connection state
  isConnected,
  isConnecting,
  connectionError,
  
  // Conversation state
  messages,
  conversationId,
  
  // Active response state
  activeResponse,
  chatState,
  
  // Actions
  sendMessage,
  connect,
  disconnect,
} = useGravity();
```

#### `useActiveResponse()`
Specialized hook for streaming response management.

```tsx
const {
  // Streaming data
  fullMessage,
  currentChunk,
  messageChunks,
  
  // Structured data
  progressUpdate,
  actionSuggestion,
  
  // State helpers
  isThinking,
  isResponding,
  isComplete,
  
  // Actions
  startActiveResponse,
  processMessage,
  completeActiveResponse,
} = useActiveResponse();
```

#### `useConnection()`
Connection-specific hook.

```tsx
const {
  client,
  isConnected,
  error,
  connect,
  disconnect,
} = useConnection();
```

### Components

#### `<GravityProvider>`
Context provider that manages the Apollo Client and connection lifecycle.

```tsx
<GravityProvider config={config} theme={theme}>
  {children}
</GravityProvider>
```

#### `<GravityContainer>`
Render prop component providing flexible access to Gravity state.

```tsx
<GravityContainer>
  {(gravity) => (
    // Your UI here
  )}
</GravityContainer>
```

## Configuration

```tsx
interface GravityConfig {
  connection: {
    apiUrl: string;
    apiKey: string;
    headers?: Record<string, string>;
  };
}
```

## Real-time Streaming

The library handles real-time AI responses through GraphQL subscriptions:

```tsx
// Messages stream in real-time
const { fullMessage, currentChunk } = useActiveResponse();

// Progress updates
const { progressUpdate } = useActiveResponse();
if (progressUpdate) {
  console.log(`Progress: ${progressUpdate.progress}%`);
}

// Action suggestions
const { actionSuggestion } = useActiveResponse();
if (actionSuggestion) {
  // Render action buttons
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Generate GraphQL types
npm run codegen
```

## License

MIT

## Support

For issues and questions, please visit our [GitHub repository](https://github.com/gravityai-dev/gravity-client).
