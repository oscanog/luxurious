import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  DEFAULT_CURRENCIES,
  formatMonthKey,
  getMobileProfileForViewerOrThrow,
  getMonthLabel,
  listAccountsForProfile,
} from "./mobileHelpers";

export const listAccounts = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const accounts = await listAccountsForProfile(ctx, profile._id);
    return accounts
      .filter((account) => !account.isArchived)
      .map((account) => ({
        id: account._id,
        name: account.name,
        bank: account.institution,
        balance: account.balance,
        type: account.type,
        currencyCode: account.currencyCode,
      }));
  },
});

export const createAccount = mutation({
  args: {
    name: v.string(),
    institution: v.string(),
    type: v.union(
      v.literal("savings"),
      v.literal("cash"),
      v.literal("credit"),
      v.literal("checking"),
      v.literal("investment"),
    ),
    openingBalance: v.number(),
    currencyCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const accounts = await listAccountsForProfile(ctx, profile._id);
    const accountId = await ctx.db.insert("financialAccounts", {
      profileId: profile._id,
      name: args.name,
      institution: args.institution,
      type: args.type,
      balance: args.openingBalance,
      currencyCode: args.currencyCode ?? "USD",
      sortOrder: accounts.length,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.aiDbEmbeddingActions.embedRecord, {
      table: "financialAccounts",
      sourceId: accountId,
    });
    return { id: accountId };
  },
});

export const getCashflow = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const transactions = await ctx.db
      .query("financialTransactions")
      .withIndex("by_profileId_and_occurredAt", (q) => q.eq("profileId", profile._id))
      .order("desc")
      .take(200);

    const grouped = new Map<
      string,
      { label: string; monthStart: number; inflow: number; outflow: number }
    >();

    for (const transaction of transactions) {
      const key = formatMonthKey(transaction.occurredAt);
      const existing = grouped.get(key) ?? {
        label: getMonthLabel(transaction.occurredAt),
        monthStart: transaction.occurredAt,
        inflow: 0,
        outflow: 0,
      };
      if (transaction.kind === "income") {
        existing.inflow += transaction.amount;
      } else {
        existing.outflow += transaction.amount;
      }
      grouped.set(key, existing);
    }

    const monthly = [...grouped.values()]
      .sort((a, b) => a.monthStart - b.monthStart)
      .slice(-4);

    return {
      monthly,
      totalInflow: monthly.reduce((sum, item) => sum + item.inflow, 0),
      totalOutflow: monthly.reduce((sum, item) => sum + item.outflow, 0),
    };
  },
});

export const listCurrencies = query({
  args: {},
  handler: async () => {
    return DEFAULT_CURRENCIES;
  },
});
