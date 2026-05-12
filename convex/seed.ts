import { internalMutation, action } from "./_generated/server";
import { internal } from "./_generated/api";
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

export const seedUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    let created = 0;
    let skipped = 0;

    for (const u of SEED_USERS) {
      const existing = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", u.email))
        .unique();

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

export const seedUsersWithPasswords = action({
  args: {},
  handler: async (ctx) => {
    for (const u of SEED_USERS) {
      await ctx.runMutation(internal.seed.ensureSeedUser, {
        name: u.name,
        email: u.email,
        role: u.role,
        balance: u.balance,
      });

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
          shouldLinkViaEmail: true,
        });
      } catch {
        // Already exists or link error
      }
    }
  },
});
