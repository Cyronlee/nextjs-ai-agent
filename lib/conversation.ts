import { db } from "@/lib/db";
import { type UIMessage } from "ai";
import { generateId } from "ai";

/**
 * Create a new conversation
 */
export async function createConversation(
  agentId?: string
): Promise<{ id: string; title: string }> {
  // For now, we'll use a default agent ID. In the future, this can be dynamic
  const defaultAgentId = agentId || "default-agent";

  // Create a default agent if it doesn't exist
  let agent = await db.agent.findFirst({
    where: { name: "Default Agent" },
  });

  if (!agent) {
    agent = await db.agent.create({
      data: {
        id: defaultAgentId,
        name: "Default Agent",
        systemPrompt:
          "You are a helpful AI assistant with access to various tools and multi-modal capabilities.",
      },
    });
  }

  // Generate title based on current time (HH:MM format)
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const title = `${hours}:${minutes}`;

  const conversation = await db.conversation.create({
    data: {
      agentId: agent.id,
      title,
    },
  });

  return { id: conversation.id, title: conversation.title || title };
}

/**
 * Load messages from a conversation
 */
export async function loadConversation(
  conversationId: string
): Promise<UIMessage[]> {
  const messages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });

  // Convert database messages to UIMessage format
  return messages.map((msg) => {
    const parts = JSON.parse(msg.parts);
    return {
      id: msg.id,
      role: msg.role as "user" | "assistant",
      parts,
    } as UIMessage;
  });
}

/**
 * Save messages to a conversation
 */
export async function saveMessages(
  conversationId: string,
  messages: UIMessage[],
  modelProvider: string = "google",
  model: string = "gemini-2.0-flash-exp"
): Promise<void> {
  // Get or create model provider
  let provider = await db.modelProvider.findUnique({
    where: { name: modelProvider },
  });

  if (!provider) {
    provider = await db.modelProvider.create({
      data: {
        name: modelProvider,
        displayName: modelProvider === "google" ? "Google Gemini" : "OpenAI",
        models: JSON.stringify([{ id: model, name: model, isDefault: true }]),
      },
    });
  }

  // Get existing message IDs to avoid duplicates
  const existingMessages = await db.message.findMany({
    where: { conversationId },
    select: { id: true },
  });
  const existingIds = new Set(existingMessages.map((m) => m.id));

  // Only save new messages
  const newMessages = messages.filter((msg) => !existingIds.has(msg.id));

  if (newMessages.length === 0) return;

  await db.message.createMany({
    data: newMessages.map((msg) => ({
      id: msg.id,
      conversationId,
      modelProviderId: provider.id,
      model,
      role: msg.role,
      parts: JSON.stringify(msg.parts),
      createdAt: new Date(),
    })),
  });

  // Update conversation's updatedAt timestamp
  await db.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
}

/**
 * Get conversation details
 */
export async function getConversation(conversationId: string) {
  return db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      agent: true,
    },
  });
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<void> {
  await db.conversation.update({
    where: { id: conversationId },
    data: { title },
  });
}

/**
 * List all conversations
 */
export async function listConversations() {
  return db.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { messages: true },
      },
    },
  });
}

/**
 * Delete a conversation and all its messages
 */
export async function deleteConversation(
  conversationId: string
): Promise<void> {
  await db.conversation.delete({
    where: { id: conversationId },
  });
}

/**
 * Generate a server-side message ID
 */
export function generateMessageId(): string {
  return generateId();
}
