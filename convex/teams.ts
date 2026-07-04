import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireAdminLevel, requireAuthUser, getUserAdminLevel } from "./orgAccess";

// ── Queries ─────────────────────────────────────────────────────────────────────

export const getTeamBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.slug.trim().toLowerCase().replace(/\s+/g, "-");
    const team = await ctx.db
      .query("teams")
      .withIndex("by_slug", (q) => q.eq("slug", normalized))
      .unique();
    if (!team) return null;
    return {
      _id: team._id,
      name: team.name,
      slug: team.slug,
      description: team.description ?? null,
    };
  },
});

export const getMyTeams = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuthUser(ctx);
    const memberships = await ctx.db
      .query("teamMemberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(50);

    const teams = [];
    for (const membership of memberships) {
      const team = await ctx.db.get(membership.teamId);
      if (team) {
        teams.push({
          _id: team._id,
          name: team.name,
          slug: team.slug,
          role: membership.role,
          isDefault: team.isDefault,
        });
      }
    }
    return teams;
  },
});

export const getActiveTeam = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuthUser(ctx);

    // If user has activeTeamId set, use it
    if (user.activeTeamId) {
      const team = await ctx.db.get(user.activeTeamId);
      if (team) {
        return {
          _id: team._id,
          name: team.name,
          slug: team.slug,
          isDefault: team.isDefault,
        };
      }
    }

    // Fallback: first membership
    const membership = await ctx.db
      .query("teamMemberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (!membership) return null;

    const team = await ctx.db.get(membership.teamId);
    if (!team) return null;

    return {
      _id: team._id,
      name: team.name,
      slug: team.slug,
      isDefault: team.isDefault,
    };
  },
});

export const listAllTeams = query({
  args: {},
  handler: async (ctx) => {
    await requireAdminLevel(ctx, 2);
    const teams = await ctx.db.query("teams").take(200);
    const result = [];
    for (const team of teams) {
      const memberCount = (
        await ctx.db
          .query("teamMemberships")
          .withIndex("by_teamId_and_userId", (q) => q.eq("teamId", team._id))
          .take(1000)
      ).length;
      result.push({
        ...team,
        memberCount,
      });
    }
    return result;
  },
});

// ── Mutations ───────────────────────────────────────────────────────────────────

export const createTeam = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    // Master upline account details
    masterUplineName: v.string(),
    masterUplineEmail: v.string(),
    masterUplinePassword: v.string(),
  },
  handler: async (ctx, args) => {
    const { user: creator } = await requireAdminLevel(ctx, 2);
    const now = Date.now();

    const normalized = args.slug.trim().toLowerCase().replace(/\s+/g, "-");
    if (normalized.length < 2 || normalized.length > 64) {
      throw new Error("Slug must be 2-64 characters.");
    }
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(normalized) && normalized.length > 1) {
      throw new Error("Slug must be lowercase, hyphens only, no leading/trailing hyphens.");
    }

    // Check uniqueness
    const existing = await ctx.db
      .query("teams")
      .withIndex("by_slug", (q) => q.eq("slug", normalized))
      .unique();
    if (existing) {
      throw new Error(`Team slug "${normalized}" already taken.`);
    }

    // Check if master upline email already in use
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.masterUplineEmail.trim().toLowerCase()))
      .first();

    let masterUplineUserId: Id<"users">;

    if (existingUser) {
      // Reuse existing user as master upline
      masterUplineUserId = existingUser._id;
    } else {
      // Create the master upline user account
      masterUplineUserId = await ctx.db.insert("users", {
        name: args.masterUplineName.trim(),
        email: args.masterUplineEmail.trim().toLowerCase(),
        role: "admin",
        adminLevel: 1,
        adminAssignedBy: creator._id,
        adminAssignedAt: now,
      });
    }

    // Create team
    const teamId = await ctx.db.insert("teams", {
      name: args.name.trim(),
      slug: normalized,
      description: args.description?.trim(),
      createdBy: creator._id,
      masterUplineId: masterUplineUserId,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    });

    // Create membership for creator (super admin)
    await ctx.db.insert("teamMemberships", {
      teamId,
      userId: creator._id,
      role: "super_admin",
      joinedAt: now,
    });

    // Create membership for master upline (admin)
    if (masterUplineUserId !== creator._id) {
      await ctx.db.insert("teamMemberships", {
        teamId,
        userId: masterUplineUserId,
        role: "admin",
        joinedAt: now,
      });

      // Set their active team
      await ctx.db.patch(masterUplineUserId, {
        activeTeamId: teamId,
      });
    }

    // Provision root network tree for Master Upline for this new team
    const existingProfile = await ctx.db
      .query("mobileProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", masterUplineUserId))
      .first();

    const profileId = existingProfile?._id ?? await ctx.db.insert("mobileProfiles", {
      userId: masterUplineUserId,
      viewerKey: `auth_${masterUplineUserId}`,
      displayName: args.masterUplineName.trim(),
      preferredCurrencyCode: "USD",
      createdAt: now,
      updatedAt: now,
    });

    // Check if a root networkMember already exists for this profile+team
    const existingRootMember = await ctx.db
      .query("networkMembers")
      .withIndex("by_teamId", (q) => q.eq("teamId", teamId))
      .filter((q) => q.eq(q.field("profileId"), profileId))
      .first();

    if (!existingRootMember) {
      await ctx.db.insert("networkMembers", {
        profileId,
        userId: masterUplineUserId,
        name: args.masterUplineName.trim(),
        firstName: args.masterUplineName.trim().split(" ")[0] || "Master",
        lastName: args.masterUplineName.trim().split(" ").slice(1).join(" ") || "Upline",
        roleTitle: "Master Upline",
        status: "joined",
        isViewer: true,
        sortOrder: 0,
        joinedAt: now,
        email: args.masterUplineEmail.trim().toLowerCase(),
        createdByUserId: creator._id,
        ownedByUserId: masterUplineUserId,
        teamId: teamId,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { teamId, slug: normalized, masterUplineUserId };
  },
});

