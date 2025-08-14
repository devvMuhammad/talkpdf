import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { DEFAULT_LIMITS, PRICING } from "@/lib/config";

// Initialize user billing data (called when a user first signs up)
export const initializeUserBilling = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const existing = await ctx.db
      .query("userBilling")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      return existing._id;
    }

    const billingId = await ctx.db.insert("userBilling", {
      userId,
      tokensUsed: 0,
      tokensLimit: DEFAULT_LIMITS.FREE_TOKENS, // Initial free tokens
      storageUsed: 0,
      storageLimit: DEFAULT_LIMITS.FREE_STORAGE_BYTES, // Free storage in bytes
      subscriptionType: "free",
      subscriptionStatus: "active",
      lastUpdated: Date.now(),
      createdAt: Date.now(),
    });
    return billingId;
  },
});

// Get user billing data
export const getUserBilling = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const billing = await ctx.db
      .query("userBilling")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!billing) {
      return null;
    }

    return billing;
  },
});

// Record token usage (graceful - doesn't throw when limits exceeded)
export const recordTokenUsage = mutation({
  args: {
    userId: v.string(),
    tokensUsed: v.number(),
    conversationId: v.optional(v.id("conversations")),
    messageId: v.optional(v.id("messages")),
    operationType: v.union(
      v.literal("chat_message"),
      v.literal("file_processing"),
      v.literal("embedding_generation"),
      v.literal("query_embedding")
    ),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, tokensUsed } = args;

    // Get current billing data
    const billing = await ctx.db
      .query("userBilling")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!billing) {
      throw new Error("User billing not initialized");
    }

    const newTokensUsed = billing.tokensUsed + tokensUsed;

    // Update user billing
    await ctx.db.patch(billing._id, {
      tokensUsed: newTokensUsed,
      lastUpdated: Date.now(),
    });

    // Record transaction
    await ctx.db.insert("tokenTransactions", {
      userId,
      conversationId: args.conversationId,
      messageId: args.messageId,
      tokensUsed,
      operationType: args.operationType,
      description: args.description,
      createdAt: Date.now(),
    });

    return newTokensUsed;
  },
});

// Record storage usage
export const recordStorageUsage = mutation({
  args: {
    userId: v.string(),
    sizeBytes: v.number(),
    fileId: v.optional(v.id("files")),
    operationType: v.union(v.literal("file_upload"), v.literal("file_delete")),
    filename: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, sizeBytes, operationType } = args;

    // Get current billing data
    const billing = await ctx.db
      .query("userBilling")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!billing) {
      throw new Error("User billing not initialized");
    }

    const newStorageUsed = operationType === "file_upload"
      ? billing.storageUsed + sizeBytes
      : billing.storageUsed - sizeBytes;

    // Check if user has enough storage (only for uploads)
    if (operationType === "file_upload" && newStorageUsed > billing.storageLimit) {
      throw new Error("Insufficient storage");
    }

    // Update user billing
    await ctx.db.patch(billing._id, {
      storageUsed: Math.max(0, newStorageUsed), // Ensure it doesn't go below 0
      lastUpdated: Date.now(),
    });

    // Record transaction
    await ctx.db.insert("storageTransactions", {
      userId,
      fileId: args.fileId,
      sizeBytes: operationType === "file_upload" ? sizeBytes : -sizeBytes,
      operationType,
      filename: args.filename,
      createdAt: Date.now(),
    });

    return newStorageUsed;
  },
});

// Update user limits (for upgrades)
export const updateUserLimits = mutation({
  args: {
    userId: v.string(),
    tokensLimit: v.optional(v.number()),
    storageLimit: v.optional(v.number()),
    subscriptionType: v.optional(v.union(v.literal("free"), v.literal("paid"))),
  },
  handler: async (ctx, { userId, tokensLimit, storageLimit, subscriptionType }) => {
    const billing = await ctx.db
      .query("userBilling")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!billing) {
      throw new Error("User billing not initialized");
    }

    const updates: any = { lastUpdated: Date.now() };

    if (tokensLimit !== undefined) updates.tokensLimit = tokensLimit;
    if (storageLimit !== undefined) updates.storageLimit = storageLimit;
    if (subscriptionType !== undefined) updates.subscriptionType = subscriptionType;

    await ctx.db.patch(billing._id, updates);

    return billing._id;
  },
});

// Get usage history for a user
export const getUserUsageHistory = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 50 }) => {
    const tokenTransactions = await ctx.db
      .query("tokenTransactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    const storageTransactions = await ctx.db
      .query("storageTransactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return {
      tokenTransactions,
      storageTransactions,
    };
  },
});

// Reset user tokens (for monthly resets)
export const resetUserTokens = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const billing = await ctx.db
      .query("userBilling")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!billing) {
      throw new Error("User billing not initialized");
    }

    await ctx.db.patch(billing._id, {
      tokensUsed: 0,
      nextResetDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
      lastUpdated: Date.now(),
    });

    return billing._id;
  },
});

// Upgrade user limits (converted from API route)
export const upgradeUser = mutation({
  args: {
    userId: v.string(),
    tokensToAdd: v.number(),
    storageToAdd: v.number(),
    subscriptionType: v.optional(v.union(v.literal("free"), v.literal("paid"))),
  },
  handler: async (ctx, { userId, tokensToAdd, storageToAdd, subscriptionType }) => {
    // Validate inputs
    if (tokensToAdd < 1000 || tokensToAdd > 100000) {
      throw new Error("Tokens to add must be between 1,000 and 100,000");
    }
    if (storageToAdd < 0 || storageToAdd > 10 * 1024 * 1024 * 1024) {
      throw new Error("Storage to add must be between 0 and 10GB");
    }

    const billing = await ctx.db
      .query("userBilling")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!billing) {
      throw new Error("User billing not initialized");
    }

    // Calculate pricing (simplified - in real app you'd integrate with Stripe)
    const tokenCost = Math.ceil(tokensToAdd / PRICING.TOKENS_PER_DOLLAR) * 1; // $1 per configured tokens
    const storageCost = Math.ceil(storageToAdd / (PRICING.STORAGE_MB_PER_DOLLAR * 1024 * 1024)) * 1; // $1 per configured storage
    const totalCost = tokenCost + storageCost;

    const newTokenLimit = billing.tokensLimit + tokensToAdd;
    const newStorageLimit = billing.storageLimit + storageToAdd;

    // Update user limits
    await ctx.db.patch(billing._id, {
      tokensLimit: newTokenLimit,
      storageLimit: newStorageLimit,
      subscriptionType: subscriptionType || billing.subscriptionType,
      lastUpdated: Date.now(),
    });

    return {
      success: true,
      cost: totalCost,
      newLimits: {
        tokens: newTokenLimit,
        storage: newStorageLimit,
      },
    };
  },
});