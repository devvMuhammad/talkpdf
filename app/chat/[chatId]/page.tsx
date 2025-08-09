import { notFound } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { ChatForm } from "@/components/chat-form"
import { getChatById } from "@/lib/server/chat"
import { type UIMessage } from "ai";

export default async function ChatIdPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params
  const chat = await getChatById(chatId)
  if (!chat) return notFound()

  const initialMessages: UIMessage[] = chat.messages.map((m) => ({
    id: m.id,
    role: m.role,
    parts: [{ type: "text", text: m.content }],
  }));

  return (
    <>
      <AppHeader chatTitle={chat.title} isChatActive={true} />
      <div className="flex-1 bg-gray-950 overflow-hidden">
        <ChatForm conversationId={chat.id} initialMessages={initialMessages} />
      </div>
    </>
  )
}


