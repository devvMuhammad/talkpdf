import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  files: defineTable({
    name: v.string(),
    size: v.number(),
    type: v.string(),
    storageId: v.id("_storage"),
    userId: v.optional(v.string()),
    conversationId: v.optional(v.id("conversations")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId", "createdAt"])
    .index("by_conversation", ["conversationId", "createdAt"]),

  conversations: defineTable({
    title: v.string(),
    userId: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId", "createdAt"]),

  messages: defineTable({
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
    createdAt: v.number(),
  }).index("by_convo", ["conversationId", "createdAt"]),
});


