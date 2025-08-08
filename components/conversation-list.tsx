"use client";

import type React from "react";
import { MoreHorizontal } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

// Mock conversation data
const conversations = [
  {
    id: "1",
    title: "React Component Help",
    timestamp: "2h ago",
    lastMessage:
      "How to create a custom hook for jdnsfjnsdjnfjsnfjsdnfjsdnfjsdnfjsdnfjnsfjnsdjfnjsdnfjdsn",
    isActive: false,
  },
  {
    id: "2",
    title: "API Integration Guide",
    timestamp: "1d ago",
    lastMessage:
      "Setting up authentication with jdnsfjnsdjnfjsnfjsdnfjsdnfjsdnfjsdnfjnsfjnsdjfnjsdnfjdsn",
    isActive: true,
  },
  {
    id: "3",
    title: "Database Schema Design",
    timestamp: "2d ago",
    lastMessage:
      "Best practices for schema jdnsfjnsdjnfjsnfjsdnfjsdnfjsdnfjsdnfjnsfjnsdjfnjsdnfjdsn",
    isActive: false,
  },
  {
    id: "4",
    title: "Performance Optimization",
    timestamp: "3d ago",
    lastMessage:
      "How to improve loading times jdnsfjnsdjnfjsnfjsdnfjsdnfjsdnfjsdnfjnsfjnsdjfnjsdnfjdsn",
    isActive: false,
  },
  {
    id: "5",
    title: "TypeScript Advanced Types",
    timestamp: "1w ago",
    lastMessage:
      "Generic types and interfaces jdnsfjnsdjnfjsnfjsdnfjsdnfjsdnfjsdnfjnsfjnsdjfnjsdnfjdsn",
    isActive: false,
  },
  {
    id: "6",
    title: "Next.js App Router",
    timestamp: "1w ago",
    lastMessage:
      "Server components and routing jdnsfjnsdjnfjsnfjsdnfjsdnfjsdnfjsdnfjnsfjnsdjfnjsdnfjdsn",
    isActive: false,
  },
];

interface ConversationListProps {
  isCollapsed: boolean;
  activeConversationId?: string;
  onConversationSelect?: (id: string) => void;
}

export function ConversationList({
  isCollapsed,
  activeConversationId,
  onConversationSelect,
}: ConversationListProps) {
  return (
    <SidebarGroup>
      {!isCollapsed && (
        <SidebarGroupLabel className="text-gray-400 text-xs uppercase tracking-wider font-medium px-3 py-2">
          Recent Conversations
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent className="px-2">
        <SidebarMenu className="space-y-1">
          {conversations.map((conversation) => (
            <SidebarMenuItem key={conversation.id}>
              <div
                className={cn(
                  "group relative h-auto p-3 hover:bg-gray-800 rounded-lg transition-all duration-200 w-full text-left cursor-pointer",
                  activeConversationId === conversation.id &&
                  "bg-gray-800 border border-gray-700"
                )}
                onClick={() => onConversationSelect?.(conversation.id)}
                role="button"
                tabIndex={0}
                aria-label={`Select conversation: ${conversation.title}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                      activeConversationId === conversation.id
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
                          {conversation.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <button
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-100 hover:bg-gray-700 transition-all rounded-md flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle conversation options
                    }}
                    aria-label="More options"
                  >
                    <MoreHorizontal size={12} />
                  </button>
                )}
              </div>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
