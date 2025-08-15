import { notFound, redirect } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { ChatForm } from "@/components/chat-form"
import { getChatById } from "@/lib/server/chat"
import { type UIMessage } from "ai";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { Id } from "@/convex/_generated/dataModel";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ chatId: string }> }): Promise<Metadata> {
  const { chatId } = await params;
  const chat = await getChatById(chatId);

  if (!chat) {
    return {
      title: "Chat not found",
      description: "The requested chat conversation could not be found.",
    };
  }

  return {
    title: chat.title,
    description: `Continue your conversation about ${chat.title} with AI-powered PDF analysis.`,
  };
}

export default async function ChatIdPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params
  const chat = await getChatById(chatId)
  if (!chat) redirect("/chat")

  const initialMessages = await fetchQuery(api.conversations.getById, { id: chatId as Id<"conversations"> })

  if (!initialMessages) return notFound()

  const initialMessagesArray = initialMessages.messages.map((m) => ({
    id: m.id,
    role: m.role,
    parts: m.parts,
  }))

  // Fetch uploaded files linked to this conversation
  const files = await fetchQuery(api.files.listByConversation, { conversationId: chatId as Id<"conversations"> });

  return (
    <section className="h-screen grid grid-rows-[auto_1fr]">
      <AppHeader chatTitle={chat.title} isChatActive={true} />
      <div className="bg-gray-950 overflow-hidden">
        <ChatForm files={files} conversationId={chat.id} initialMessages={initialMessagesArray} />
      </div>
    </section>
  )
}


