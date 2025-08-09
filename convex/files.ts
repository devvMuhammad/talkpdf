import { action, mutation, query } from "./_generated/server"
import { v } from "convex/values";

// Per Convex docs, generate upload URLs from a mutation so you can gate who can upload.
// https://docs.convex.dev/file-storage/upload-files
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveFile = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    size: v.number(),
    type: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const fileId = await ctx.db.insert("files", {
      name: args.name,
      size: args.size,
      type: args.type,
      storageId: args.storageId,
      userId: args.userId,
      createdAt: now,
    });
    return fileId;
  },
});

export const getDownloadUrls = query({
  args: { fileIds: v.array(v.id("files")) },
  handler: async (ctx, { fileIds }) => {
    const results: Array<{
      fileId: string;
      url: string;
      name: string;
      size: number;
      type: string;
    }> = [];
    for (const fileId of fileIds) {
      const file = await ctx.db.get(fileId);
      if (!file) continue;
      const url = await ctx.storage.getUrl(file.storageId);
      if (!url) continue;
      results.push({
        fileId,
        url,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }
    return results;
  },
});

export const getById = query({
  args: { id: v.id("files") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// Optional simple indexing action without streaming progress; just returns when done.
// (indexFiles moved to convex/indexing.ts)


