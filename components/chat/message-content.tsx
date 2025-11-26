import type { ChatMessage } from "@/app/api/chat/route";
import { Check, Loader2 } from "lucide-react";

interface MessageContentProps {
  message: ChatMessage;
}

export function MessageContent({ message }: MessageContentProps) {
  return (
    <div className="space-y-2">
      {message.parts.map((part, index) => {
        switch (part.type) {
          case "text":
            return (
              <div
                key={`${message.id}-text-${index}`}
                className="prose prose-sm max-w-none dark:prose-invert"
              >
                {part.text}
              </div>
            );

          case "tool-getWeather":
          case "tool-getCurrentTime":
          case "tool-calculate":
          case "tool-searchInfo": {
            const toolName = part.type.replace("tool-", "");
            const hasOutput = "output" in part && part.output !== undefined;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const toolData = part as any;

            return (
              <div
                key={`${message.id}-tool-${index}`}
                className={`rounded-lg border p-3 ${
                  hasOutput
                    ? "border-green-500/20 bg-green-500/10"
                    : "border-muted-foreground/20 bg-muted/30"
                }`}
              >
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
                </div>

                {hasOutput && toolData.output && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {typeof toolData.output === "string" ? (
                      <div>{toolData.output}</div>
                    ) : (
                      <pre className="overflow-x-auto rounded bg-muted p-2 text-[10px]">
                        {JSON.stringify(toolData.output, null, 2)}
                      </pre>
                    )}
                  </div>
                )}

                {!hasOutput && toolData.input && (
                  <div className="mt-2 text-xs">
                    <div className="font-medium text-muted-foreground">Arguments:</div>
                    <pre className="mt-1 overflow-x-auto rounded bg-muted p-2 text-[10px]">
                      {JSON.stringify(toolData.input, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}

