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

export const recordParticipation = mutation({
  args: {
    signalId: v.id("tradingSignals"),
    userId: v.id("users"),
    status: v.union(v.literal("success"), v.literal("error")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    return await ctx.db.insert("signalParticipation", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getParticipationForSignal = query({
  args: { signalId: v.id("tradingSignals") },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("signalParticipation")
      .withIndex("by_signal", (q) => q.eq("signalId", args.signalId))
      .collect();
    
    // Join with user names
    const withUsers = await Promise.all(
      records.map(async (r) => {
        const user = await ctx.db.get(r.userId);
        return { ...r, userName: user?.name ?? "Unknown" };
      })
    );
    
    return withUsers;
  },
});

export const toggleAttendance = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    sessionTime: v.string(),
    attended: v.boolean(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    const existing = await ctx.db
      .query("sessionAttendance")
      .withIndex("by_date_and_user", (q) => q.eq("date", args.date).eq("userId", args.userId))
      .filter((q) => q.eq(q.field("sessionTime"), args.sessionTime))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { attended: args.attended });
    } else {
      await ctx.db.insert("sessionAttendance", args);
    }
  },
});

export const getDailyAttendance = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const attendance = await ctx.db
      .query("sessionAttendance")
      .withIndex("by_date_and_user", (q) => q.eq("date", args.date))
      .collect();
    
    const users = await ctx.db.query("users").collect();
    
    return users.map(user => {
      const userAttendance = attendance.filter(a => a.userId === user._id);
      return {
        userId: user._id,
        userName: user.name ?? "Unknown",
        sessions: {
          "3pm": userAttendance.find(a => a.sessionTime === "3pm")?.attended ?? false,
          "6pm": userAttendance.find(a => a.sessionTime === "6pm")?.attended ?? false,
          "8pm": userAttendance.find(a => a.sessionTime === "8pm")?.attended ?? false,
          "10pm": userAttendance.find(a => a.sessionTime === "10pm")?.attended ?? false,
        }
      };
    });
  },
});

export const listUserTiers = query({
  handler: async (ctx) => {
    const profiles = await ctx.db.query("mobileProfiles").collect();
    return await Promise.all(
      profiles.map(async (p) => {
        const user = p.userId ? await ctx.db.get(p.userId) : null;
        return {
          profileId: p._id,
          userId: p.userId,
          userName: user?.name ?? "Unknown",
          tier: (p as any).tier ?? "free",
          promotedAt: (p as any).promotedAt ?? null,
        };
      })
    );
  },
});

export const promoteUserTier = mutation({
  args: {
    profileId: v.id("mobileProfiles"),
    tier: v.union(v.literal("free"), v.literal("silver"), v.literal("gold")),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    await ctx.db.patch(args.profileId, {
      tier: args.tier,
      promotedAt: Date.now(),
    } as any);
  },
});
