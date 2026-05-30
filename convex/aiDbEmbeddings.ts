import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, internalQuery, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const sourceTableValidator = v.union(
  v.literal("networkMembers"),
  v.literal("memberAssets"),
  v.literal("financialAccounts"),
  v.literal("financialTransactions"),
  v.literal("academyLessons"),
  v.literal("aiKnowledgeChunks"),
);

type SourceTable =
  | "networkMembers"
  | "memberAssets"
  | "financialAccounts"
  | "financialTransactions"
  | "academyLessons"
  | "aiKnowledgeChunks";

type EmbeddableRecord = {
  table: SourceTable;
  sourceId: string;
  profileId?: Id<"mobileProfiles">;
  ownerUserId?: Id<"users">;
  title: string;
  content: string;
};

type AccessibleEmbeddingRow = {
  id: Id<"aiDbEmbeddings">;
  table: SourceTable;
  sourceId: string;
  title: string;
  content: string;
  updatedAt: number;
};

function fmtDate(ms: number | undefined | null) {
  return ms ? new Date(ms).toISOString().slice(0, 10) : "unknown";
}

async function profileOwner(ctx: QueryCtx, profileId: Id<"mobileProfiles">) {
  const profile = await ctx.db.get("mobileProfiles", profileId);
  return profile?.userId;
}

async function networkMemberRecord(
  ctx: QueryCtx,
  member: Doc<"networkMembers">,
): Promise<EmbeddableRecord> {
  const ownerUserId = await profileOwner(ctx, member.profileId);
  const parts = [
    `Network member: ${member.name}`,
    member.firstName ? `first name ${member.firstName}` : null,
    member.middleName ? `middle name ${member.middleName}` : null,
    member.lastName ? `last name ${member.lastName}` : null,
    `role ${member.roleTitle}`,
    `status ${member.status}`,
    member.email ? `email ${member.email}` : null,
    member.phone ? `phone ${member.phone}` : null,
    member.bonchatId ? `bonchat id ${member.bonchatId}` : null,
    member.bonchatUsername
      ? `bonchat username ${member.bonchatUsername}`
      : null,
    member.yepbitId ? `yepbit id ${member.yepbitId}` : null,
    member.yepbitUsername ? `yepbit username ${member.yepbitUsername}` : null,
    member.currentWork ? `work ${member.currentWork}` : null,
    member.birthday ? `birthday ${member.birthday}` : null,
    member.investmentStartedAt
      ? `investment started ${fmtDate(member.investmentStartedAt)}`
      : null,
  ].filter(Boolean);

  return {
    table: "networkMembers",
    sourceId: member._id,
    profileId: member.profileId,
    ownerUserId,
    title: member.name,
    content: parts.join(". "),
  };
}

async function memberAssetRecord(
  ctx: QueryCtx,
  asset: Doc<"memberAssets">,
): Promise<EmbeddableRecord | null> {
  const member = await ctx.db.get("networkMembers", asset.memberId);
  if (!member) return null;
  const ownerUserId = await profileOwner(ctx, member.profileId);
  return {
    table: "memberAssets",
    sourceId: asset._id,
    profileId: member.profileId,
    ownerUserId,
    title: `${member.name} ${asset.name}`,
    content: [
      `Org chart asset log for ${member.name}`,
      `asset ${asset.name}`,
      `value ${asset.currency} ${asset.value}`,
      `created ${fmtDate(asset.createdAt)}`,
      `member role ${member.roleTitle}`,
      `member status ${member.status}`,
    ].join(". "),
  };
}

async function financialAccountRecord(
  ctx: QueryCtx,
  account: Doc<"financialAccounts">,
): Promise<EmbeddableRecord> {
  const ownerUserId = await profileOwner(ctx, account.profileId);
  return {
    table: "financialAccounts",
    sourceId: account._id,
    profileId: account.profileId,
    ownerUserId,
    title: account.name,
    content: [
      `Financial account ${account.name}`,
      `institution ${account.institution}`,
      `type ${account.type}`,
      `balance ${account.currencyCode} ${account.balance}`,
      `archived ${account.isArchived}`,
    ].join(". "),
  };
}

