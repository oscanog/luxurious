"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { ActionCtx, internalAction } from "./_generated/server";
import { embedQuery } from "./aiEmbeddings";

const sourceTableValidator = v.union(
  v.literal("networkMembers"),
  v.literal("memberAssets"),
  v.literal("financialAccounts"),
  v.literal("financialTransactions"),
  v.literal("academyLessons"),
  v.literal("aiKnowledgeChunks"),
);

const VECTOR_DIMENSION = 1536;
const SOURCE_TABLES = [
  "networkMembers",
  "memberAssets",
  "financialAccounts",
  "financialTransactions",
  "academyLessons",
  "aiKnowledgeChunks",
] as const;

function checksum(text: string) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function embeddingModelName() {
  return process.env.AI_EMBEDDING_MODEL ?? "unknown";
}

async function embedOne(
  ctx: ActionCtx,
  args: { table: (typeof SOURCE_TABLES)[number]; sourceId: string },
) {
  const record = await ctx.runQuery(
    internal.aiDbEmbeddings.getRecordForEmbedding,
    {
      table: args.table,
      sourceId: args.sourceId,
    },
  );

  if (!record) {
    await ctx.runMutation(internal.aiDbEmbeddings.deleteEmbedding, args);
    return { status: "deleted" as const };
  }

  const embedding = await embedQuery(record.content);
  if (!embedding) {
    return { status: "skipped" as const, reason: "embedding unavailable" };
  }
  if (embedding.length !== VECTOR_DIMENSION) {
    return {
      status: "skipped" as const,
      reason: `embedding dimension ${embedding.length} != ${VECTOR_DIMENSION}`,
    };
  }

  await ctx.runMutation(internal.aiDbEmbeddings.upsertEmbedding, {
    ...record,
    embedding,
    embeddingModel: embeddingModelName(),
    embeddingDimension: embedding.length,
    checksum: checksum(record.content),
  });

  return {
    status: "embedded" as const,
    table: args.table,
    sourceId: args.sourceId,
  };
}

export const embedRecord = internalAction({
  args: {
    table: sourceTableValidator,
    sourceId: v.string(),
  },
  handler: async (ctx, args) => {
    return await embedOne(ctx, args);
  },
});

export const deleteRecordEmbedding = internalAction({
  args: {
    table: sourceTableValidator,
    sourceId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.aiDbEmbeddings.deleteEmbedding, args);
    return { status: "deleted" as const };
  },
});

export const backfillBatch = internalAction({
  args: {
    limitPerTable: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limitPerTable ?? 20, 1), 50);
    const summary: Record<string, number> = {};

    for (const table of SOURCE_TABLES) {
      const records = await ctx.runQuery(
        internal.aiDbEmbeddings.listRecordsForBackfill,
        {
          table,
          limit,
        },
      );
      summary[table] = records.length;
      for (const record of records) {
        await embedOne(ctx, {
          table: record.table,
          sourceId: record.sourceId,
        });
      }
    }

    return summary;
  },
});
