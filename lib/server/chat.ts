import { createConvexClient } from "./convexClient";
import type { ChatDetail, ConversationSummary } from "@/types/chat";

export async function getConversations(): Promise<ConversationSummary[]> {
  const convex = await createConvexClient();
  // For now, return empty list or basic mapping if needed later
  return [];
}

export async function getChatById(chatId: string): Promise<ChatDetail | null> {
  const convex = await createConvexClient();
  try {
    const data = await convex.query("conversations:getById", { id: chatId as any });
    if (!data) return null;
    return {
      id: data.id,
      title: data.title,
      messages: data.messages,
    } as ChatDetail;
  } catch (e) {
    return null;
  }
}

export async function createNewChat(): Promise<ChatDetail> {
  const convex = await createConvexClient();
  const id: string = await convex.mutation("conversations:create", { title: "New Conversation" } as any);
  return {
    id,
    title: "New Conversation",
    messages: [],
  };
}


