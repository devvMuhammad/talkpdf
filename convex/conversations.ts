import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    title: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, { title, userId }) => {
    const conversationId = await ctx.db.insert("conversations", {
      title,
      userId,
      createdAt: Date.now(),
    });
    return conversationId;
  },
});

export const addMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
  },
  handler: async (ctx, { conversationId, role, content }) => {
    const messageId = await ctx.db.insert("messages", {
      conversationId,
      role,
      content,
      createdAt: Date.now(),
    });
    return messageId;
  },
});

export const getById = query({
  args: { id: v.id("conversations") },
  handler: async (ctx, { id }) => {
    const convo = await ctx.db.get(id);
    if (!convo) return null;
    const all = await ctx.db.query("messages").collect();
    const messages = all
      .filter((m) => m.conversationId === id)
      .sort((a, b) => a.createdAt - b.createdAt);
    return {
      id,
      title: convo.title,
      messages: messages.map((m) => ({
        id: m._id,
        role: m.role,
        content: m.content,
        createdAt: new Date(m.createdAt).toISOString(),
      })),
    };
  },
});


