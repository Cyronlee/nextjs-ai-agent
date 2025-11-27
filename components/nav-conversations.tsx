"use client";

import {
  MessageSquare,
  MoreHorizontal,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  _count: {
    messages: number;
  };
}

export function NavConversations() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const params = useParams();
  const currentConversationId = params.id as string;

  const { data: conversations, error, isLoading } = useSWR<Conversation[]>(
    "/api/conversations"
  );

  const handleCreateConversation = async () => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }

      const { id } = await response.json();
      
      // Mutate the conversations list to refetch
      mutate("/api/conversations");
      
      // Navigate to the new conversation
      router.push(`/chat/${id}`);
      toast.success("New conversation created");
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to create conversation");
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete conversation");
      }

      // Mutate the conversations list to refetch
      mutate("/api/conversations");

      // If we're currently viewing this conversation, redirect to home
      if (conversationId === currentConversationId) {
        router.push("/");
      }

      toast.success("Conversation deleted");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    }
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>
        <div className="flex w-full items-center justify-between">
          <span>Conversations</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCreateConversation}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </SidebarGroupLabel>
      <SidebarMenu>
        {isLoading && (
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}

        {error && (
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <span className="text-destructive text-sm">Failed to load</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}

        {conversations?.map((conversation) => (
          <SidebarMenuItem key={conversation.id}>
            <SidebarMenuButton
              asChild
              isActive={conversation.id === currentConversationId}
            >
              <a href={`/chat/${conversation.id}`}>
                <MessageSquare className="h-4 w-4" />
                <span className="truncate">{conversation.title}</span>
              </a>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem
                  onClick={() => router.push(`/chat/${conversation.id}`)}
                >
                  <MessageSquare className="text-muted-foreground" />
                  <span>Open</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleDeleteConversation(conversation.id)}
                >
                  <Trash2 className="text-destructive" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}

        {conversations && conversations.length === 0 && (
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <span className="text-muted-foreground text-sm">
                No conversations yet
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}

