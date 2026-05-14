import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getMobileProfileForViewerOrThrow } from "./mobileHelpers";
import { paginationOptsValidator } from "convex/server";

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
  args: { 
    date: v.string(),
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let usersQuery = ctx.db.query("users");
    
    // Simple search filter if provided
    const users = await usersQuery.paginate(args.paginationOpts);
    
    const page = await Promise.all(
      users.page.map(async (user) => {
        // Filter by name manually since we don't have a search index on users here
        if (args.search && !user.name?.toLowerCase().includes(args.search.toLowerCase())) {
          return null;
        }

        const attendance = await ctx.db
          .query("sessionAttendance")
          .withIndex("by_date_and_user", (q) => q.eq("date", args.date).eq("userId", user._id))
          .collect();

        return {
          userId: user._id,
          userName: user.name ?? "Unknown",
          email: user.email,
          sessions: {
            "3pm": attendance.find(a => a.sessionTime === "3pm")?.attended ?? false,
            "6pm": attendance.find(a => a.sessionTime === "6pm")?.attended ?? false,
            "8pm": attendance.find(a => a.sessionTime === "8pm")?.attended ?? false,
            "10pm": attendance.find(a => a.sessionTime === "10pm")?.attended ?? false,
          }
        };
      })
    );

    return {
      ...users,
      page: page.filter(p => p !== null) as any,
    };
  },
});

export const listUserTiers = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profiles = await ctx.db.query("mobileProfiles").paginate(args.paginationOpts);
    
    const page = await Promise.all(
      profiles.page.map(async (p) => {
        const user = p.userId ? await ctx.db.get(p.userId) : null;
        
        if (args.search && !user?.name?.toLowerCase().includes(args.search.toLowerCase())) {
          return null;
        }

        return {
          profileId: p._id,
          userId: p.userId,
          userName: user?.name ?? "Unknown",
          tier: (p as any).tier ?? "free",
          promotedAt: (p as any).promotedAt ?? null,
        };
      })
    );

    return {
      ...profiles,
      page: page.filter(p => p !== null) as any,
    };
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

export const getDailyStats = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    
    // In Convex, querying without an index when we want a simple filter is fine for small scale,
    // but ideally we'd use an index. Let's just collect and filter if 'by_date' index doesn't exist, 
    // or use q.eq("date", args.date). I'll use filter since we don't have 'by_date' index on sessionAttendance.
    const records = await ctx.db
      .query("sessionAttendance")
      .filter((q) => q.eq(q.field("date"), args.date))
      .collect();
      
    let totalChecks = 0;
    const sessionCounts: Record<string, number> = { "3pm": 0, "6pm": 0, "8pm": 0, "10pm": 0 };
    const uniqueUsers = new Set<string>();
    
    for (const r of records) {
      if (r.attended) {
        totalChecks++;
        sessionCounts[r.sessionTime] = (sessionCounts[r.sessionTime] || 0) + 1;
        uniqueUsers.add(r.userId as string);
      }
    }
    
    let topSession = "N/A";
    let maxChecks = 0;
    for (const [session, count] of Object.entries(sessionCounts)) {
      if (count > maxChecks) {
        maxChecks = count;
        topSession = session.toUpperCase();
      }
    }
    
    const users = await ctx.db.query("users").collect();
    const totalUsers = users.length;
    
    return {
      activeUsers: uniqueUsers.size,
      totalUsers,
      totalChecks,
      topSession,
    };
  }
});
