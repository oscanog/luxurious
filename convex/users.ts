import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get("users", userId);
  },
});

export const listWithHierarchy = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db.query("users").collect();
  },
});

export const setUpline = mutation({
  args: { userId: v.id("users"), uplineId: v.id("users") },
  handler: async (ctx, args) => {
    const viewerId = await getAuthUserId(ctx);
    if (!viewerId) throw new Error("Not authenticated");

    if (args.userId === args.uplineId) throw new Error("Cannot report to self");

    const user = await ctx.db.get("users", args.userId);
    if (!user) throw new Error("User not found");
    
    // Store current as last before update
    const currentUplineId = user.uplineId;
    await ctx.db.patch("users", args.userId, { 
      uplineId: args.uplineId,
      lastUplineId: currentUplineId || undefined 
    });
  },
});

export const removeUpline = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const viewerId = await getAuthUserId(ctx);
    if (!viewerId) throw new Error("Not authenticated");

    const user = await ctx.db.get("users", args.userId);
    if (!user) throw new Error("User not found");
    
    await ctx.db.patch("users", args.userId, { 
      uplineId: null,
      lastUplineId: user.uplineId 
    });
  },
});
