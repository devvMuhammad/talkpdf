import { Suspense, type ReactNode } from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { getConversations } from "@/lib/server/chat"
import { ChatListSkeleton } from "@/components/skeletons/chat-list-skeleton"

export default async function ChatLayout({ children }: { children: ReactNode }) {
    const conversationsPromise = getConversations()

    return (
        <SidebarProvider defaultOpen={true}>
            <Suspense fallback={<ChatListSkeleton />}>
                <AppSidebar conversationsPromise={conversationsPromise} />
            </Suspense>
            <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
    )
}


