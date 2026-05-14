import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getMobileProfileForViewerOrThrow } from "./mobileHelpers";

export const getTickets = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    return await ctx.db
      .query("tickets")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .order("desc")
      .collect();
  },
});

export const createTicket = mutation({
  args: {
    subject: v.string(),
    message: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    return await ctx.db.insert("tickets", {
      ...args,
      profileId: profile._id,
      status: "open",
      createdAt: Date.now(),
    });
  },
});

export const closeTicket = mutation({
  args: { id: v.id("tickets") },
  handler: async (ctx, args) => {
    await ctx.db.patch("tickets", args.id, { status: "closed" });
  },
});
