import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getWallet = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    
    // Auto-create wallet with 10,000 sim USD if missing
    if (!wallet) return { balance: 10000 };
    return wallet;
  },
});

export const initializeWallet = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!existing) {
      await ctx.db.insert("wallets", { userId, balance: 10000 });
    }
  },
});

// Mock Price Data Generation
export const getPriceHistory = query({
  args: { symbol: v.string() },
  handler: async (_ctx, { symbol }) => {
    // Generate 100 candles of dummy data
    const candles = [];
    let lastPrice = symbol === "BTC" ? 65000 : 3500;
    const now = Math.floor(Date.now() / 1000);
    
    for (let i = 0; i < 100; i++) {
      const time = now - (100 - i) * 3600; // 1h candles
      const change = (Math.random() - 0.5) * (lastPrice * 0.02);
      const open = lastPrice;
      const close = lastPrice + change;
      const high = Math.max(open, close) + Math.random() * (lastPrice * 0.005);
      const low = Math.min(open, close) - Math.random() * (lastPrice * 0.005);
      
      candles.push({ time, open, high, low, close });
      lastPrice = close;
    }
    return candles;
  },
});

export const openTrade = mutation({
  args: {
    symbol: v.string(),
    type: v.union(v.literal("buy"), v.literal("sell")),
    side: v.union(v.literal("long"), v.literal("short")),
    entryPrice: v.number(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!wallet || wallet.balance < args.amount) {
      throw new Error("Insufficient virtual balance");
    }

    // Deduct from wallet
    await ctx.db.patch("wallets", wallet._id, { balance: wallet.balance - args.amount });

    // Create trade
    return await ctx.db.insert("trades", {
      ...args,
      userId,
      status: "open",
      openedAt: Date.now(),
    });
  },
});

export const getOpenTrades = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("trades")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "open"))
      .collect();
  },
});
