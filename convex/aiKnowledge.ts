import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  MutationCtx,
  QueryCtx,
} from "./_generated/server";
import { getUserAdminLevel } from "./orgAccess";

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  const user = await ctx.db.get("users", userId);
  if (getUserAdminLevel(user) < 1) {
    throw new Error("Admin access required.");
  }
  return user;
}

async function deleteEmbeddingForChunk(
  ctx: MutationCtx,
  chunkId: Id<"aiKnowledgeChunks">,
) {
  const embedding = await ctx.db
    .query("aiDbEmbeddings")
    .withIndex("by_table_and_sourceId", (q) =>
      q.eq("table", "aiKnowledgeChunks").eq("sourceId", chunkId),
    )
    .unique();
  if (embedding) {
    await ctx.db.delete("aiDbEmbeddings", embedding._id);
  }
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const listDocuments = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const documents = await ctx.db
      .query("aiKnowledgeDocuments")
      .withIndex("by_createdAt")
      .order("desc")
      .take(100);

    return await Promise.all(
      documents.map(async (document) => ({
        ...document,
        fileUrl: await ctx.storage.getUrl(document.storageId),
      })),
    );
  },
});

export const deleteDocument = mutation({
  args: {
    documentId: v.id("aiKnowledgeDocuments"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const document = await ctx.db.get("aiKnowledgeDocuments", args.documentId);
    if (!document) {
      throw new Error("Document not found.");
    }

    const chunks = await ctx.db
      .query("aiKnowledgeChunks")
      .withIndex("by_documentId", (q) => q.eq("documentId", args.documentId))
      .collect();

    for (const chunk of chunks) {
      await deleteEmbeddingForChunk(ctx, chunk._id);
      await ctx.db.delete("aiKnowledgeChunks", chunk._id);
    }

    await ctx.storage.delete(document.storageId);
    await ctx.db.delete("aiKnowledgeDocuments", document._id);
    return { success: true, deletedChunks: chunks.length };
  },
});

export const requireAdminForAction = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get("users", args.userId);
    if (getUserAdminLevel(user) < 1) {
      throw new Error("Admin access required.");
    }
    return { userId: args.userId };
  },
});

export const createPendingDocument = internalMutation({
  args: {
    title: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    fileSize: v.number(),
    storageId: v.id("_storage"),
    uploadedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("aiKnowledgeDocuments", {
      title: args.title,
      fileName: args.fileName,
      mimeType: args.mimeType,
      fileSize: args.fileSize,
      storageId: args.storageId,
      status: "pending",
      chunkCount: 0,
      extractedCharCount: 0,
      uploadedBy: args.uploadedBy,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const completeDocumentIngestion = internalMutation({
  args: {
    documentId: v.id("aiKnowledgeDocuments"),
    chunks: v.array(v.string()),
    extractedCharCount: v.number(),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get("aiKnowledgeDocuments", args.documentId);
    if (!document) {
      throw new Error("Document not found.");
    }

    const existingChunks = await ctx.db
      .query("aiKnowledgeChunks")
      .withIndex("by_documentId", (q) => q.eq("documentId", args.documentId))
      .collect();
    for (const chunk of existingChunks) {
      await deleteEmbeddingForChunk(ctx, chunk._id);
      await ctx.db.delete("aiKnowledgeChunks", chunk._id);
    }

    const now = Date.now();
    for (let index = 0; index < args.chunks.length; index += 1) {
      const chunkId = await ctx.db.insert("aiKnowledgeChunks", {
        documentId: args.documentId,
        chunkIndex: index,
        title: `${document.title} chunk ${index + 1}`,
        content: args.chunks[index],
        createdAt: now,
      });
      await ctx.scheduler.runAfter(
        0,
        internal.aiDbEmbeddingActions.embedRecord,
        {
          table: "aiKnowledgeChunks",
          sourceId: chunkId,
        },
      );
    }

    await ctx.db.patch("aiKnowledgeDocuments", args.documentId, {
      status: "ready",
      chunkCount: args.chunks.length,
      extractedCharCount: args.extractedCharCount,
      error: undefined,
      updatedAt: now,
    });

    return { success: true, chunkCount: args.chunks.length };
  },
});

export const failDocumentIngestion = internalMutation({
  args: {
    documentId: v.id("aiKnowledgeDocuments"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("aiKnowledgeDocuments", args.documentId, {
      status: "failed",
      error: args.error,
      updatedAt: Date.now(),
    });
  },
});
