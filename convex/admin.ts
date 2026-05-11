import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const user = await ctx.db.get("users", userId);
    return user?.email === "admin@luxurious.trade" || user?.role === "admin";
  },
});


export const setAdminStatus = mutation({
  args: { userId: v.id("users"), status: v.boolean() },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");
    const currentUser = await ctx.db.get("users", currentUserId);
    
    // Only existing admins can promote others
    if (currentUser?.email !== "admin@luxurious.trade" && currentUser?.role !== "admin") {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch("users", args.userId, { role: args.status ? "admin" : "member" });
  },
});

export const getPlatformStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get("users", userId);
    if (user?.email !== "admin@luxurious.trade" && user?.role !== "admin") return null;

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
    const user = await ctx.db.get("users", userId);
    if (user?.email !== "admin@luxurious.trade" && user?.role !== "admin") return [];

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
    const currentUser = await ctx.db.get("users", currentUserId);
    if (currentUser?.email !== "admin@luxurious.trade" && currentUser?.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (wallet) {
      await ctx.db.patch("wallets", wallet._id, { balance: args.amount });
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
    const user = await ctx.db.get("users", userId);
    if (user?.email !== "admin@luxurious.trade" && user?.role !== "admin") return [];

    const trades = await ctx.db.query("trades").order("desc").collect();
    const users = await ctx.db.query("users").collect();

    return trades.map(t => {
      const user = users.find(u => u._id === t.userId);
      // Simple mock P/L for display
      const pnl = t.status === "closed" 
        ? ((t.exitPrice ?? 0) - t.entryPrice) * (t.side === "long" ? 1 : -1) * (t.amount / t.entryPrice)
        : (Math.random() - 0.5) * 200; // Floating mock

      return {
        ...t,
        userName: user?.name ?? "Unknown",
        userEmail: user?.email ?? "Unknown",
        pnl,
      };
    });
  },
});

export const clearAllConnections = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");
    const currentUser = await ctx.db.get("users", currentUserId);
    if (currentUser?.email !== "admin@luxurious.trade" && currentUser?.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      if (user.uplineId !== null) {
        await ctx.db.patch(user._id, { uplineId: null });
      }
    }
  },
});
