import { internalMutation, action, query, mutation } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { createAccount } from "@convex-dev/auth/server";
import { v } from "convex/values";

const SEED_USERS = [
  { name: "Alice Rivera",    email: "alice@luxurious.trade",   role: "admin"  as const, balance: 50000 },
  { name: "Bob Santos",      email: "bob@luxurious.trade",     role: "member" as const, balance: 10000 },
  { name: "Clara Mendoza",   email: "clara@luxurious.trade",   role: "member" as const, balance: 10000 },
  { name: "David Lim",       email: "david@luxurious.trade",   role: "member" as const, balance: 25000 },
  { name: "Eva Nakamura",    email: "eva@luxurious.trade",     role: "admin"  as const, balance: 75000 },
  { name: "Frank Torres",    email: "frank@luxurious.trade",   role: "member" as const, balance: 5000  },
  { name: "Grace Park",      email: "grace@luxurious.trade",   role: "member" as const, balance: 15000 },
  { name: "Henry Cruz",      email: "henry@luxurious.trade",   role: "member" as const, balance: 30000 },
];

const DEMO_HIERARCHY = [
  { email: "clara@luxurious.trade", uplineEmail: "alice@luxurious.trade" },
  { email: "david@luxurious.trade", uplineEmail: "alice@luxurious.trade" },
  { email: "frank@luxurious.trade", uplineEmail: "alice@luxurious.trade" },
  { email: "bob@luxurious.trade", uplineEmail: "clara@luxurious.trade" },
  { email: "grace@luxurious.trade", uplineEmail: "david@luxurious.trade" },
  { email: "henry@luxurious.trade", uplineEmail: "frank@luxurious.trade" },
] as const;

const DEMO_ROOT_EMAILS = [
  "alice@luxurious.trade",
  "eva@luxurious.trade",
] as const;

export const seedUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    let created = 0;
    let skipped = 0;

    for (const u of SEED_USERS) {
      const existing = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", u.email))
        .first();

      if (existing) { skipped++; continue; }

      const userId = await ctx.db.insert("users", {
        name: u.name,
        email: u.email,
        role: u.role,
      });

      await ctx.db.insert("wallets", { userId, balance: u.balance });
      created++;
    }

    return { created, skipped };
  },
});

export const ensureSeedUser = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
    balance: v.number(),
  },
  handler: async (ctx, args) => {
    const existingUsers = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .take(10);

    const user =
      existingUsers[0] ??
      {
        _id: await ctx.db.insert("users", {
          name: args.name,
          email: args.email,
          role: args.role,
        }),
      };

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!wallet) {
      await ctx.db.insert("wallets", {
        userId: user._id,
        balance: args.balance,
      });
    }

    return user._id;
  },
});

export const seedDemoHierarchy = internalMutation({
  args: {},
  handler: async (ctx) => {
    const emails = new Set<string>();
    for (const rootEmail of DEMO_ROOT_EMAILS) {
      emails.add(rootEmail);
    }
    for (const link of DEMO_HIERARCHY) {
      emails.add(link.email);
      emails.add(link.uplineEmail);
    }

    const usersByEmail = new Map<string, { _id: Id<"users">; uplineId?: Id<"users"> | null }>();
    for (const email of emails) {
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", email))
        .first();
      if (user) {
        usersByEmail.set(email, {
          _id: user._id,
          uplineId: user.uplineId ?? null,
        });
      }
    }

    const missing = Array.from(emails).filter((email) => !usersByEmail.has(email));
    if (missing.length > 0) {
      return { patched: 0, missing };
    }

    let patched = 0;

    for (const rootEmail of DEMO_ROOT_EMAILS) {
      const root = usersByEmail.get(rootEmail);
      if (!root) {
        continue;
      }
      if (root.uplineId !== null) {
        await ctx.db.patch("users", root._id, {
          uplineId: null,
          lastUplineId: root.uplineId ?? undefined,
        });
        patched += 1;
      }
    }

    for (const link of DEMO_HIERARCHY) {
      const user = usersByEmail.get(link.email);
      const upline = usersByEmail.get(link.uplineEmail);
      if (!user || !upline) {
        continue;
      }
      if (user.uplineId !== upline._id) {
        await ctx.db.patch("users", user._id, {
          uplineId: upline._id,
          lastUplineId: user.uplineId ?? undefined,
        });
        patched += 1;
      }
    }

    return { patched, missing: [] as string[] };
  },
});

export const patchSeedUser = internalMutation({
  args: {
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
    balance: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
    if (!user) return;

    // Patch role if missing
    if (!user.role) {
      await ctx.db.patch("users", user._id, { role: args.role });
    }

    // Ensure wallet exists
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (!wallet) {
      await ctx.db.insert("wallets", {
        userId: user._id,
        balance: args.balance,
      });
    }
  },
});

