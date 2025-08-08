"use client"

import { AppHeader } from "@/components/app-header"
import { ChatForm } from "@/components/chat-form"

export default function Page() {

  return (
    <>
      <AppHeader isChatActive={true} />
      <div className="flex-1 bg-gray-950 overflow-hidden">
        <ChatForm onChatStart={() => true} />
      </div>
    </>
  )
}
