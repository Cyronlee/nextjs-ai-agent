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
import { FileUploadDialog } from "./file-upload-dialog";
import type { FileWithPreview } from "@/hooks/use-file-upload";

interface ChatContainerProps {
  className?: string;
  conversationId: string;
  initialMessages?: ChatMessage[];
  conversationTitle?: string;
}

// Helper function to convert files to data URLs
async function convertFilesToDataURLs(
  files: FileWithPreview[]
): Promise<
  { type: "file"; filename: string; mediaType: string; url: string }[]
> {
  return Promise.all(
    files.map(
      (fileWithPreview) =>
        new Promise<{
          type: "file";
          filename: string;
          mediaType: string;
          url: string;
        }>((resolve, reject) => {
          const file = fileWithPreview.file as File;
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              type: "file",
              filename: file.name,
              mediaType: file.type,
              url: reader.result as string, // Data URL
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    )
  );
}

export function ChatContainer({
  className,
  conversationId,
  initialMessages = [],
  conversationTitle = "New Conversation",
}: ChatContainerProps) {
  const [input, setInput] = useState("");
  const [modelProvider, setModelProvider] = useState<"openai" | "google">(
    "google"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const lastMessageCountRef = useRef(0);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);

  const { messages, sendMessage, error } = useChat<ChatMessage>({
    id: conversationId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        modelProvider,
        conversationId,
      },
      // Only send the last message to the server
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: {
            message: messages[messages.length - 1],
            conversationId: id,
            modelProvider,
          },
        };
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

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);

    try {
      // Convert files to data URLs
      const fileParts =
        files && files.length > 0 ? await convertFilesToDataURLs(files) : [];

      // Send message with text and file parts
      sendMessage({
        role: "user",
        parts: [{ type: "text", text: input }, ...fileParts],
      });

      // Clear input only, keep files for the session
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message with files");
      setIsProcessing(false);
    }
  };

  const handleClearChat = async () => {
    // Create a new conversation
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }

      const { id } = await response.json();
      window.location.href = `/chat/${id}`;
      toast.success("New conversation started");
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to create new conversation");
    }
  };

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-lg">{conversationTitle}</h2>
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
          <Button variant="outline" size="sm" onClick={handleClearChat}>
            <Trash2 className="mr-2 h-4 w-4" />
            New Chat
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
          onAttachmentClick={() => setIsFileDialogOpen(true)}
          fileCount={files.length}
        />
      </div>

      {/* File Upload Dialog */}
      <FileUploadDialog
        open={isFileDialogOpen}
        onOpenChange={setIsFileDialogOpen}
        files={files}
        onFilesChange={setFiles}
      />
    </div>
  );
}
