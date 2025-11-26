import type { ChatMessage } from "@/app/api/chat/route";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { MessageContent } from "./message-content";

interface MessageItemProps {
  message: ChatMessage;
  className?: string;
}

export function MessageItem({ message, className }: MessageItemProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 p-4",
        isUser ? "bg-muted/50" : "bg-background",
        className
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>
      <div className="flex-1 space-y-2">
        <div className="font-semibold text-sm">
          {isUser ? "You" : "Assistant"}
        </div>
        <MessageContent message={message} />
      </div>
    </div>
  );
}

