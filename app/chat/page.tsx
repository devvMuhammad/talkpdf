"use client"

import { useState } from "react"
import { AppHeader } from "@/components/app-header"
import { ChatForm } from "@/components/chat-form"

export default function Page() {
    const [isChatActive, setIsChatActive] = useState(false)

    return (
        <>
            <AppHeader isChatActive={isChatActive} />
            <div className="flex-1 bg-gray-950 overflow-hidden">
                <ChatForm onChatStart={() => setIsChatActive(true)} />
            </div>
        </>
    )
}
