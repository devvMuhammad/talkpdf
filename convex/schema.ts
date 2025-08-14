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

  // Billing and subscription management
  userBilling: defineTable({
    userId: v.string(),
    tokensUsed: v.number(),
    tokensLimit: v.number(),
    storageUsed: v.number(), // bytes
    storageLimit: v.number(), // bytes
    subscriptionType: v.union(v.literal("free"), v.literal("paid")),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
    nextResetDate: v.optional(v.number()),
    lastUpdated: v.number(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Token usage tracking
  tokenTransactions: defineTable({
    userId: v.string(),
    conversationId: v.optional(v.id("conversations")),
    messageId: v.optional(v.id("messages")),
    tokensUsed: v.number(),
    operationType: v.union(
      v.literal("chat_message"),
      v.literal("file_processing"),
      v.literal("embedding_generation"),
      v.literal("query_embedding")
    ),
    description: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId", "createdAt"])
    .index("by_operation", ["operationType", "createdAt"])
    .index("by_conversation", ["conversationId", "createdAt"]),

  // Storage usage tracking
  storageTransactions: defineTable({
    userId: v.string(),
    fileId: v.optional(v.id("files")),
    sizeBytes: v.number(), // positive for upload, negative for delete
    operationType: v.union(v.literal("file_upload"), v.literal("file_delete")),
    filename: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId", "createdAt"])
    .index("by_file", ["fileId", "createdAt"]),
});


