# Architecture Overview

## System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
│                        (app/page.tsx)                            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           SidebarInset (Main Content Area)               │   │
│  │                                                           │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │         ChatContainer Component                     │  │   │
│  │  │                                                     │  │   │
│  │  │  [Header: Model Selector | Clear Button]           │  │   │
│  │  │                                                     │  │   │
│  │  │  ┌─────────────────────────────────────────────┐  │  │   │
│  │  │  │     ChatMessages Component                   │  │  │   │
│  │  │  │                                               │  │  │   │
│  │  │  │  ┌─────────────────────────────────────┐    │  │  │   │
│  │  │  │  │    MessageItem (User/Assistant)     │    │  │  │   │
│  │  │  │  │                                       │    │  │  │   │
│  │  │  │  │  • Avatar                             │    │  │  │   │
│  │  │  │  │  • MessageContent                     │    │  │  │   │
│  │  │  │  │    - Text Parts                       │    │  │  │   │
│  │  │  │  │    - Tool Call Parts (with spinner)   │    │  │  │   │
│  │  │  │  │    - Tool Result Parts (with check)   │    │  │  │   │
│  │  │  │  └─────────────────────────────────────┘    │  │  │   │
│  │  │  │                                               │  │  │   │
│  │  │  └─────────────────────────────────────────────┘  │  │   │
│  │  │                                                     │  │   │
│  │  │  ┌─────────────────────────────────────────────┐  │  │   │
│  │  │  │     ChatInput Component                      │  │  │   │
│  │  │  │  [Textarea | Send Button]                    │  │  │   │
│  │  │  └─────────────────────────────────────────────┘  │  │   │
│  │  │                                                     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                           │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                         useChat Hook
                    (@ai-sdk/react v5)
                              ↕
                   DefaultChatTransport
                              ↕
                      HTTP POST Request
                   { messages, modelProvider }
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      Backend API Route                           │
│                   (app/api/chat/route.ts)                        │
│                                                                   │
│  1. Receive messages + model provider                            │
│  2. Select model (OpenAI or Google)                              │
│  3. Call streamText() with:                                      │
│     - model                                                       │
│     - messages (converted)                                        │
│     - tools (4 available)                                         │
│     - stopWhen: stepCountIs(5)                                    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Available Tools                          │ │
│  │                                                              │ │
│  │  • getWeather(city, unit)                                   │ │
│  │    → Returns weather data for city                          │ │
│  │                                                              │ │
│  │  • getCurrentTime(timezone)                                 │ │
│  │    → Returns formatted date/time                            │ │
│  │                                                              │ │
│  │  • calculate(expression)                                    │ │
│  │    → Evaluates math expression                              │ │
│  │                                                              │ │
│  │  • searchInfo(query, category)                              │ │
│  │    → Returns simulated search results                       │ │
│  │                                                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  4. Stream response back to client                               │
│     - Text parts                                                 │
│     - Tool call parts                                            │
│     - Tool result parts                                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                     AI Model Provider
                   ┌──────────┴──────────┐
              ┌────┴────┐          ┌─────┴─────┐
              │ OpenAI  │          │  Google   │
              │ GPT-4o  │          │  Gemini   │
              └─────────┘          └───────────┘
```

## Data Flow

### 1. User sends message
```typescript
User types "What's the weather in Tokyo?"
  ↓
ChatInput captures input
  ↓
sendMessage({ text: input })
  ↓
useChat hook packages message
  ↓
POST /api/chat with { messages: [...], modelProvider: "openai" }
```

### 2. Backend processes
```typescript
API Route receives request
  ↓
Select model based on modelProvider
  ↓
convertToModelMessages(messages)
  ↓
streamText({
  model,
  messages,
  tools: { getWeather, getCurrentTime, calculate, searchInfo },
  stopWhen: stepCountIs(5)
})
  ↓
Model analyzes and decides to call getWeather tool
  ↓
Tool executes: getWeather({ city: "Tokyo", unit: "C" })
  ↓
Returns result: "The weather in Tokyo is 22°C..."
  ↓
Stream parts back to client:
  - tool-getWeather (call)
  - tool-getWeather (result)
  - text (final response)
```

### 3. Frontend renders
```typescript
useChat receives stream
  ↓
Updates messages array
  ↓
ChatMessages renders each message
  ↓
MessageItem wraps with avatar
  ↓
MessageContent renders parts:
  - Tool call part → Shows spinner + args
  - Tool result part → Shows check + output
  - Text part → Shows formatted text
```

## Component Responsibilities

### ChatContainer
- Main orchestrator
- Manages model selection
- Handles useChat hook
- Provides clear chat functionality
- Shows error states

### ChatMessages  
- Renders message list
- Handles auto-scroll
- Shows empty state

### MessageItem
- Wraps individual messages
- Shows avatar (User/Bot)
- Applies role-based styling

### MessageContent
- Renders message parts
- Text parts → Prose styling
- Tool calls → Loading indicator
- Tool results → Success indicator

### ChatInput
- Text input field
- Send button
- Keyboard shortcuts
- Disabled during processing

## State Management

```typescript
// Client State (useChat hook manages)
{
  messages: ChatMessage[],      // Full conversation history
  status: ChatStatus,            // Current request status
  error: Error | undefined,      // Any errors
  sendMessage: Function          // Send new message
}

// Local State (ChatContainer)
{
  input: string,                 // Current input text
  modelProvider: "openai" | "google",  // Selected model
  isProcessing: boolean          // Loading state
}
```

## Type Safety

All components are fully typed:

```typescript
// Message types from API
export type ChatTools = InferUITools<typeof tools>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

// Component props
interface ChatContainerProps {
  className?: string;
}

interface MessageContentProps {
  message: ChatMessage;
}
// ... etc
```

## Environment Configuration

```env
OPENAI_API_KEY=...              # Required for OpenAI
GOOGLE_GENERATIVE_AI_API_KEY=...  # Required for Gemini
DEFAULT_MODEL_PROVIDER=openai   # Default selection
```

## Build & Deploy

✅ Build passes: `bun run build`
✅ Lint passes: `bun run lint`
✅ Type-safe: Full TypeScript
✅ Production-ready: Optimized build

