# Database Schema (Optimized)

This directory contains the optimized Prisma schema and related files for the AI Agent application.

## Quick Start

```bash
# Generate Prisma Client
bun run db:generate

# Push schema to database (development)
bun run db:push

# Create a migration (production)
bun run db:migrate

# Seed the database with initial data
bun run db:seed

# Open Prisma Studio to view/edit data
bun run db:studio

# Reset database (warning: deletes all data)
bun run db:reset
```

## Schema Overview

### Core Entities

- **ModelProvider**: AI model providers with model lists and API keys
- **MCPServerGroup**: Groups of MCP server configurations
- **Agent**: AI agent configurations with system prompts and settings
- **Conversation**: Chat conversation sessions
- **Message**: Individual messages with model provider tracking
- **File**: File metadata linked to conversations

### Relationships

```
ModelProvider 1--* Message (tracks which model was used per message)
MCPServerGroup 1--* Agent
Agent 1--* Conversation
Conversation 1--* Message
Conversation 1--* File (files belong to conversations, not messages)
```

## Key Optimizations

### 1. Removed Fields

- ❌ All `isActive` fields (not needed - delete records instead)
- ❌ All `metadata` fields (specific fields are better than generic JSON)

### 2. ModelProvider Improvements

- ✅ `models` field: JSON array with model info `[{ id, name, isDefault }]`
- ✅ `apiKey` field: Direct storage instead of in config
- ✅ Maintains model order and default selection

### 3. Message Model Changes

- ✅ Messages now reference `modelProvider` (not Agent)
- ✅ Each message stores which `model` was used
- ✅ All content in `parts` array (no separate content, toolCalls, toolResults)
- ✅ Supports multi-modal content and tool interactions

### 4. Agent Model Changes

- ✅ No direct `modelProvider` relation (model chosen per message)
- ✅ Focused on system prompt and MCP server configuration
- ✅ More flexible - can use different models in same conversation

### 5. File Management

- ✅ Files linked to `Conversation` instead of `Message`
- ✅ Simpler relationship model
- ✅ Files available across entire conversation

## JSON Field Format

All JSON fields are stored as strings in SQLite and parsed in application code:

### ModelProvider.models

```json
[
  { "id": "gpt-4o", "name": "GPT-4o", "isDefault": false },
  { "id": "gpt-4o-mini", "name": "GPT-4o Mini", "isDefault": true }
]
```

### MCPServerGroup.config

```json
{
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
    "description": "Provides filesystem access operations"
  }
}
```

### Agent.config

```json
{
  "temperature": 0.7,
  "maxTokens": 2048,
  "topP": 0.9
}
```

### Message.parts

```json
[
  { "type": "text", "text": "Hello!" },
  { "type": "image", "url": "data:image/png;base64,..." },
  { "type": "tool-call", "toolCallId": "...", "toolName": "...", "args": {} },
  { "type": "tool-result", "toolCallId": "...", "result": "..." }
]
```

## Database Location

- Development: `prisma/database.sqlite`
- The database file is gitignored

## Prisma Client Usage

```typescript
import { db } from "@/lib/db";

// Get model provider with parsed models
const provider = await db.modelProvider.findUnique({
  where: { name: "openai" },
});
const models = JSON.parse(provider.models);
const defaultModel = models.find((m) => m.isDefault);

// Create a message with model tracking
const message = await db.message.create({
  data: {
    conversationId: "...",
    modelProviderId: provider.id,
    model: "gpt-4o-mini",
    role: "user",
    parts: JSON.stringify([{ type: "text", text: "Hello!" }]),
  },
  include: {
    modelProvider: true,
  },
});

// Parse message parts
const parts = JSON.parse(message.parts);
parts.forEach((part) => {
  if (part.type === "text") {
    console.log(part.text);
  }
});

// Link file to conversation (not message)
const file = await db.file.create({
  data: {
    conversationId: "...",
    filename: "uuid-filename.pdf",
    originalName: "document.pdf",
    mimeType: "application/pdf",
    size: 12345,
    path: "/uploads/uuid-filename.pdf",
  },
});
```

## Seed Data

The database is pre-populated with:

- 2 Model Providers (OpenAI with 3 models, Google Gemini with 3 models)
- 2 MCP Server Groups (default filesystem, git-tools)
- 1 Default Agent
- 1 Sample Conversation with 3 messages

Run `bun run db:seed` to populate the database with initial data.

## Environment Variables

No need for `dotenv` package - Next.js handles environment variables automatically.

Required variables:

- `DATABASE_URL` - SQLite database URL (e.g., `file:./database.sqlite`)
- `OPENAI_API_KEY` - (optional) OpenAI API key
- `GOOGLE_GENERATIVE_AI_API_KEY` - (optional) Google API key
