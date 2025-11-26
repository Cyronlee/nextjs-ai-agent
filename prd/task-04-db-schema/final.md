# Task 04: Database Schema Implementation (Optimized)

## Overview

Successfully implemented and optimized a comprehensive database schema for the AI agent using Prisma ORM and SQLite.

## Entity-Relationship Diagram

```
┌─────────────────┐
│ ModelProvider   │
│─────────────────│
│ id              │
│ name            │
│ displayName     │
│ apiKey          │
│ models (JSON)   │◄───┐
│ timestamps      │    │
└─────────────────┘    │
                       │ N:1
┌─────────────────┐    │
│ MCPServerGroup  │    │
│─────────────────│    │
│ id              │    │
│ name            │    │
│ description     │    │
│ config (JSON)   │    │
│ timestamps      │    │
└─────────────────┘    │
        │              │
        │ 1:N          │
        ▼              │
┌─────────────────┐    │
│ Agent           │    │
│─────────────────│    │
│ id              │    │
│ name            │    │
│ description     │    │
│ systemPrompt    │    │
│ config (JSON)   │    │
│ timestamps      │    │
└─────────────────┘    │
        │              │
        │ 1:N          │
        ▼              │
┌─────────────────┐    │
│ Conversation    │    │
│─────────────────│    │
│ id              │    │
│ title           │    │
│ timestamps      │    │
└─────────────────┘    │
        │              │
        │ 1:N          │
        ▼              │
┌─────────────────┐    │
│ Message         ├────┘
│─────────────────│
│ id              │
│ model           │
│ role            │
│ parts (JSON)    │
│ createdAt       │
└─────────────────┘
        △
        │
┌───────┴─────────┐
│                 │
│  1:N            │ 1:N
│                 │
┌─────────────────┐
│ File            │
│─────────────────│
│ id              │
│ filename        │
│ originalName    │
│ mimeType        │
│ size            │
│ path            │
│ createdAt       │
└─────────────────┘
```

## Schema Design

### Key Optimizations

#### 1. **Removed Unnecessary Fields**

- ❌ Removed all `isActive` fields - use soft delete or hard delete instead
- ❌ Removed all `metadata` fields - specific fields are more maintainable

#### 2. **ModelProvider Optimization**

- ✅ `apiKey` field directly instead of in config
- ✅ `models` JSON array: `[{ id, name, isDefault }]`
- ✅ Maintains model order and default selection
- ✅ Easy to add/remove models dynamically

#### 3. **Agent Decoupling**

- ✅ No `modelProvider` relation on Agent
- ✅ Agent focuses on system prompt and MCP configuration
- ✅ Allows different models per message in same conversation

#### 4. **Message Model Tracking**

- ✅ Each `Message` tracks its `modelProvider` and `model`
- ✅ Historical record of which model was used
- ✅ All content in `parts` array (no separate fields)
- ✅ Supports: text, images, files, tool calls, tool results

#### 5. **File-Conversation Relationship**

- ✅ `File` belongs to `Conversation` (not Message)
- ✅ Files accessible across entire conversation
- ✅ Simpler relationship model

### Entities

#### 1. **ModelProvider**