async function financialTransactionRecord(
  ctx: QueryCtx,
  transaction: Doc<"financialTransactions">,
): Promise<EmbeddableRecord> {
  const account = await ctx.db.get("financialAccounts", transaction.accountId);
  const ownerUserId = await profileOwner(ctx, transaction.profileId);
  return {
    table: "financialTransactions",
    sourceId: transaction._id,
    profileId: transaction.profileId,
    ownerUserId,
    title: transaction.note ?? transaction.category,
    content: [
      `Financial transaction ${transaction.kind}`,
      `category ${transaction.category}`,
      transaction.note ? `note ${transaction.note}` : null,
      `amount ${transaction.currencyCode} ${transaction.amount}`,
      `occurred ${fmtDate(transaction.occurredAt)}`,
      account ? `account ${account.name}` : null,
      account ? `institution ${account.institution}` : null,
      `source ${transaction.source}`,
    ]
      .filter(Boolean)
      .join(". "),
  };
}

async function academyLessonRecord(
  ctx: QueryCtx,
  lesson: Doc<"academyLessons">,
): Promise<EmbeddableRecord> {
  const level = await ctx.db.get("academyLevels", lesson.levelId);
  return {
    table: "academyLessons",
    sourceId: lesson._id,
    title: `${lesson.slug} ${lesson.title}`,
    content: [
      `Academy lesson ${lesson.slug}: ${lesson.title}`,
      level ? `level ${level.title}` : null,
      `duration ${lesson.duration}`,
      lesson.content,
    ]
      .filter(Boolean)
      .join(". "),
  };
}

async function aiKnowledgeChunkRecord(
  ctx: QueryCtx,
  chunk: Doc<"aiKnowledgeChunks">,
): Promise<EmbeddableRecord | null> {
  const document = await ctx.db.get("aiKnowledgeDocuments", chunk.documentId);
  if (!document || document.status !== "ready") {
    return null;
  }
  return {
    table: "aiKnowledgeChunks",
    sourceId: chunk._id,
    title: chunk.title,
    content: [`AI knowledge document ${document.title}`, chunk.content].join(
      ". ",
    ),
  };
}

async function readSourceRecord(
  ctx: QueryCtx,
  table: SourceTable,
  sourceId: string,
): Promise<EmbeddableRecord | null> {
  if (table === "networkMembers") {
    const doc = await ctx.db.get(
      "networkMembers",
      sourceId as Id<"networkMembers">,
    );
    return doc ? await networkMemberRecord(ctx, doc) : null;
  }
  if (table === "memberAssets") {
    const doc = await ctx.db.get(
      "memberAssets",
      sourceId as Id<"memberAssets">,
    );
    return doc ? await memberAssetRecord(ctx, doc) : null;
  }
  if (table === "financialAccounts") {
    const doc = await ctx.db.get(
      "financialAccounts",
      sourceId as Id<"financialAccounts">,
    );
    return doc ? await financialAccountRecord(ctx, doc) : null;
  }
  if (table === "financialTransactions") {
    const doc = await ctx.db.get(
      "financialTransactions",
      sourceId as Id<"financialTransactions">,
    );
    return doc ? await financialTransactionRecord(ctx, doc) : null;
  }
  if (table === "aiKnowledgeChunks") {
    const doc = await ctx.db.get(
      "aiKnowledgeChunks",
      sourceId as Id<"aiKnowledgeChunks">,
    );
    return doc ? await aiKnowledgeChunkRecord(ctx, doc) : null;
  }
  const doc = await ctx.db.get(
    "academyLessons",
    sourceId as Id<"academyLessons">,
  );
  return doc ? await academyLessonRecord(ctx, doc) : null;
}

export const getRecordForEmbedding = internalQuery({
  args: {
    table: sourceTableValidator,
    sourceId: v.string(),
  },
  handler: async (ctx, args) => {
    return await readSourceRecord(ctx, args.table, args.sourceId);
  },
});

