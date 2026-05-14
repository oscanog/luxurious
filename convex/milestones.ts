import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getMobileProfileForViewerOrThrow } from "./mobileHelpers";

const checkAdmin = async (ctx: any) => {
  const profile = await getMobileProfileForViewerOrThrow(ctx);
  const user = await ctx.db.get(profile.userId!);
  if (user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
};

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    tier: v.union(v.literal("free"), v.literal("silver"), v.literal("gold")),
    requiredSignals: v.number(),
    requiredWinRate: v.optional(v.number()),
    sortOrder: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    return await ctx.db.insert("signalMilestones", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("signalMilestones"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    tier: v.optional(v.union(v.literal("free"), v.literal("silver"), v.literal("gold"))),
    requiredSignals: v.optional(v.number()),
    requiredWinRate: v.optional(v.number()),
    sortOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("signalMilestones")
      .withIndex("by_sortOrder")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});
