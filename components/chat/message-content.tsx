import type { ChatMessage } from "@/app/api/chat/route";
import { MessageResponse } from "@/components/ai-elements/message";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  MessageAttachment,
  MessageAttachments,
} from "@/components/ai-elements/message";
import type { FileUIPart, ToolUIPart } from "ai";

interface MessageContentProps {
  message: ChatMessage;
}

export function MessageContent({ message }: MessageContentProps) {
  // Separate file parts from other parts
  const fileParts = message.parts.filter(
    (part) => part.type === "file"
  ) as FileUIPart[];
  const otherParts = message.parts.filter((part) => part.type !== "file");

  return (
    <div className="space-y-2">
      {/* Render file attachments first */}
      {fileParts.length > 0 && (
        <MessageAttachments className="ml-0">
          {fileParts.map((part, index) => (
            <MessageAttachment
              key={`${message.id}-file-${index}`}
              data={part}
            />
          ))}
        </MessageAttachments>
      )}

      {/* Render text and tool parts */}
      {otherParts.map((part, index) => {
        // Handle text parts with MessageResponse for markdown rendering
        if (part.type === "text") {
          return (
            <MessageResponse key={`${message.id}-text-${index}`}>
              {part.text}
            </MessageResponse>
          );
        }

        // Handle all tool calls (those starting with "tool-")
        if (part.type.startsWith("tool-")) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const toolPart = part as any as ToolUIPart;
          const shouldOpen =
            toolPart.state === "output-available" ||
            toolPart.state === "output-error";

          return (
            <Tool key={`${message.id}-tool-${index}`} defaultOpen={shouldOpen}>
              <ToolHeader type={toolPart.type} state={toolPart.state} />
              <ToolContent>
                <ToolInput input={toolPart.input} />
                <ToolOutput
                  output={toolPart.output}
                  errorText={toolPart.errorText}
                />
              </ToolContent>
            </Tool>
          );
        }

        return null;
      })}
    </div>
  );
}
