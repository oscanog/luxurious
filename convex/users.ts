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

export const getOrgTree = query({
  args: {},
  handler: async (ctx) => {
    const viewerId = await getAuthUserId(ctx);
    if (!viewerId) return null;

    const allUsers = await ctx.db.query("users").collect();
    
    // Build tree
    const childrenByParent = new Map<string, typeof allUsers>();

    for (const user of allUsers) {
      const parentKey = user.uplineId ?? "root";
      const list = childrenByParent.get(parentKey) ?? [];
      list.push(user);
      childrenByParent.set(parentKey, list);
    }

    function buildNode(user: typeof allUsers[0]): any {
      const children = childrenByParent.get(user._id) ?? [];
      const downlinesCount = countDescendants(user._id);
      
      return {
        id: user._id,
        name: user.name ?? "Unknown",
        roleTitle: user.role === "admin" ? "Admin" : "Member",
        status: "joined",
        isViewer: user._id === viewerId,
        member: {
          id: user._id,
          name: user.name ?? "Unknown",
          email: user.email ?? "",
          roleTitle: user.role === "admin" ? "Admin" : "Member",
          rank: user.role === "admin" ? "Master" : "Beginner",
          status: "joined",
          avatarInitials: (user.name ?? "??").substring(0, 2).toUpperCase(),
          totalDownlines: downlinesCount,
          invitedCount: 0,
          pendingCount: 0,
          uplineId: user.uplineId ?? null,
          lastUplineId: user.lastUplineId ?? null,
        },
        children: children.map(buildNode),
      };
    }

    function countDescendants(userId: string): number {
      const children = childrenByParent.get(userId) ?? [];
      return children.reduce((sum, child) => sum + 1 + countDescendants(child._id), 0);
    }

    const roots = childrenByParent.get("root") ?? [];
    return {
      tree: roots.map(buildNode),
    };
  },
});
