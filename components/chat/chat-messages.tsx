"use client";

import type { ChatMessage } from "@/app/api/chat/route";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { MessageItem } from "./message-item";

interface ChatMessagesProps {
  messages: ChatMessage[];
  className?: string;
  onRegenerate?: () => void;
}

export function ChatMessages({
  messages,
  className,
  onRegenerate,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div
        className={cn("flex flex-1 items-center justify-center", className)}
      >
        <div className="text-center text-muted-foreground">
          <div className="text-lg font-medium">No messages yet</div>
          <div className="text-sm">
            Start a conversation by sending a message
          </div>
        </div>
      </div>
    );
  }

  // Find the last assistant message index
  const lastAssistantMessageIndex = messages
    .map((m, i) => ({ ...m, index: i }))
    .reverse()
    .find((m) => m.role === "assistant")?.index;

  return (
    <ScrollArea className={cn("flex-1", className)}>
      <div ref={scrollRef} className="space-y-0">
        {messages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            isLastAssistantMessage={
              message.role === "assistant" &&
              index === lastAssistantMessageIndex
            }
            onRegenerate={
              message.role === "assistant" &&
              index === lastAssistantMessageIndex
                ? onRegenerate
                : undefined
            }
          />
        ))}
      </div>
    </ScrollArea>
  );
}

