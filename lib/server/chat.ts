import { type ConversationSummary, type ChatDetail } from "@/types/chat"

const DEMO_DELAY_MS = 100
async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getConversations(): Promise<ConversationSummary[]> {
  // TODO: replace with real DB fetch
  await sleep(DEMO_DELAY_MS)
  return [
    {
      id: "1",
      title: "React Component Help",
      timestamp: "2h ago",
      lastMessage: "How to create a custom hook for ...",
    },
    {
      id: "2",
      title: "API Integration Guide",
      timestamp: "1d ago",
      lastMessage: "Setting up authentication with ...",
    },
    {
      id: "3",
      title: "Database Schema Design",
      timestamp: "2d ago",
      lastMessage: "Best practices for schema ...",
    },
  ]
}

export async function getChatById(chatId: string): Promise<ChatDetail | null> {
  // TODO: replace with real DB fetch
  await sleep(DEMO_DELAY_MS)
  const all = await getConversations()
  const summary = all.find((c) => c.id === chatId)
  if (!summary) return null
  return {
    id: summary.id,
    title: summary.title,
    messages: [
      {
        id: "m1",
        role: "user",
        content: `Hello, I need help about: ${summary.title}`,
        createdAt: new Date().toISOString(),
      },
      {
        id: "m2",
        role: "assistant",
        content: "Sure, tell me more.",
        createdAt: new Date().toISOString(),
      },
    ],
  }
}

export async function createNewChat(): Promise<ChatDetail> {
  // TODO: replace with real DB insert
  const id = String(Math.floor(Math.random() * 10_000))
  return {
    id,
    title: "New Conversation",
    messages: [],
  }
}


