import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const user = await ctx.db.get(userId);
    // Hardcoded check for first admin or property check
    return user?.email === "admin@luxurious.trade" || (user as any)?.isAdmin === true;
  },
});

export const setAdminStatus = mutation({
  args: { userId: v.id("users"), status: v.boolean() },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");
    const currentUser = await ctx.db.get(currentUserId);
    
    // Only existing admins can promote others
    if (currentUser?.email !== "admin@luxurious.trade" && !(currentUser as any)?.isAdmin) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.userId, { isAdmin: args.status } as any);
  },
});

export const getPlatformStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (user?.email !== "admin@luxurious.trade" && !(user as any)?.isAdmin) return null;

    const totalTrades = await ctx.db.query("trades").collect();
    const totalUsers = await ctx.db.query("users").collect();
    const openPositions = totalTrades.filter(t => t.status === "open").length;
    
    return {
      userCount: totalUsers.length,
      tradeCount: totalTrades.length,
      openPositions,
    };
  },
});

export const getUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (user?.email !== "admin@luxurious.trade" && !(user as any)?.isAdmin) return [];

    const users = await ctx.db.query("users").collect();
    const wallets = await ctx.db.query("wallets").collect();

    return users.map(u => ({
      ...u,
      balance: wallets.find(w => w.userId === u._id)?.balance ?? 0,
    }));
  },
});

export const resetBalance = mutation({
  args: { userId: v.id("users"), amount: v.number() },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");
    const currentUser = await ctx.db.get(currentUserId);
    if (currentUser?.email !== "admin@luxurious.trade" && !(currentUser as any)?.isAdmin) {
      throw new Error("Unauthorized");
    }

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (wallet) {
      await ctx.db.patch(wallet._id, { balance: args.amount });
    } else {
      await ctx.db.insert("wallets", { userId: args.userId, balance: args.amount });
    }
  },
});

export const getAllTrades = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (user?.email !== "admin@luxurious.trade" && !(user as any)?.isAdmin) return [];

    const trades = await ctx.db.query("trades").order("desc").collect();
    const users = await ctx.db.query("users").collect();

    return trades.map(t => ({
      ...t,
      userName: users.find(u => u._id === t.userId)?.name ?? "Unknown",
      userEmail: users.find(u => u._id === t.userId)?.email ?? "Unknown",
    }));
  },
});
