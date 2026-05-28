import { mutation, query, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  getDefaultAccount,
  getMobileProfileForViewerOrThrow,
} from "./mobileHelpers";

async function createTransaction(
  ctx: MutationCtx,
  args: {
    kind: "income" | "expense";
    amount: number;
    category: string;
    note?: string;
    occurredAt?: number;
  },
) {
  const profile = await getMobileProfileForViewerOrThrow(ctx);
  const account = await getDefaultAccount(ctx, profile._id, args.kind);
  if (!account) {
    throw new Error("No financial account available.");
  }

  const amount = Math.abs(args.amount);
  const transactionId = await ctx.db.insert("financialTransactions", {
    profileId: profile._id,
    accountId: account._id,
    kind: args.kind,
    category: args.category,
    note: args.note,
    amount,
    occurredAt: args.occurredAt ?? Date.now(),
    currencyCode: account.currencyCode,
    source: "manual",
    createdAt: Date.now(),
  });

  const nextBalance =
    args.kind === "income" ? account.balance + amount : account.balance - amount;
  await ctx.db.patch("financialAccounts", account._id, {
    balance: nextBalance,
    updatedAt: Date.now(),
  });
  await ctx.scheduler.runAfter(0, internal.aiDbEmbeddingActions.embedRecord, {
    table: "financialTransactions",
    sourceId: transactionId,
  });
  await ctx.scheduler.runAfter(0, internal.aiDbEmbeddingActions.embedRecord, {
    table: "financialAccounts",
    sourceId: account._id,
  });

  return { id: transactionId, accountId: account._id };
}

export const listHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const accounts = await ctx.db
      .query("financialAccounts")
      .withIndex("by_profileId_and_sortOrder", (q) => q.eq("profileId", profile._id))
      .take(20);
    const accountById = new Map(accounts.map((account) => [account._id, account]));
    const transactions = await ctx.db
      .query("financialTransactions")
      .withIndex("by_profileId_and_occurredAt", (q) => q.eq("profileId", profile._id))
      .order("desc")
      .take(Math.min(args.limit ?? 50, 100));

    return transactions.map((transaction) => ({
      id: transaction._id,
      title: transaction.note && transaction.note.trim().length > 0
        ? transaction.note
        : transaction.category,
      category: transaction.category,
      kind: transaction.kind,
      amount: transaction.amount,
      occurredAt: transaction.occurredAt,
      accountName: accountById.get(transaction.accountId)?.name ?? "Account",
    }));
  },
});

export const createIncome = mutation({
  args: {
    amount: v.number(),
    category: v.string(),
    note: v.optional(v.string()),
    occurredAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await createTransaction(ctx, {
      kind: "income",
      amount: args.amount,
      category: args.category,
      note: args.note,
      occurredAt: args.occurredAt,
    });
  },
});

export const createExpense = mutation({
  args: {
    amount: v.number(),
    category: v.string(),
    note: v.optional(v.string()),
    occurredAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await createTransaction(ctx, {
      kind: "expense",
      amount: args.amount,
      category: args.category,
      note: args.note,
      occurredAt: args.occurredAt,
    });
  },
});
