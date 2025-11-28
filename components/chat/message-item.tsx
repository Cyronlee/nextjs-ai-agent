"use client";

import type { ChatMessage } from "@/app/api/chat/route";
import {
  Message,
  MessageContent as MessageContentWrapper,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Bot, Copy, User } from "lucide-react";
import { MessageContent } from "./message-content";
import { toast } from "sonner";

interface MessageItemProps {
  message: ChatMessage;
  className?: string;
  isLastAssistantMessage?: boolean;
  onRegenerate?: () => void;
}

export function MessageItem({
  message,
  className,
  isLastAssistantMessage = false,
  onRegenerate,
}: MessageItemProps) {
  const isUser = message.role === "user";

  const handleCopy = () => {
    // Extract all text parts
    const textParts = message.parts
      .filter((part) => part.type === "text")
      .map((part) => ("text" in part ? part.text : ""))
      .join("\n");

    navigator.clipboard.writeText(textParts);
    toast.success("Copied to clipboard");
  };

  return (
    <div
      className={cn(
        "flex gap-3 p-4",
        isUser ? "bg-muted/50" : "bg-background",
        className
      )}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </AvatarFallback>
      </Avatar>

      {/* Message content */}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="font-semibold text-sm">
          {isUser ? "You" : "Assistant"}
        </div>

        <Message from={message.role} className="w-full max-w-full">
          <MessageContentWrapper
            className={cn(
              "ml-0 w-full max-w-full",
              isUser && "bg-transparent px-0 py-0"
            )}
          >
            <MessageContent message={message} />
          </MessageContentWrapper>
        </Message>

        {/* Message actions for assistant messages */}
        {!isUser && (
          <MessageActions className="mt-2">
            <MessageAction label="Copy message" tooltip="Copy" onClick={handleCopy}>
              <Copy className="h-3 w-3" />
            </MessageAction>
            {/* Add regenerate button only for the last assistant message */}
            {isLastAssistantMessage && onRegenerate && (
              <MessageAction
                label="Regenerate response"
                tooltip="Regenerate"
                onClick={onRegenerate}
              >
                <Bot className="h-3 w-3" />
              </MessageAction>
            )}
          </MessageActions>
        )}
      </div>
    </div>
  );
}

