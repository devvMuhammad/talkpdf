import type { ReactNode } from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { getConversations } from "@/lib/server/chat"

export default async function ChatLayout({ children }: { children: ReactNode }) {
    const conversations = await getConversations()

    return (
        <SidebarProvider defaultOpen={true}>
            <AppSidebar conversations={conversations} />
            <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
    )
}