export const joinTeam = mutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);
    const now = Date.now();

    const normalized = args.slug.trim().toLowerCase().replace(/\s+/g, "-");
    const team = await ctx.db
      .query("teams")
      .withIndex("by_slug", (q) => q.eq("slug", normalized))
      .unique();
    if (!team) {
      throw new Error("Team not found. Check the server address.");
    }

    // Check if already a member
    const existing = await ctx.db
      .query("teamMemberships")
      .withIndex("by_teamId_and_userId", (q) =>
        q.eq("teamId", team._id).eq("userId", user._id),
      )
      .unique();
    if (existing) {
      // Already member, just set active
      await ctx.db.patch(user._id, { activeTeamId: team._id });
      return { teamId: team._id, alreadyMember: true };
    }

    // Create membership
    await ctx.db.insert("teamMemberships", {
      teamId: team._id,
      userId: user._id,
      role: "member",
      joinedAt: now,
    });

    // Set active team
    await ctx.db.patch(user._id, { activeTeamId: team._id });

    return { teamId: team._id, alreadyMember: false };
  },
});

export const setActiveTeam = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);

    // Verify membership (super admins bypass)
    const adminLevel = getUserAdminLevel(user);
    if (adminLevel < 2) {
      const membership = await ctx.db
        .query("teamMemberships")
        .withIndex("by_teamId_and_userId", (q) =>
          q.eq("teamId", args.teamId).eq("userId", user._id),
        )
        .unique();
      if (!membership) {
        throw new Error("Not a member of this team.");
      }
    }

    await ctx.db.patch(user._id, { activeTeamId: args.teamId });
    return { success: true };
  },
});

export const leaveTeam = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);

    // Find and delete membership
    const membership = await ctx.db
      .query("teamMemberships")
      .withIndex("by_teamId_and_userId", (q) =>
        q.eq("teamId", args.teamId).eq("userId", user._id),
      )
      .unique();
    if (membership) {
      await ctx.db.delete(membership._id);
    }

    // If this was the active team, clear it or switch to the next team
    if (user.activeTeamId === args.teamId) {
      const nextMembership = await ctx.db
        .query("teamMemberships")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .first();
      await ctx.db.patch(user._id, {
        activeTeamId: nextMembership?.teamId ?? undefined,
      });
    }

    return { success: true, leftTeamId: args.teamId };
  },
});

export const leaveAllTeams = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuthUser(ctx);

    const memberships = await ctx.db
      .query("teamMemberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    for (const m of memberships) {
      await ctx.db.delete(m._id);
    }

    // Clear active team
    await ctx.db.patch(user._id, { activeTeamId: undefined });

    return { success: true, removedCount: memberships.length };
  },
});

