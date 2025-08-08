"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { ChatForm } from "@/components/chat-form"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useChat } from "ai/react"

export default function Page() {
    const [activeConversationId, setActiveConversationId] = useState<string>()
    const { messages } = useChat({ id: activeConversationId })
    const [isChatActive, setIsChatActive] = useState(false)
    const [chatTitle, setChatTitle] = useState<string>()

    useEffect(() => {
        if (messages.length > 0 && !isChatActive) {
            setIsChatActive(true)
            // Set chat title based on first message or conversation
            if (messages[0]?.content) {
                const title = messages[0].content.slice(0, 50) + (messages[0].content.length > 50 ? "..." : "")
                setChatTitle(title)
            }
        }
    }, [messages, isChatActive])

    const handleConversationSelect = (id: string) => {
        setActiveConversationId(id)
        setIsChatActive(true)
        // Set title based on selected conversation
        const conversation = conversations.find((c) => c.id === id)
        setChatTitle(conversation?.title || "Chat with Assistant")
    }

    const handleNewConversation = () => {
        setActiveConversationId(undefined)
        setIsChatActive(false)
        setChatTitle(undefined)
    }

    const handleChatStart = () => {
        setIsChatActive(true)
    }

    // Mock conversations for title setting
    const conversations = [
        { id: "1", title: "React Component Help" },
        { id: "2", title: "API Integration Guide" },
        { id: "3", title: "Database Schema Design" },
    ]

    return (
        <SidebarProvider defaultOpen={true}>
            <AppSidebar
                activeConversationId={activeConversationId}
                onConversationSelect={handleConversationSelect}
                onNewConversation={handleNewConversation}
            />
            <SidebarInset>
                <AppHeader chatTitle={chatTitle} isChatActive={isChatActive} />
                <div className="flex-1 bg-gray-950 overflow-hidden">
                    <ChatForm conversationId={activeConversationId} onChatStart={handleChatStart} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
