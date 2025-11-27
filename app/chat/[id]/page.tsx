import { ChatContainer } from "@/components/chat/chat-container";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch conversation details
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/conversations/${id}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Conversation not found");
  }

  const conversation = await response.json();

  return (
    <ChatContainer
      conversationId={id}
      initialMessages={conversation.messages}
      conversationTitle={conversation.title}
    />
  );
}

