"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Trash2 } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  const wk = Math.floor(day / 7);
  if (wk < 4) return `${wk}w`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo`;
  const yr = Math.floor(day / 365);
  return `${yr}y`;
}

interface ConversationListProps {
  isCollapsed: boolean;
  activeConversationId?: string;
  conversations: Doc<"conversations">[] | undefined
}

export function ConversationList({
  isCollapsed,
  activeConversationId,
  conversations,
}: ConversationListProps) {
  const deleteConversation = useMutation(api.conversations.remove);
  const [pendingDelete, setPendingDelete] = useState<Id<"conversations"> | null>(null);

  if (!conversations)
    return (
      <SidebarGroup>
        {!isCollapsed && (
          <SidebarGroupLabel className="text-gray-400 text-xs uppercase tracking-wider font-medium px-3 py-2">
            Recent Conversations
          </SidebarGroupLabel>
        )}
        <SidebarGroupContent className="px-2">
          <SidebarMenu className="space-y-1">
            {Array.from({ length: 6 }).map((_, idx) => (
              <SidebarMenuItem key={idx}>
                <div className="group relative block h-auto p-3 rounded-lg border border-transparent hover:border-gray-800 transition-all duration-200 w-full">
                  <div className="flex items-start gap-3">
                    <Skeleton className="w-2 h-2 rounded-full mt-2 bg-gray-700" />
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-40 bg-gray-800" />
                          <Skeleton className="h-3 w-10 bg-gray-800" />
                        </div>
                        <Skeleton className="h-3 w-full bg-gray-800" />
                      </div>
                    )}
                  </div>
                </div>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );

  return (
    <SidebarGroup>
      {!isCollapsed && (
        <SidebarGroupLabel className="text-gray-400 text-xs uppercase tracking-wider font-medium px-3 py-2">
          Recent Conversations
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent className="px-2">
        <SidebarMenu className="space-y-1">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <MessageSquare className="h-8 w-8 text-gray-500 mb-3" />
              <p className="text-sm text-gray-400 font-medium">No conversations yet</p>
              <p className="text-xs text-gray-500 mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <SidebarMenuItem key={conversation._id}>
                <Link
                  href={`/chat/${conversation._id}`}
                  className={cn(
                    "group relative block h-auto p-3 hover:bg-gray-800 rounded-lg transition-all duration-200 w-full text-left cursor-pointer",
                    activeConversationId === conversation._id &&
                    "bg-gray-800 border border-gray-700"
                  )}
                  aria-label={`Select conversation: ${conversation.title}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                        activeConversationId === conversation._id
                          ? "bg-blue-500"
                          : "bg-gray-600"
                      )}
                    />

                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-medium text-gray-100 truncate pr-2">
                            {conversation.title}
                          </h3>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatRelative(conversation.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          This is hard coded for now
                        </p>
                      </div>
                    )}
                  </div>

                  {!isCollapsed && (
                    <AlertDialog open={pendingDelete === conversation._id} onOpenChange={(open) => setPendingDelete(open ? conversation._id : null)}>
                      <AlertDialogTrigger asChild>
                        <button
                          className="absolute bottom-2 right-2 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-all rounded-md flex items-center justify-center"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPendingDelete(conversation._id);
                          }}
                          aria-label="Delete conversation"
                        >
                          <Trash2 size={10} />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-900 border border-gray-800">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-gray-100">Delete conversation?</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400">
                            This will permanently delete "{conversation.title}" and all of its messages.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={async (e) => {
                              e.preventDefault();
                              try {
                                await deleteConversation({ id: conversation._id });
                                toast({ title: "Deleted", description: "Conversation removed." });
                              } catch (err) {
                                toast({ title: "Failed", description: "Could not delete conversation.", variant: "destructive" });
                              } finally {
                                setPendingDelete(null);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </Link>
              </SidebarMenuItem>
            ))
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