// ── Migration ───────────────────────────────────────────────────────────────────

export const migrateToDefaultTeam = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Check if default team already exists
    const existingDefault = await ctx.db
      .query("teams")
      .withIndex("by_isDefault", (q) => q.eq("isDefault", true))
      .first();
    if (existingDefault) {
      return { teamId: existingDefault._id, message: "Default team already exists." };
    }

    // Find Marko Nogoy as master upline
    const marko = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", "sehun4244@gmail.com"))
      .first();

    // Create default team
    const teamId = await ctx.db.insert("teams", {
      name: "Default Team",
      slug: "default",
      description: "Default team for early adopters.",
      createdBy: marko?._id ?? ("" as Id<"users">),
      masterUplineId: marko?._id ?? ("" as Id<"users">),
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });

    // Create memberships for all existing users
    const users = await ctx.db.query("users").take(1000);
    let membershipCount = 0;
    for (const user of users) {
      const level = getUserAdminLevel(user);
      const role =
        level >= 2
          ? "super_admin"
          : level >= 1
            ? "admin"
            : "member";

      await ctx.db.insert("teamMemberships", {
        teamId,
        userId: user._id,
        role,
        joinedAt: now,
      });

      // Set active team
      await ctx.db.patch(user._id, { activeTeamId: teamId });
      membershipCount += 1;
    }

    // Stamp teamId on all existing networkMembers
    const members = await ctx.db.query("networkMembers").take(1000);
    let stampedCount = 0;
    for (const member of members) {
      if (!member.teamId) {
        await ctx.db.patch(member._id, { teamId });
        stampedCount += 1;
      }
    }

    return {
      teamId,
      slug: "default",
      membershipCount,
      stampedNetworkMembers: stampedCount,
    };
  },
});

export const fixErwinTeamBinding = internalMutation({
  args: {},
  handler: async (ctx) => {
    const erwin = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", "erwin.almendrala@gmail.com"))
      .first();
    if (!erwin) return "Erwin not found.";

    const team = await ctx.db
      .query("teams")
      .withIndex("by_slug", (q) => q.eq("slug", "teambechayerwinwin"))
      .unique();
    if (!team) return "Team not found.";

    const profile = await ctx.db
      .query("mobileProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", erwin._id))
      .first();
    if (!profile) return "Profile not found.";

    // 1. Set activeTeamId to teambechayerwinwin
    await ctx.db.patch(erwin._id, { activeTeamId: team._id });

    // 2. Fix the root member node in this team
    const rootMember = await ctx.db
      .query("networkMembers")
      .withIndex("by_teamId", (q) => q.eq("teamId", team._id))
      .filter((q) => q.eq(q.field("userId"), erwin._id))
      .first();

    if (rootMember && rootMember.profileId !== profile._id) {
      await ctx.db.patch(rootMember._id, { profileId: profile._id });
    }

    // 3. Ensure the viewer member also has the correct teamId
    const viewerMember = await ctx.db
      .query("networkMembers")
      .withIndex("by_profileId_and_isViewer", (q) =>
        q.eq("profileId", profile._id).eq("isViewer", true)
      )
      .first();

    if (viewerMember && viewerMember.teamId !== team._id) {
      await ctx.db.patch(viewerMember._id, { teamId: team._id });
    }

    // 4. Also add erwin to teamMemberships if missing
    const membership = await ctx.db
      .query("teamMemberships")
      .withIndex("by_userId", (q) => q.eq("userId", erwin._id))
      .filter((q) => q.eq(q.field("teamId"), team._id))
      .first();

    if (!membership) {
      await ctx.db.insert("teamMemberships", {
        userId: erwin._id,
        teamId: team._id,
        role: "admin",
        joinedAt: Date.now(),
      });
    }

    return {
      fixed: true,
      activeTeamId: team._id,
      profileId: profile._id,
      rootMemberFixed: rootMember ? rootMember.profileId !== profile._id : "no root member",
      viewerMemberFixed: viewerMember ? viewerMember.teamId !== team._id : "no viewer member",
    };
  },
});

export const makeErwinAdmin = internalMutation({
  args: {},
  handler: async (ctx) => {
    const erwin = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", "erwin.almendrala@gmail.com"))
      .first();
    if (erwin) {
      await ctx.db.patch(erwin._id, { adminLevel: 2, role: "admin" });
    }
  }
});
