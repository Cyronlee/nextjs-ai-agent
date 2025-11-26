"use client";

import type { ChatMessage } from "@/app/api/chat/route";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MCPStatus } from "@/components/mcp-status";
import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";

interface ChatContainerProps {
  className?: string;
}

export function ChatContainer({ className }: ChatContainerProps) {
  const [input, setInput] = useState("");
  const [modelProvider, setModelProvider] = useState<"openai" | "google">(
    "google"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const lastMessageCountRef = useRef(0);

  const { messages, sendMessage, error } = useChat<ChatMessage>({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        modelProvider,
      },
    }),
    onError: (error) => {
      console.error("Chat error:", error);
      toast.error("Failed to send message", {
        description: error.message,
      });
      setIsProcessing(false);
    },
    onFinish: () => {
      setIsProcessing(false);
    },
  });

  // Track when new messages arrive
  if (messages.length > lastMessageCountRef.current) {
    lastMessageCountRef.current = messages.length;
    if (isProcessing && messages[messages.length - 1]?.role === "assistant") {
      setIsProcessing(false);
    }
  }

  const handleSubmit = () => {
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    sendMessage({
      text: input,
    });
    setInput("");
  };

  const handleClearChat = () => {
    window.location.reload();
    toast.success("Chat cleared");
  };

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-lg">AI Agent Chat</h2>
          <Select
            value={modelProvider}
            onValueChange={(value) =>
              setModelProvider(value as "openai" | "google")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI GPT-4o</SelectItem>
              <SelectItem value="google">Google Gemini</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <MCPStatus />
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            disabled={messages.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Chat
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ChatMessages messages={messages} className="flex-1" />

      {/* Error Display */}
      {error && (
        <div className="border-t bg-destructive/10 p-3 text-sm text-destructive">
          Error: {error.message}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          disabled={isProcessing}
        />
      </div>
    </div>
  );
}
