import { notFound } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { ChatForm } from "@/components/chat-form"
import { getChatById } from "@/lib/server/chat"
import { createConvexClient } from "@/lib/server/convexClient"
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

  // Fetch uploaded files linked to this conversation
  const convex = await createConvexClient();
  const files = await convex.query("files:listByConversation", { conversationId: chatId } as any);

  return (
    <>
      <AppHeader chatTitle={chat.title} isChatActive={true} />
      <div className="flex-1 bg-gray-950 overflow-hidden">
        {files && files.length > 0 && (
          <div className="max-w-4xl mx-auto px-6 pt-4">
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
              <div className="text-xs text-gray-400 mb-3">Uploaded files</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {files.map((f: any) => (
                  <div key={f._id} className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2">
                    <div className="w-8 h-8 rounded-md bg-blue-600/20 border border-blue-700/30 flex items-center justify-center text-blue-300 text-xs">PDF</div>
                    <div className="min-w-0">
                      <div className="text-sm text-gray-100 truncate">{f.name}</div>
                      <div className="text-xs text-gray-500">{(f.size / (1024 * 1024)).toFixed(2)} MB</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <ChatForm conversationId={chat.id} initialMessages={initialMessages} />
      </div>
    </>
  )
}


