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
    session: v.union(v.literal("london"), v.literal("new_york"), v.literal("asia"), v.literal("custom")),
    dayOfWeek: v.number(),
    time: v.string(),
    timezone: v.string(),
    analystName: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    return await ctx.db.insert("signalSchedules", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("signalSchedules"),
    title: v.optional(v.string()),
    session: v.optional(v.union(v.literal("london"), v.literal("new_york"), v.literal("asia"), v.literal("custom"))),
    dayOfWeek: v.optional(v.number()),
    time: v.optional(v.string()),
    timezone: v.optional(v.string()),
    analystName: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const toggleActive = mutation({
  args: { id: v.id("signalSchedules") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    const schedule = await ctx.db.get(args.id);
    if (schedule) {
      await ctx.db.patch(args.id, { isActive: !schedule.isActive });
    }
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("signalSchedules")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();
  },
});
