# Quick Start Guide - Message Persistence

## Prerequisites

Make sure you have the following environment variables set in your `.env.local` file:

```bash
# Required for server-side API calls
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL="file:./database.sqlite"

# API Keys (at least one required)
OPENAI_API_KEY=your-openai-api-key
# OR
GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key
```

## Setup Steps

1. **Install dependencies** (if not already done):

   ```bash
   bun install
   ```

2. **Push database schema**:

   ```bash
   bun run db:push
   ```

3. **Start the development server**:

   ```bash
   bun run dev
   ```

4. **Navigate to http://localhost:3000**
   - The app will automatically create a new conversation
   - You'll be redirected to `/chat/{conversation-id}`

## Testing the Implementation

### 1. Test Message Persistence

1. Send a few messages in the chat
2. Refresh the page (F5)
3. ✅ Messages should load from the database

### 2. Test Conversation Creation

1. Click the "New Chat" button in the header
2. ✅ A new conversation should be created
3. ✅ URL should change to a new conversation ID

### 3. Test Database Storage

View the database using Prisma Studio:

```bash
bun run db:studio
```

Navigate to:

- `Conversation` table - Should see your conversations
- `Message` table - Should see all messages with their parts as JSON

### 4. Test Client Disconnect Handling

1. Send a message
2. Quickly close the browser tab while the AI is responding
3. Reopen the app and navigate to that conversation
4. ✅ The partial response should be saved

## Troubleshooting

### "Failed to create conversation"

Make sure `NEXT_PUBLIC_APP_URL` is set in your `.env.local` file:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database errors

Reset the database:

```bash
bun run db:reset
bun run db:push
```

### Messages not persisting

Check the server console for errors. The most common issue is missing API keys.

## Architecture Overview

### Request Flow

```
1. User visits '/'
   └─> Auto-creates new conversation
   └─> Redirects to '/chat/{id}'

2. User visits '/chat/{id}'
   └─> Loads conversation from database
   └─> Passes initialMessages to ChatContainer

3. User sends message
   └─> Client: Sends ONLY last message to server
   └─> Server: Loads previous messages from DB
   └─> Server: Streams AI response
   └─> Server: Saves all messages to DB (onFinish)
```

### Key Components

- **`lib/conversation.ts`** - Database operations
- **`app/api/chat/route.ts`** - Chat streaming with persistence
- **`app/api/conversations/*`** - Conversation CRUD operations
- **`components/chat/chat-container.tsx`** - UI with conversation support

## Next Steps

To extend the implementation:

1. **Add conversation title generation** - Use AI to generate titles from first message
2. **Add conversation list** - Show all conversations in sidebar
3. **Add conversation search** - Search through messages
4. **Add message editing** - Allow users to edit/delete messages
5. **Add conversation sharing** - Share conversations via link

## API Reference

### Create Conversation

```bash
POST /api/conversations
Response: { id: string, title: string }
```

### Get Conversation

```bash
GET /api/conversations/{id}
Response: { id, title, messages: UIMessage[], ... }
```

### Update Conversation

```bash
PATCH /api/conversations/{id}
Body: { title: string }
```

### Delete Conversation

```bash
DELETE /api/conversations/{id}
```

### Chat (Stream)

```bash
POST /api/chat
Body: {
  message: UIMessage,        # Only the last message
  conversationId: string,
  modelProvider: string
}
Response: UIMessageStream
```
