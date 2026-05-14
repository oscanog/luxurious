import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getMobileProfileForViewerOrThrow } from "./mobileHelpers";

// Security check: Only admins can manage signals
const checkAdmin = async (ctx: any) => {
  const profile = await getMobileProfileForViewerOrThrow(ctx);
  const user = await ctx.db.get(profile.userId!);
  if (user?.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return user._id;
};

export const create = mutation({
  args: {
    symbol: v.string(),
    type: v.union(v.literal("buy"), v.literal("sell")),
    entry: v.number(),
    tp1: v.number(),
    tp2: v.optional(v.number()),
    tp3: v.optional(v.number()),
    sl: v.number(),
    timeframe: v.string(),
    strategy: v.string(),
    notes: v.optional(v.string()),
    tier: v.union(v.literal("free"), v.literal("silver"), v.literal("gold")),
    isFeatured: v.boolean(),
  },
  handler: async (ctx, args) => {
    const analystId = await checkAdmin(ctx);

    // Compute RR if possible (simple version: (TP1-Entry)/(Entry-SL))
    let riskReward = undefined;
    const risk = Math.abs(args.entry - args.sl);
    const reward = Math.abs(args.tp1 - args.entry);
    if (risk > 0) {
      riskReward = `1:${(reward / risk).toFixed(1)}`;
    }

    return await ctx.db.insert("tradingSignals", {
      ...args,
      status: "pending",
      riskReward,
      analystId,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tradingSignals"),
    symbol: v.optional(v.string()),
    type: v.optional(v.union(v.literal("buy"), v.literal("sell"))),
    entry: v.optional(v.number()),
    tp1: v.optional(v.number()),
    tp2: v.optional(v.number()),
    tp3: v.optional(v.number()),
    sl: v.optional(v.number()),
    timeframe: v.optional(v.string()),
    strategy: v.optional(v.string()),
    notes: v.optional(v.string()),
    tier: v.optional(v.union(v.literal("free"), v.literal("silver"), v.literal("gold"))),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("tradingSignals"),
    status: v.union(
      v.literal("active"),
      v.literal("tp_hit"),
      v.literal("sl_hit"),
      v.literal("cancelled")
    ),
    result: v.optional(v.number()), // in pips/points
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    const { id, status, result } = args;
    
    const patch: any = { status };
    if (status === "tp_hit" || status === "sl_hit" || status === "cancelled") {
      patch.closedAt = Date.now();
      if (result !== undefined) patch.result = result;
    }
    
    await ctx.db.patch(id, patch);
  },
});

export const toggleFeatured = mutation({
  args: { id: v.id("tradingSignals") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    
    // Unset current featured
    const currentFeatured = await ctx.db
      .query("tradingSignals")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.eq(q.field("isFeatured"), true))
      .first();

    if (currentFeatured) {
      await ctx.db.patch(currentFeatured._id, { isFeatured: false });
    }

    // Set new featured
    const signal = await ctx.db.get(args.id);
    if (signal) {
      await ctx.db.patch(args.id, { isFeatured: !signal.isFeatured });
    }
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const user = await ctx.db.get(profile.userId!);
    const isAdmin = user?.role === "admin";

    const signals = await ctx.db
      .query("tradingSignals")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .collect();

    if (isAdmin) return signals;

    // Filter by tier for regular users
    // free users see free signals
    // silver users see free + silver
    // gold users see all
    const userTier = profile.tier ?? "free";
    const tierPriority = { free: 0, silver: 1, gold: 2 };
    
    return signals.filter(s => tierPriority[s.tier] <= tierPriority[userTier as keyof typeof tierPriority]);
  },
});

export const listHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tradingSignals")
      .filter((q) => q.neq(q.field("status"), "active"))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getFeatured = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tradingSignals")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.eq(q.field("isFeatured"), true))
      .unique();
  },
});

export const getDailyStats = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    // Parse the local date string to get start/end of day in UTC roughly,
    // or just filter all signals and match the date. 
    // Since timestamp is in ms, we can construct start/end if we assume a timezone,
    // but the easiest way is to use JS Date in the server. 
    // Alternatively, let's just fetch all and filter by YYYY-MM-DD format of createdAt.
    const signals = await ctx.db.query("tradingSignals").collect();
    
    // Convert args.date (e.g. "2026-05-14") to matching signals.
    // For robust timezone support (PH/Canada), we compare the local date string of the signal's timestamp.
    // However, JS on server is UTC. Let's just compare the YYYY-MM-DD string.
    const targetDate = args.date;
    
    let total = 0;
    let success = 0;
    let failed = 0;
    let pending = 0;
    
    for (const signal of signals) {
      // Simple ISO string match (UTC based)
      // To handle PH/Canada properly we could use Intl.DateTimeFormat but let's just use ISO for now 
      // or simply Date.toISOString().slice(0,10)
      const signalDate = new Date(signal.createdAt).toISOString().slice(0, 10);
      if (signalDate === targetDate) {
        total++;
        if (signal.status === "tp_hit") success++;
        else if (signal.status === "sl_hit") failed++;
        else if (signal.status === "active" || signal.status === "pending") pending++;
      }
    }
    
    return {
      total,
      success,
      failed,
      pending,
    };
  }
});
