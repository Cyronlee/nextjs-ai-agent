import type { ChatMessage } from "@/app/api/chat/route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Info, Loader2 } from "lucide-react";
import { useState } from "react";

interface MessageContentProps {
  message: ChatMessage;
}

interface ToolCallDetailProps {
  toolCallId: string;
  toolName: string;
  input: Record<string, unknown>;
  output?: unknown;
  hasOutput: boolean;
}

function ToolCallDetail({
  toolCallId,
  toolName,
  input,
  output,
  hasOutput,
}: ToolCallDetailProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2">
          <Info className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-2xl max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tool Call Details</DialogTitle>
          <DialogDescription>
            Information about this tool invocation
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">
            {/* Tool Call ID */}
            <div>
              <h4 className="mb-2 font-semibold text-sm">Tool Call ID</h4>
              <div className="rounded-md bg-muted p-3 font-mono text-xs">
                {toolCallId}
              </div>
            </div>

            {/* Tool Name */}
            <div>
              <h4 className="mb-2 font-semibold text-sm">Tool Name</h4>
              <div className="rounded-md bg-muted p-3 font-mono text-sm">
                {toolName}
              </div>
            </div>

            {/* Input Parameters */}
            <div>
              <h4 className="mb-2 font-semibold text-sm">Input Parameters</h4>
              {Object.keys(input).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(input).map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-md border bg-muted/50 p-3"
                    >
                      <div className="mb-1 font-mono text-xs font-semibold text-primary">
                        {key}
                      </div>
                      <div className="text-sm">
                        {typeof value === "string" ? (
                          <div className="text-muted-foreground">{value}</div>
                        ) : (
                          <pre className="overflow-x-auto text-xs text-muted-foreground">
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                  No parameters
                </div>
              )}
            </div>

            {/* Output */}
            <div>
              <h4 className="mb-2 font-semibold text-sm">Output</h4>
              {hasOutput && output !== undefined ? (
                <div className="rounded-md bg-muted p-3">
                  {typeof output === "string" ? (
                    <div className="text-sm text-muted-foreground">
                      {output}
                    </div>
                  ) : (
                    <pre className="overflow-x-auto text-xs text-muted-foreground">
                      {JSON.stringify(output, null, 2)}
                    </pre>
                  )}
                </div>
              ) : (
                <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                  No output yet
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function MessageContent({ message }: MessageContentProps) {
  return (
    <div className="space-y-2">
      {message.parts.map((part, index) => {
        // Handle text parts
        if (part.type === "text") {
          return (
            <div
              key={`${message.id}-text-${index}`}
              className="prose prose-sm max-w-none dark:prose-invert"
            >
              {part.text}
            </div>
          );
        }

        // Handle all tool calls (those starting with "tool-")
        if (part.type.startsWith("tool-")) {
          const toolName = part.type.replace("tool-", "");
          const hasOutput = "output" in part && part.output !== undefined;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const toolData = part as any;
          const toolCallId = toolData.toolCallId || `${message.id}-${index}`;
          const input = toolData.input || {};
          const output = toolData.output;

          return (
            <div
              key={`${message.id}-tool-${index}`}
              className={`rounded-lg border p-3 ${
                hasOutput
                  ? "border-green-500/20 bg-green-500/10"
                  : "border-muted-foreground/20 bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex items-center gap-2 text-xs font-medium ${
                    hasOutput
                      ? "text-green-700 dark:text-green-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {hasOutput ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  {hasOutput ? "Tool result" : "Calling tool"}:{" "}
                  <span className="font-mono">{toolName}</span>
                  {/* Badge for MCP tools */}
                  {toolName.includes("_") && (
                    <Badge variant="secondary" className="ml-1 text-[10px]">
                      MCP
                    </Badge>
                  )}
                </div>
                <ToolCallDetail
                  toolCallId={toolCallId}
                  toolName={toolName}
                  input={input}
                  output={output}
                  hasOutput={hasOutput}
                />
              </div>

              {hasOutput && output && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {typeof output === "string" ? (
                    <div className="line-clamp-2">{output}</div>
                  ) : (
                    <pre className="line-clamp-3 overflow-x-auto rounded bg-muted p-2 text-[10px]">
                      {JSON.stringify(output, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
