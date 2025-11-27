"use client";

import { ChatContainer } from "@/components/chat/chat-container";
import useSWR from "swr";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

export default function ChatPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: conversation, error } = useSWR(
    id ? `/api/conversations/${id}` : null
  );

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="font-semibold text-lg text-destructive">
            Error loading conversation
          </h2>
          <p className="text-muted-foreground text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <ChatContainer
      conversationId={id}
      initialMessages={conversation.messages}
      conversationTitle={conversation.title}
    />
  );
}