```typescript
{
  id: string;
  name: string; // "openai", "google"
  displayName: string; // "OpenAI", "Google Gemini"
  apiKey: string | null; // API key
  models: string; // JSON: [{ id, name, isDefault }]
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

#### 2. **MCPServerGroup**

```typescript
{
  id: string;
  name: string;
  description: string | null;
  config: string; // JSON: { serverName: { command, args, description } }
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

#### 3. **Agent**

```typescript
{
  id: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  mcpServerGroupId: string | null;
  config: string | null; // JSON: { temperature, maxTokens, topP, ... }
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

#### 4. **Conversation**

```typescript
{
  id: string;
  agentId: string;
  title: string | null;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

#### 5. **Message**

```typescript
{
  id: string;
  conversationId: string;
  modelProviderId: string;
  model: string; // e.g., "gpt-4o-mini"
  role: string; // "user", "assistant", "system"
  parts: string; // JSON: [{ type, ...partData }]
  createdAt: DateTime;
}
```

#### 6. **File**

```typescript
{
  id: string;
  conversationId: string;
  filename: string; // Storage filename
  originalName: string; // User's filename
  mimeType: string;
  size: number; // bytes
  path: string; // Storage path
  createdAt: DateTime;
}
```

## JSON Field Formats

### ModelProvider.models

```json
[
  { "id": "gpt-4o", "name": "GPT-4o", "isDefault": false },
  { "id": "gpt-4o-mini", "name": "GPT-4o Mini", "isDefault": true },
  { "id": "gpt-4-turbo", "name": "GPT-4 Turbo", "isDefault": false }
]
```

### Message.parts

```json
[
  { "type": "text", "text": "Hello!" },
  { "type": "image", "url": "data:image/png;base64,..." },
  { "type": "file", "filename": "doc.pdf", "url": "..." },
  {
    "type": "tool-call",
    "toolCallId": "1",
    "toolName": "getWeather",
    "args": { "city": "SF" }
  },
  { "type": "tool-result", "toolCallId": "1", "result": "Sunny, 72°F" }
]
```

## Technical Implementation

### Technology Stack

- **Prisma ORM**: Version 5.22.0
- **Database**: SQLite
- **Runtime**: Bun
- **Environment**: Next.js (built-in env support, no dotenv needed)

### File Structure

```
prisma/
  ├── schema.prisma       # Optimized schema
  ├── seed.ts             # Seed with sample data
  ├── README.md           # Documentation
  └── database.sqlite             # SQLite database (gitignored)

lib/
  └── db.ts              # Prisma client singleton
```

### Database Scripts

- `db:generate` - Generate Prisma client
- `db:push` - Push schema to database
- `db:migrate` - Create migrations
- `db:seed` - Seed with initial data
- `db:studio` - Open Prisma Studio
- `db:reset` - Reset database

## Seed Data

Pre-populated with:

- **2 Model Providers**
  - OpenAI: 3 models (gpt-4o, gpt-4o-mini\*, gpt-4-turbo)
  - Google Gemini: 3 models (gemini-2.0-flash-exp\*, gemini-1.5-pro, gemini-1.5-flash)
  - \*marked as default
- **2 MCP Server Groups**
  - default: filesystem access
  - git-tools: git operations
- **1 Default Agent** with system prompt and config
- **1 Sample Conversation** with 3 messages

## Usage Examples

### Get Model Provider with Default Model

```typescript
import { db } from "@/lib/db";

const provider = await db.modelProvider.findUnique({
  where: { name: "openai" },
});

const models = JSON.parse(provider.models);
const defaultModel = models.find((m) => m.isDefault);
console.log(`Default: ${defaultModel.name}`);
```

### Create Message with Model Tracking

```typescript
const message = await db.message.create({
  data: {
    conversationId: conv.id,
    modelProviderId: provider.id,
    model: "gpt-4o-mini",
    role: "user",
    parts: JSON.stringify([{ type: "text", text: "Hello!" }]),
  },
  include: {
    modelProvider: true,
  },
});
```

### Handle Multi-Modal Message

```typescript
const parts = JSON.parse(message.parts);

for (const part of parts) {
  switch (part.type) {
    case "text":
      console.log("Text:", part.text);
      break;
    case "image":
      console.log("Image:", part.url);
      break;
    case "tool-call":
      console.log("Tool:", part.toolName, part.args);
      break;
    case "tool-result":
      console.log("Result:", part.result);
      break;
  }
}
```

### Link File to Conversation

```typescript
const file = await db.file.create({
  data: {
    conversationId: conv.id,
    filename: "uuid.pdf",
    originalName: "document.pdf",
    mimeType: "application/pdf",
    size: 12345,
    path: "/uploads/uuid.pdf",
  },
});
```

## Benefits of Optimizations

1. **Cleaner Schema**: No unused fields
2. **Better Model Tracking**: Each message knows its model
3. **More Flexible**: Can switch models mid-conversation
4. **Simpler Relationships**: File → Conversation is cleaner
5. **No External Dependencies**: Removed dotenv
6. **Type-Safe JSON**: Explicit parsing in code
7. **Maintainable**: Specific fields over generic metadata

## Next Steps

To integrate with the existing chat system:

1. Update chat routes to save messages with model tracking
2. Parse and render multi-modal content from parts array
3. Store files linked to conversations
4. Track tool calls and results in parts array
5. Build agent configuration UI
6. Implement conversation history with model switching
