"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>AI Agent Chat</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center">
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
      </SidebarInset>
    </SidebarProvider>
  );
}
