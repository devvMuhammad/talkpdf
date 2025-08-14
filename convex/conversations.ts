import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    title: v.string(),
    userId: v.string(),
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
    parts: v.array(
      v.object({
        type: v.string(),
        text: v.optional(v.string()),
        mediaType: v.optional(v.string()),
        filename: v.optional(v.string()),
        url: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { conversationId, role, parts }) => {
    const messageId = await ctx.db.insert("messages", {
      conversationId,
      role,
      parts,
      createdAt: Date.now(),
    });
    return messageId;
  },
});

export const addMessages = mutation({
  args: {
    conversationId: v.id("conversations"),
    messages: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
      parts: v.array(
        v.object({
          type: v.string(),
          text: v.optional(v.string()),
          mediaType: v.optional(v.string()),
          filename: v.optional(v.string()),
          url: v.optional(v.string()),
        })
      ),
      createdAt: v.number(),
    }))
  },
  handler: async (ctx, { conversationId, messages }) => {
    for (const m of messages) {
      await ctx.db.insert("messages", {
        ...m,
        conversationId,
      });
    }
    return null;
  }
})

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
        parts: m.parts,
        createdAt: new Date(m.createdAt).toISOString(),
      })),
    };
  },
});

export const update = mutation({
  args: {
    id: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, { id, title }) => {
    await ctx.db.patch(id, { title });
    return null;
  },
});

export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const conversations = await ctx.db.query("conversations").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    return conversations;
  },
});

export const remove = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, { id }) => {
    // Delete all messages in the conversation
    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_convo", (q) => q.eq("conversationId", id))
      .collect();
    for (const m of msgs) {
      await ctx.db.delete(m._id);
    }
    // Delete the conversation itself
    await ctx.db.delete(id);
    return null;
  },
});
