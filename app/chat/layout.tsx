import { Suspense, type ReactNode } from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ChatListSkeleton } from "@/components/skeletons/chat-list-skeleton"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { fetchMutation, fetchQuery } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    template: "%s | TalkPDF",
    default: "Chat | TalkPDF",
  },
  description: "Chat with your PDFs using AI - Upload, analyze, and ask questions about your documents.",
  icons: {
    icon: "/favicon.ico",
  },
}


export default async function ChatLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth()

  if (!userId) {
    return redirect("/login");
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Suspense fallback={<ChatListSkeleton />}>
        <AppSidebar userId={userId} />
      </Suspense>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}