export const listRecordsForBackfill = internalQuery({
  args: {
    table: sourceTableValidator,
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 25, 1), 50);
    const records: EmbeddableRecord[] = [];

    if (args.table === "networkMembers") {
      const docs = await ctx.db.query("networkMembers").take(limit);
      for (const doc of docs) records.push(await networkMemberRecord(ctx, doc));
      return records;
    }
    if (args.table === "memberAssets") {
      const docs = await ctx.db.query("memberAssets").take(limit);
      for (const doc of docs) {
        const record = await memberAssetRecord(ctx, doc);
        if (record) records.push(record);
      }
      return records;
    }
    if (args.table === "financialAccounts") {
      const docs = await ctx.db.query("financialAccounts").take(limit);
      for (const doc of docs)
        records.push(await financialAccountRecord(ctx, doc));
      return records;
    }
    if (args.table === "financialTransactions") {
      const docs = await ctx.db.query("financialTransactions").take(limit);
      for (const doc of docs)
        records.push(await financialTransactionRecord(ctx, doc));
      return records;
    }
    if (args.table === "aiKnowledgeChunks") {
      const docs = await ctx.db.query("aiKnowledgeChunks").take(limit);
      for (const doc of docs) {
        const record = await aiKnowledgeChunkRecord(ctx, doc);
        if (record) records.push(record);
      }
      return records;
    }

    const docs = await ctx.db.query("academyLessons").take(limit);
    for (const doc of docs) records.push(await academyLessonRecord(ctx, doc));
    return records;
  },
});

export const getAccessibleByIds = internalQuery({
  args: {
    userId: v.id("users"),
    ids: v.array(v.id("aiDbEmbeddings")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get("users", args.userId);
    const isAdmin =
      user?.role === "admin" || user?.email === "admin@luxurious.trade";
    const profile = await ctx.db
      .query("mobileProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    const rows: AccessibleEmbeddingRow[] = [];
    for (const id of args.ids) {
      const row = await ctx.db.get("aiDbEmbeddings", id);
      if (!row) continue;
      const canRead =
        isAdmin ||
        !row.profileId ||
        row.profileId === profile?._id ||
        row.ownerUserId === args.userId;
      if (!canRead) continue;
      rows.push({
        id: row._id,
        table: row.table,
        sourceId: row.sourceId,
        title: row.title,
        content: row.content,
        updatedAt: row.updatedAt,
      });
    }
    return rows;
  },
});

export const upsertEmbedding = internalMutation({
  args: {
    table: sourceTableValidator,
    sourceId: v.string(),
    profileId: v.optional(v.id("mobileProfiles")),
    ownerUserId: v.optional(v.id("users")),
    title: v.string(),
    content: v.string(),
    embeddingModel: v.string(),
    embeddingDimension: v.number(),
    embedding: v.array(v.number()),
    checksum: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("aiDbEmbeddings")
      .withIndex("by_table_and_sourceId", (q) =>
        q.eq("table", args.table).eq("sourceId", args.sourceId),
      )
      .unique();

    const doc = {
      table: args.table,
      sourceId: args.sourceId,
      profileId: args.profileId,
      ownerUserId: args.ownerUserId,
      title: args.title,
      content: args.content,
      embeddingModel: args.embeddingModel,
      embeddingDimension: args.embeddingDimension,
      embedding: args.embedding,
      checksum: args.checksum,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch("aiDbEmbeddings", existing._id, doc);
      return existing._id;
    }
    return await ctx.db.insert("aiDbEmbeddings", doc);
  },
});

export const deleteEmbedding = internalMutation({
  args: {
    table: sourceTableValidator,
    sourceId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("aiDbEmbeddings")
      .withIndex("by_table_and_sourceId", (q) =>
        q.eq("table", args.table).eq("sourceId", args.sourceId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete("aiDbEmbeddings", existing._id);
    }
  },
});

export const purgeWrongDimension = internalMutation({
  args: {
    expectedDimension: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const expected = args.expectedDimension;
    const limit = Math.min(Math.max(args.limit ?? 200, 1), 500);
    const all = await ctx.db.query("aiDbEmbeddings").take(limit);
    let purged = 0;
    for (const row of all) {
      if (row.embeddingDimension !== expected) {
        await ctx.db.delete("aiDbEmbeddings", row._id);
        purged += 1;
      }
    }
    return { checked: all.length, purged };
  },
});

export const scheduleReembedAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "networkMembers",
      "memberAssets",
      "financialAccounts",
      "financialTransactions",
      "academyLessons",
      "aiKnowledgeChunks",
    ] as const;

    let scheduled = 0;
    for (const table of tables) {
      const docs = await ctx.db.query(table as any).take(50);
      for (const doc of docs) {
        await ctx.scheduler.runAfter(
          scheduled * 200,
          internal.aiDbEmbeddingActions.embedRecord,
          {
            table,
            sourceId: doc._id,
          },
        );
        scheduled += 1;
      }
    }
    return { scheduled };
  },
});
