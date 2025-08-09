import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import type { ChatDetail } from "@/types/chat";
import { fetchQuery } from "convex/nextjs";

export async function getConversations() {
  try {
    const data = await fetchQuery(api.conversations.getByUserId, { userId: "public" });
    return data.map((c) => ({
      id: c._id,
      title: c.title,
      timestamp: new Date(c.createdAt).toISOString(),
      lastMessage: ""
    }));
  } catch {
    return [];
  }
}

export async function getChatById(chatId: string) {
  try {
    const data = await fetchQuery(api.conversations.getById, { id: chatId as Id<"conversations"> });
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


