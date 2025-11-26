import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Send, Paperclip } from "lucide-react";
import { KeyboardEvent } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  className?: string;
  onAttachmentClick?: () => void;
  fileCount?: number;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  className,
  onAttachmentClick,
  fileCount = 0,
}: ChatInputProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit();
      }
    }
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <Button
        onClick={onAttachmentClick}
        disabled={disabled}
        variant="outline"
        size="icon"
        className="h-[60px] w-[60px] shrink-0 relative"
      >
        <Paperclip className="h-5 w-5" />
        {fileCount > 0 && (
          <Badge
            variant="default"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {fileCount}
          </Badge>
        )}
      </Button>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
        disabled={disabled}
        className="min-h-[60px] resize-none flex-1"
      />
      <Button
        onClick={onSubmit}
        disabled={!value.trim() || disabled}
        size="icon"
        className="h-[60px] w-[60px] shrink-0"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
}

