"use client";

import { MessageSquare, Plus, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { ConversationList } from "./conversation-list";
import { PlanUsage } from "./plan-usage";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMemo } from "react";


export function AppSidebar({ userId }: { userId: string }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const pathname = usePathname();
  const activeConversationId = useMemo(() => {
    const match = pathname.match(/^\/chat\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : undefined;
  }, [pathname]);

  console.log("userId", userId)

  const conversations = useQuery(api.conversations.getByUserId, {
    userId: userId
  })

  console.log("conversations", conversations)

  return (
    <Sidebar className="border-r border-gray-800 bg-gray-950">
      <SidebarHeader>
        <div className="flex items-center justify-between p-3">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <MessageSquare size={16} className="text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-100">AI Chat</h2>
            </div>
          )}
          <Link
            href="/chat"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-100 transition-colors"
            aria-label="New conversation"
          >
            <Plus size={16} />
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-gray-950 overflow-y-auto custom-scrollbar">
        <ConversationList
          isCollapsed={isCollapsed}
          activeConversationId={activeConversationId}
          conversations={conversations}
        />
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-800 bg-gray-900">
        <div className="p-4 space-y-4">
          <PlanUsage />
          <Link
            href="/settings"
            className="flex pl-4 items-center pl text-sm gap-1 w-full justify-start h-9 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Settings size={14} className="mr-2" />
            Settings
          </Link>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
