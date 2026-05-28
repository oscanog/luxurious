import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { action, internalMutation, mutation, query } from "./_generated/server";

const ROOT_ADMIN_EMAIL = "admin@luxurious.trade";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function assertValidEmail(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Invalid email address.");
  }
}

function isRootOrAdmin(user: { email?: string; role?: string } | null) {
  return user?.email === ROOT_ADMIN_EMAIL || user?.role === "admin";
}

type UpdateUserEmailResult = {
  success: true;
  userId: Id<"users">;
  oldEmail: string;
  newEmail: string;
  name: string;
  patchedMemberCount: number;
  invalidatedSessionCount: number;
};

export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const user = await ctx.db.get("users", userId);
    return isRootOrAdmin(user);
  },
});

export const updateUserEmail = action({
  args: {
    userId: v.optional(v.id("users")),
    memberId: v.optional(v.id("networkMembers")),
    newEmail: v.string(),
  },
  handler: async (ctx, args): Promise<UpdateUserEmailResult> => {
    const adminUserId = await getAuthUserId(ctx);
    if (!adminUserId) {
      throw new Error("Not authenticated");
    }

    return await ctx.runMutation(internal.admin.updateUserEmailInternal, {
      adminUserId,
      userId: args.userId,
      memberId: args.memberId,
      newEmail: args.newEmail,
    });
  },
});

export const updateUserEmailInternal = internalMutation({
  args: {
    adminUserId: v.id("users"),
    userId: v.optional(v.id("users")),
    memberId: v.optional(v.id("networkMembers")),
    newEmail: v.string(),
  },
  handler: async (ctx, args): Promise<UpdateUserEmailResult> => {
    const admin = await ctx.db.get("users", args.adminUserId);
    if (!isRootOrAdmin(admin)) {
      throw new Error("Admin access required.");
    }

    const newEmail = normalizeEmail(args.newEmail);
    assertValidEmail(newEmail);

    if (!args.userId && !args.memberId) {
      throw new Error("User or member required.");
    }

    let memberName = "";
    let targetMemberId: Id<"networkMembers"> | undefined;
    let targetUserId: Id<"users"> | undefined = args.userId;
    if (args.memberId) {
      const member = await ctx.db.get("networkMembers", args.memberId);
      if (!member) {
        throw new Error("Member not found.");
      }
      targetMemberId = member._id;
      if (targetUserId && member.userId && targetUserId !== member.userId) {
        throw new Error("User and member do not match.");
      }
      if (!targetUserId) {
        targetUserId = member.userId;
      }
      if (!targetUserId && member.email) {
        const memberEmail = normalizeEmail(member.email);
        const usersByMemberEmail = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", memberEmail))
          .take(2);
        if (usersByMemberEmail.length === 1) {
          targetUserId = usersByMemberEmail[0]._id;
        }
      }
      if (!targetUserId) {
        const usersByMemberName = await ctx.db
          .query("users")
          .withIndex("by_name", (q) => q.eq("name", member.name))
          .take(2);
        if (usersByMemberName.length !== 1) {
          throw new Error("Member has no safely linked user account.");
        }
        targetUserId = usersByMemberName[0]._id;
      }
      memberName = member.name;
    }

    if (!targetUserId) {
      throw new Error("User required.");
    }

    const user = await ctx.db.get("users", targetUserId);
    if (!user) {
      throw new Error("User not found.");
    }
    if (!user.email) {
      throw new Error("User has no email on record.");
    }

    const oldEmail = normalizeEmail(user.email);
    if (oldEmail === newEmail) {
      throw new Error("Email is unchanged.");
    }

    const existingUsers = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", newEmail))
      .take(2);
    if (existingUsers.some((row) => row._id !== targetUserId)) {
      throw new Error("Email already in use by another account.");
    }

    const duplicatePasswordAccounts = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", newEmail),
      )
      .take(2);
    if (duplicatePasswordAccounts.length > 0) {
      throw new Error("Email already has a password login account.");
    }

    const passwordAccounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", targetUserId).eq("provider", "password"),
      )
      .take(10);
    const targetAccounts = passwordAccounts.filter(
      (account) => normalizeEmail(account.providerAccountId) === oldEmail,
    );
    if (targetAccounts.length !== 1) {
      throw new Error("Existing password login account not found.");
    }

    const now = Date.now();
    const patchedMemberIds = new Set<Id<"networkMembers">>();

    if (targetMemberId) {
      await ctx.db.patch("networkMembers", targetMemberId, {
        userId: targetUserId,
        email: newEmail,
        updatedAt: now,
      });
      patchedMemberIds.add(targetMemberId);
    }

    for await (const member of ctx.db
      .query("networkMembers")
      .withIndex("by_userId", (q) => q.eq("userId", targetUserId))) {
      if (member._id === targetMemberId) {
        continue;
      }
      await ctx.db.patch("networkMembers", member._id, {
        email: newEmail,
        updatedAt: now,
      });
      patchedMemberIds.add(member._id);
      memberName = memberName || member.name;
    }

    for await (const member of ctx.db
      .query("networkMembers")
      .withIndex("by_email", (q) => q.eq("email", oldEmail))) {
      if (member.userId !== undefined) {
        continue;
      }
      await ctx.db.patch("networkMembers", member._id, {
        email: newEmail,
        updatedAt: now,
      });
      patchedMemberIds.add(member._id);
    }

    const passwordAccount = targetAccounts[0];
    if (!passwordAccount) {
      throw new Error("Existing password login account not found.");
    }

    await ctx.db.patch("authAccounts", passwordAccount._id, {
      providerAccountId: newEmail,
    });
    await ctx.db.patch("users", targetUserId, {
      email: newEmail,
    });

    let invalidatedSessionCount = 0;
    for await (const session of ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", targetUserId))) {
      for await (const token of ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", session._id))) {
        await ctx.db.delete("authRefreshTokens", token._id);
      }
      await ctx.db.delete("authSessions", session._id);
      invalidatedSessionCount += 1;
    }

    for (const memberId of patchedMemberIds) {
      await ctx.scheduler.runAfter(0, internal.aiDbEmbeddingActions.embedRecord, {
        table: "networkMembers",
        sourceId: memberId,
      });
    }

    return {
      success: true,
      userId: targetUserId,
      oldEmail,
      newEmail,
      name: memberName || user.name || newEmail,
      patchedMemberCount: patchedMemberIds.size,
      invalidatedSessionCount,
    };
  },
});


export const setAdminStatus = mutation({
  args: { userId: v.id("users"), status: v.boolean() },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");
    const currentUser = await ctx.db.get("users", currentUserId);
    
    // Only existing admins can promote others
    if (!isRootOrAdmin(currentUser)) {
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
    if (!isRootOrAdmin(user)) return null;

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
    if (!isRootOrAdmin(user)) return [];

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
    if (!isRootOrAdmin(currentUser)) {
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
    if (!isRootOrAdmin(user)) return [];

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
    if (!isRootOrAdmin(currentUser)) {
      throw new Error("Unauthorized");
    }

    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      if (user.uplineId !== null) {
        await ctx.db.patch("users", user._id, { uplineId: null });
      }
    }
  },
});
