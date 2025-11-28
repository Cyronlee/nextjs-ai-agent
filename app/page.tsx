"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Create a new conversation when the home page loads
    const createConversation = async () => {
      setIsCreating(true);
      try {
        const response = await fetch("/api/conversations", {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Failed to create conversation");
        }

        const { id } = await response.json();
        router.push(`/chat/${id}`);
      } catch (error) {
        console.error("Error creating conversation:", error);
        setIsCreating(false);
      }
    };

    createConversation();
  }, [router]);

  return (
    <div className="flex h-full flex-col items-center justify-center">
      {isCreating ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-muted-foreground">Creating new conversation...</p>
        </div>
      ) : (
        <Button
          onClick={async () => {
            setIsCreating(true);
            try {
              const response = await fetch("/api/conversations", {
                method: "POST",
              });

              if (!response.ok) {
                throw new Error("Failed to create conversation");
              }

              const { id } = await response.json();
              router.push(`/chat/${id}`);
            } catch (error) {
              console.error("Error creating conversation:", error);
              setIsCreating(false);
            }
          }}
        >
          Start New Chat
        </Button>
      )}
    </div>
  );
}