export const seedUsersWithPasswords = action({
  args: {},
  handler: async (ctx) => {
    for (const u of SEED_USERS) {
      // 1. Create auth account (this also creates the user row)
      try {
        await createAccount(ctx, {
          provider: "password",
          account: {
            id: u.email,
            secret: "password123",
          },
          profile: {
            name: u.name,
            email: u.email,
            role: u.role,
          },
          shouldLinkViaEmail: false,
        });
      } catch {
        // Already exists
      }

      // 2. Patch role + wallet onto the auth-created user
      await ctx.runMutation(internal.seed.patchSeedUser, {
        email: u.email,
        role: u.role,
        balance: u.balance,
      });
    }
  },
});

export const clearAllUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Clear auth tables first (they reference users)
    const authAccounts = await ctx.db.query("authAccounts").collect();
    for (const row of authAccounts) {
      await ctx.db.delete("authAccounts", row._id);
    }
    const authSessions = await ctx.db.query("authSessions").collect();
    for (const row of authSessions) {
      await ctx.db.delete("authSessions", row._id);
    }
    const authRefreshTokens = await ctx.db.query("authRefreshTokens").collect();
    for (const row of authRefreshTokens) {
      await ctx.db.delete("authRefreshTokens", row._id);
    }
    const authVerificationCodes = await ctx.db.query("authVerificationCodes").collect();
    for (const row of authVerificationCodes) {
      await ctx.db.delete("authVerificationCodes", row._id);
    }
    const authVerifiers = await ctx.db.query("authVerifiers").collect();
    for (const row of authVerifiers) {
      await ctx.db.delete("authVerifiers", row._id);
    }
    const authRateLimits = await ctx.db.query("authRateLimits").collect();
    for (const row of authRateLimits) {
      await ctx.db.delete("authRateLimits", row._id);
    }
    // Clear app tables
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.delete("users", user._id);
    }
    const wallets = await ctx.db.query("wallets").collect();
    for (const wallet of wallets) {
      await ctx.db.delete("wallets", wallet._id);
    }
    const profiles = await ctx.db.query("mobileProfiles").collect();
    for (const profile of profiles) {
      await ctx.db.delete("mobileProfiles", profile._id);
    }
    const network = await ctx.db.query("networkMembers").collect();
    for (const member of network) {
      await ctx.db.delete("networkMembers", member._id);
    }
    return users.length;
  },
});

export const clearDatabase = internalMutation({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; deletedCount: number }> => {
    const tables = [
      "users",
      "wallets",
      "trades",
      "academyLevels",
      "academyLessons",
      "academyProgress",
      "mobileProfiles",
      "mobileNotificationStates",
      "mobileDeviceTokens",
      "socialMediaAssets",
      "socialPosts",
      "apkReleases",
      "budgetPlans",
      "debtPlans",
      "events",
      "financialAccounts",
      "financialTransactions",
      "installmentPlans",
      "presentations",
      "supportTickets",
      "schedules",
      "tradingSignals",
      "authAccounts",
      "authSessions",
      "authRefreshTokens",
      "authVerificationCodes",
      "authVerifiers",
      "authRateLimits",
      "networkMembers"
    ] as const;

    let totalDeleted = 0;
    for (const table of tables) {
      try {
        const docs = await ctx.db.query(table as any).collect();
        for (const doc of docs) {
          await ctx.db.delete(doc._id);
          totalDeleted++;
        }
      } catch (err) {
        console.error(`Failed to clear table ${table}:`, err);
      }
    }
    return { success: true, deletedCount: totalDeleted };
  },
});

export const wipeAll = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; deletedCount: number }> => {
    return await ctx.runMutation(internal.seed.clearDatabase, {});
  },
});

export const seedAll = action({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(internal.seed.clearDatabase, {});
    await ctx.runAction(api.seed.seedUsersWithPasswords, {});
    await ctx.runMutation(internal.seed.seedDemoHierarchy, {});
  },
});

export const listAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const backfillProfileNames = mutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("mobileProfiles").collect();
    let userCount = 0;
    let memberCount = 0;
    for (const profile of profiles) {
      if (profile.userId) {
        const user = await ctx.db.get(profile.userId);
        if (user && user.name !== profile.displayName) {
          await ctx.db.patch(profile.userId, { name: profile.displayName });
          userCount++;
        }
      }
      
      const viewerMember = await ctx.db
        .query("networkMembers")
        .withIndex("by_profileId_and_isViewer", (q) => q.eq("profileId", profile._id).eq("isViewer", true))
        .unique();
      if (viewerMember && viewerMember.name !== profile.displayName) {
        await ctx.db.patch(viewerMember._id, { name: profile.displayName });
        memberCount++;
      }
    }
    return { success: true, backfilledUsers: userCount, backfilledMembers: memberCount };
  },
});
