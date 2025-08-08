import { notFound } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { ChatForm } from "@/components/chat-form"
import { getChatById } from "@/lib/server/chat"

export default async function ChatIdPage({ params }: { params: { chatId: string } }) {
  const chat = await getChatById(params.chatId)
  if (!chat) return notFound()

  return (
    <>
      <AppHeader chatTitle={chat.title} isChatActive={true} />
      <div className="flex-1 bg-gray-950 overflow-hidden">
        <ChatForm conversationId={chat.id} initialMessages={chat.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }))} />
      </div>
    </>
  )
}


