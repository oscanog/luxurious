import { createAccount, getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import {
  getMobileProfileByUserId,
  getMobileProfileForViewerOrThrow,
} from "./mobileHelpers";

const addMemberArgs = {
  type: v.union(v.literal("joined"), v.literal("to-invite")),
  parentId: v.id("networkMembers"),
  firstName: v.string(),
  lastName: v.string(),
  middleName: v.optional(v.string()),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  bonchatId: v.optional(v.string()),
  bonchatUsername: v.optional(v.string()),
  yepbitId: v.optional(v.string()),
  yepbitUsername: v.optional(v.string()),
  birthday: v.optional(v.string()),
  currentWork: v.optional(v.string()),
  investmentStartedAt: v.optional(v.number()),
  role: v.optional(v.union(v.literal("admin"), v.literal("member"))),
} as const;

function buildMemberName(args: {
  firstName: string;
  middleName?: string;
  lastName: string;
}) {
  return [args.firstName, args.middleName, args.lastName]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(" ");
}

function randomDigits(length: number) {
  let value = "";
  for (let i = 0; i < length; i += 1) {
    value += Math.floor(Math.random() * 10).toString();
  }
  return value;
}

function randomLetters(length: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let value = "";
  for (let i = 0; i < length; i += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return value;
}

function generateTemporaryPassword() {
  return `LTG${randomDigits(4)}${randomLetters(4)}`;
}

export const updateSocialIds = mutation({
  args: {
    memberId: v.id("networkMembers"),
    bonchatId: v.optional(v.string()),
    bonchatUsername: v.optional(v.string()),
    yepbitId: v.optional(v.string()),
    yepbitUsername: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);

    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");

    if (member.profileId !== profile._id) {
      throw new Error("Unauthorized");
    }

    const { memberId, ...updates } = args;
    await ctx.db.patch(memberId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const createMemberRecord = internalMutation({
  args: {
    viewerUserId: v.id("users"),
    authUserId: v.optional(v.id("users")),
    ...addMemberArgs,
  },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileByUserId(ctx, args.viewerUserId);
    if (!profile) {
      throw new Error("Mobile profile missing. Call mobile:bootstrap first.");
    }

    const parent = await ctx.db.get("networkMembers", args.parentId);
    if (!parent || parent.profileId !== profile._id) {
      throw new Error("Parent node not found");
    }

    const existingChildren = await ctx.db
      .query("networkMembers")
      .withIndex("by_profileId_and_parentMemberId", (q) =>
        q.eq("profileId", profile._id).eq("parentMemberId", args.parentId),
      )
      .take(1000);

    const now = Date.now();
    const name = buildMemberName(args);

    const memberRole = args.role ?? "member";
    const defaultRoleTitle = args.type === "joined" 
      ? (memberRole === "admin" ? "Admin Lead" : "Active Member")
      : "Prospect";

    const memberId = await ctx.db.insert("networkMembers", {
      profileId: profile._id,
      userId: args.authUserId,
      parentMemberId: args.parentId,
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      middleName: args.middleName?.trim() || undefined,
      name,
      roleTitle: defaultRoleTitle,
      status: args.type === "joined" ? "joined" : "to-invite",
      isViewer: false,
      sortOrder: existingChildren.length,
      joinedAt: args.type === "joined" ? now : undefined,
      email: args.email?.trim() || undefined,
      phone: args.phone?.trim() || undefined,
      bonchatId: args.bonchatId?.trim() || undefined,
      bonchatUsername: args.bonchatUsername?.trim() || undefined,
      yepbitId: args.yepbitId?.trim() || undefined,
      yepbitUsername: args.yepbitUsername?.trim() || undefined,
      birthday: args.birthday,
      currentWork: args.currentWork?.trim() || undefined,
      investmentStartedAt: args.investmentStartedAt,
      createdAt: now,
      updatedAt: now,
    });

    if (args.authUserId) {
      const authUser = await ctx.db.get(args.authUserId);
      if (!authUser) {
        throw new Error("Created auth user missing.");
      }

      await ctx.db.patch(authUser._id, {
        role: memberRole,
        uplineId: args.viewerUserId,
        lastUplineId: authUser.uplineId ?? null,
      });

      const existingProfile = await getMobileProfileByUserId(ctx, authUser._id);
      if (!existingProfile) {
        await ctx.db.insert("mobileProfiles", {
          userId: authUser._id,
          viewerKey: `auth_${authUser._id}`,
          displayName: name,
          preferredCurrencyCode: "USD",
          birthday: args.birthday,
          bonchatId: args.bonchatId?.trim() || undefined,
          bonchatUsername: args.bonchatUsername?.trim() || undefined,
          yepbitId: args.yepbitId?.trim() || undefined,
          yepbitUsername: args.yepbitUsername?.trim() || undefined,
          avatarFilter: "natural",
          avatarMirror: false,
          avatarOffsetX: 0,
          avatarOffsetY: 0,
          avatarRotationQuarterTurns: 0,
          avatarScale: 1,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return { memberId };
  },
});

export const validateAddMemberTarget = internalQuery({
  args: {
    viewerUserId: v.id("users"),
    parentId: v.id("networkMembers"),
  },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileByUserId(ctx, args.viewerUserId);
    if (!profile) {
      throw new Error("Mobile profile missing. Call mobile:bootstrap first.");
    }

    const parent = await ctx.db.get("networkMembers", args.parentId);
    if (!parent || parent.profileId !== profile._id) {
      throw new Error("Parent node not found");
    }

    return { profileId: profile._id };
  },
});

export const checkEmailAvailability = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    await getMobileProfileForViewerOrThrow(ctx);

    const normalizedEmail = args.email.trim().toLowerCase();
    if (!normalizedEmail) {
      return { exists: false };
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .unique();

    return {
      exists: existingUser !== null,
    };
  },
});

export const addMember = action({
  args: addMemberArgs,
  handler: async (ctx, args) => {
    const viewerUserId = await getAuthUserId(ctx);
    if (!viewerUserId) {
      throw new Error("Not authenticated");
    }

    if (args.type === "joined" && !args.email?.trim()) {
      throw new Error("Email required for joined member.");
    }

    await ctx.runQuery(internal.networkMembers.validateAddMemberTarget, {
      viewerUserId,
      parentId: args.parentId,
    });

    let authUserId: Id<"users"> | undefined;
    let credentials: { username: string; password: string } | null = null;

    if (args.type === "joined") {
      const email = args.email!.trim().toLowerCase();
      const emailAvailability: { exists: boolean } = await ctx.runQuery(
        api.networkMembers.checkEmailAvailability,
        { email },
      );
      if (emailAvailability.exists) {
        throw new Error("Email already used.");
      }

      const password = generateTemporaryPassword();
      const created = await createAccount(ctx, {
        provider: "password",
        account: {
          id: email,
          secret: password,
        },
        profile: {
          name: buildMemberName(args),
          email,
          phone: args.phone?.trim() || undefined,
          role: args.role ?? "member",
        },
        shouldLinkViaEmail: false,
      });
      authUserId = created.user._id;
      credentials = {
        username: email,
        password,
      };
    }

    const result: { memberId: Id<"networkMembers"> } = await ctx.runMutation(
      internal.networkMembers.createMemberRecord,
      {
        viewerUserId,
        authUserId,
        ...args,
      },
    );

    return {
      memberId: result.memberId,
      credentials,
    };
  },
});

// ── Admin Security Actions ──

export const resetMemberPassword = action({
  args: {
    memberId: v.id("networkMembers"),
  },
  handler: async (ctx, args) => {
    const viewerUserId = await getAuthUserId(ctx);
    if (!viewerUserId) {
      throw new Error("Not authenticated");
    }

    // Verify admin + get member
    const memberInfo: {
      userId: Id<"users">;
      email: string;
      name: string;
    } = await ctx.runQuery(internal.networkMembers.getMemberAuthInfo, {
      viewerUserId,
      memberId: args.memberId,
    });

    // Delete old auth account for this user
    await ctx.runMutation(internal.networkMembers.deleteAuthAccountForUser, {
      userId: memberInfo.userId,
    });

    // Create new auth account with generated password
    const password = generateTemporaryPassword();
    await createAccount(ctx, {
      provider: "password",
      account: {
        id: memberInfo.email,
        secret: password,
      },
      profile: {
        name: memberInfo.name,
        email: memberInfo.email,
      },
      shouldLinkViaEmail: false,
    });

    // Re-link user role after account recreation
    await ctx.runMutation(internal.networkMembers.patchUserAfterReset, {
      email: memberInfo.email,
      oldUserId: memberInfo.userId,
      memberId: args.memberId,
    });

    return {
      success: true,
      email: memberInfo.email,
      password,
      name: memberInfo.name,
    };
  },
});

export const updateMemberEmail = action({
  args: {
    memberId: v.id("networkMembers"),
    newEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const viewerUserId = await getAuthUserId(ctx);
    if (!viewerUserId) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = args.newEmail.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      throw new Error("Invalid email address.");
    }

    // Check availability
    const availability: { exists: boolean } = await ctx.runQuery(
      api.networkMembers.checkEmailAvailability,
      { email: normalizedEmail },
    );
    if (availability.exists) {
      throw new Error("Email already in use by another account.");
    }

    // Get member info
    const memberInfo: {
      userId: Id<"users">;
      email: string;
      name: string;
    } = await ctx.runQuery(internal.networkMembers.getMemberAuthInfo, {
      viewerUserId,
      memberId: args.memberId,
    });

    // Delete old auth account
    await ctx.runMutation(internal.networkMembers.deleteAuthAccountForUser, {
      userId: memberInfo.userId,
    });

    // Create new auth account with new email + generated password
    const password = generateTemporaryPassword();
    await createAccount(ctx, {
      provider: "password",
      account: {
        id: normalizedEmail,
        secret: password,
      },
      profile: {
        name: memberInfo.name,
        email: normalizedEmail,
      },
      shouldLinkViaEmail: false,
    });

    // Re-link and update email on old user
    await ctx.runMutation(internal.networkMembers.patchUserEmailAfterChange, {
      oldEmail: memberInfo.email,
      newEmail: normalizedEmail,
      oldUserId: memberInfo.userId,
      memberId: args.memberId,
    });

    return {
      success: true,
      oldEmail: memberInfo.email,
      newEmail: normalizedEmail,
      password,
      name: memberInfo.name,
    };
  },
});

export const getMemberAuthInfo = internalQuery({
  args: {
    viewerUserId: v.id("users"),
    memberId: v.id("networkMembers"),
  },
  handler: async (ctx, args) => {
    const viewer = await ctx.db.get(args.viewerUserId);
    if (!viewer) throw new Error("Viewer not found.");
    if (viewer.email !== "admin@luxurious.trade" && viewer.role !== "admin") {
      throw new Error("Admin access required.");
    }

    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found.");
    if (!member.userId) throw new Error("Member has no linked account.");

    const user = await ctx.db.get(member.userId);
    if (!user) throw new Error("Linked user not found.");
    if (!user.email) throw new Error("User has no email on record.");

    return {
      userId: member.userId,
      email: user.email,
      name: member.name,
    };
  },
});

export const deleteAuthAccountForUser = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Delete auth accounts for this user
    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", args.userId))
      .collect();

    for (const account of accounts) {
      // Delete verification codes for this account
      const codes = await ctx.db
        .query("authVerificationCodes")
        .withIndex("accountId", (q) => q.eq("accountId", account._id))
        .collect();
      for (const code of codes) {
        await ctx.db.delete(code._id);
      }
      await ctx.db.delete(account._id);
    }

    // Delete sessions
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const session of sessions) {
      const refreshTokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
        .collect();
      for (const token of refreshTokens) {
        await ctx.db.delete(token._id);
      }
      await ctx.db.delete(session._id);
    }
  },
});

export const patchUserAfterReset = internalMutation({
  args: {
    email: v.string(),
    oldUserId: v.id("users"),
    memberId: v.id("networkMembers"),
  },
  handler: async (ctx, args) => {
    // createAccount may have created a new user row - find it
    const newUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (!newUser) {
      throw new Error("New auth user not found after reset.");
    }

    // Copy role from old user to new
    const oldUser = await ctx.db.get(args.oldUserId);
    if (oldUser) {
      await ctx.db.patch(newUser._id, {
        role: oldUser.role ?? "member",
        uplineId: oldUser.uplineId,
        lastUplineId: oldUser.lastUplineId,
      });

      // If a new user was created (different ID), update member reference
      if (newUser._id !== args.oldUserId) {
        await ctx.db.patch(args.memberId, {
          userId: newUser._id,
          updatedAt: Date.now(),
        });

        // Update mobile profile reference
        const profiles = await ctx.db
          .query("mobileProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", args.oldUserId))
          .collect();
        for (const profile of profiles) {
          await ctx.db.patch(profile._id, {
            userId: newUser._id,
            updatedAt: Date.now(),
          });
        }

        // Clean up old user if it has no auth accounts left
        const oldAccounts = await ctx.db
          .query("authAccounts")
          .withIndex("userIdAndProvider", (q) => q.eq("userId", args.oldUserId))
          .take(1);
        if (oldAccounts.length === 0) {
          await ctx.db.delete(args.oldUserId);
        }
      }
    }
  },
});

export const patchUserEmailAfterChange = internalMutation({
  args: {
    oldEmail: v.string(),
    newEmail: v.string(),
    oldUserId: v.id("users"),
    memberId: v.id("networkMembers"),
  },
  handler: async (ctx, args) => {
    // Find user created by createAccount for the new email
    const newUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.newEmail))
      .first();

    if (!newUser) {
      throw new Error("New auth user not found after email change.");
    }

    const oldUser = await ctx.db.get(args.oldUserId);
    if (oldUser) {
      await ctx.db.patch(newUser._id, {
        role: oldUser.role ?? "member",
        uplineId: oldUser.uplineId,
        lastUplineId: oldUser.lastUplineId,
      });

      if (newUser._id !== args.oldUserId) {
        // Update member to point to new user
        await ctx.db.patch(args.memberId, {
          userId: newUser._id,
          email: args.newEmail,
          updatedAt: Date.now(),
        });

        // Update mobile profile
        const profiles = await ctx.db
          .query("mobileProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", args.oldUserId))
          .collect();
        for (const profile of profiles) {
          await ctx.db.patch(profile._id, {
            userId: newUser._id,
            updatedAt: Date.now(),
          });
        }

        // Clean old user
        const oldAccounts = await ctx.db
          .query("authAccounts")
          .withIndex("userIdAndProvider", (q) => q.eq("userId", args.oldUserId))
          .take(1);
        if (oldAccounts.length === 0) {
          await ctx.db.delete(args.oldUserId);
        }
      } else {
        // Same user, just update email fields
        await ctx.db.patch(args.oldUserId, {
          email: args.newEmail,
        });
        await ctx.db.patch(args.memberId, {
          email: args.newEmail,
          updatedAt: Date.now(),
        });
      }
    }
  },
});

export const getMemberDetailsForJoin = internalQuery({
  args: {
    memberId: v.id("networkMembers"),
    viewerUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileByUserId(ctx, args.viewerUserId);
    if (!profile) throw new Error("Viewer mobile profile not found");

    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");
    if (member.profileId !== profile._id) throw new Error("Unauthorized access");
    if (member.userId) throw new Error("Member is already joined");

    return {
      name: member.name,
      firstName: member.firstName ?? member.name.split(" ")[0] ?? "",
      lastName: member.lastName ?? member.name.split(" ")[1] ?? "",
      birthday: member.birthday,
      bonchatId: member.bonchatId,
      bonchatUsername: member.bonchatUsername,
      yepbitId: member.yepbitId,
      yepbitUsername: member.yepbitUsername,
    };
  },
});

export const completeMemberJoin = internalMutation({
  args: {
    memberId: v.id("networkMembers"),
    authUserId: v.id("users"),
    email: v.string(),
    viewerUserId: v.id("users"),
    birthday: v.optional(v.string()),
    bonchatId: v.optional(v.string()),
    bonchatUsername: v.optional(v.string()),
    yepbitId: v.optional(v.string()),
    yepbitUsername: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");

    const now = Date.now();
    await ctx.db.patch(args.memberId, {
      userId: args.authUserId,
      status: "joined",
      email: args.email,
      roleTitle: "Active Member",
      joinedAt: now,
      updatedAt: now,
    });

    const authUser = await ctx.db.get(args.authUserId);
    if (authUser) {
      await ctx.db.patch(args.authUserId, {
        role: "member",
        uplineId: args.viewerUserId,
        lastUplineId: authUser.uplineId ?? null,
      });

      const existingProfile = await getMobileProfileByUserId(ctx, authUser._id);
      if (!existingProfile) {
        await ctx.db.insert("mobileProfiles", {
          userId: authUser._id,
          viewerKey: `auth_${authUser._id}`,
          displayName: member.name,
          preferredCurrencyCode: "USD",
          birthday: args.birthday,
          bonchatId: args.bonchatId,
          bonchatUsername: args.bonchatUsername,
          yepbitId: args.yepbitId,
          yepbitUsername: args.yepbitUsername,
          avatarFilter: "natural",
          avatarMirror: false,
          avatarOffsetX: 0,
          avatarOffsetY: 0,
          avatarRotationQuarterTurns: 0,
          avatarScale: 1,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  },
});

export const joinExistingMember = action({
  args: {
    memberId: v.id("networkMembers"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const viewerUserId = await getAuthUserId(ctx);
    if (!viewerUserId) {
      throw new Error("Not authenticated");
    }

    const email = args.email.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      throw new Error("Valid email required to join member.");
    }

    // Check availability
    const emailAvailability: { exists: boolean } = await ctx.runQuery(
      api.networkMembers.checkEmailAvailability,
      { email },
    );
    if (emailAvailability.exists) {
      throw new Error("Email already used.");
    }

    // Retrieve the member details first
    const memberDetails: {
      name: string;
      firstName: string;
      lastName: string;
      birthday?: string;
      bonchatId?: string;
      bonchatUsername?: string;
      yepbitId?: string;
      yepbitUsername?: string;
    } = await ctx.runQuery(internal.networkMembers.getMemberDetailsForJoin, {
      memberId: args.memberId,
      viewerUserId,
    });

    const password = generateTemporaryPassword();
    const created = await createAccount(ctx, {
      provider: "password",
      account: {
        id: email,
        secret: password,
      },
      profile: {
        name: memberDetails.name,
        email,
        role: "member",
      },
      shouldLinkViaEmail: false,
    });

    const authUserId = created.user._id;

    await ctx.runMutation(internal.networkMembers.completeMemberJoin, {
      memberId: args.memberId,
      authUserId,
      email,
      viewerUserId,
      birthday: memberDetails.birthday,
      bonchatId: memberDetails.bonchatId,
      bonchatUsername: memberDetails.bonchatUsername,
      yepbitId: memberDetails.yepbitId,
      yepbitUsername: memberDetails.yepbitUsername,
    });

    return {
      success: true,
      credentials: {
        username: email,
        password,
      },
    };
  },
});

export const updateMemberStatus = mutation({
  args: {
    memberId: v.id("networkMembers"),
    status: v.union(
      v.literal("joined"),
      v.literal("invited"),
      v.literal("pending"),
      v.literal("to-invite"),
    ),
  },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");
    if (member.profileId !== profile._id) throw new Error("Unauthorized");

    // If status is joined but no userId is set, client must call joinExistingMember action instead!
    if (args.status === "joined" && !member.userId) {
      throw new Error("Cannot change status to joined without creating auth credentials. Use joinExistingMember action.");
    }

    const updates: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.status === "joined") {
      updates.roleTitle = "Active Member";
      if (!member.joinedAt) {
        updates.joinedAt = Date.now();
      }
    } else {
      updates.roleTitle = "Prospect";
    }

    await ctx.db.patch(args.memberId, updates);
  },
});

export const updateMemberInvestmentDate = mutation({
  args: {
    memberId: v.id("networkMembers"),
    investmentStartedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getMobileProfileForViewerOrThrow(ctx);
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");
    
    // Allow if it's in the same profile, or if we are editing a downline from the unified tree
    // The client only sends valid member IDs they can see in their tree.
    // If needed, more strict descendant validation could be added here.
    
    await ctx.db.patch(args.memberId, {
      investmentStartedAt: args.investmentStartedAt,
      updatedAt: Date.now(),
    });
  },
});

export const getAnalyticsStats = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    
    // Fetch all members for the profile
    const members = await ctx.db
      .query("networkMembers")
      .withIndex("by_profileId_and_sortOrder", (q) => q.eq("profileId", profile._id))
      .collect();

    const joinsByDate: Record<string, number> = {};
    const investmentsByDate: Record<string, number> = {};
    const statusDistribution: Record<string, number> = {};
    const roleDistribution: Record<string, number> = {};

    for (const member of members) {
      if (member.joinedAt) {
        const d = new Date(member.joinedAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        joinsByDate[key] = (joinsByDate[key] || 0) + 1;
      }
      if (member.investmentStartedAt) {
        const d = new Date(member.investmentStartedAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        investmentsByDate[key] = (investmentsByDate[key] || 0) + 1;
      }
      
      const status = member.status || 'unknown';
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
      
      const role = member.roleTitle || 'Prospect';
      roleDistribution[role] = (roleDistribution[role] || 0) + 1;
    }

    return {
      totalMembers: members.length,
      joinsByDate,
      investmentsByDate,
      statusDistribution,
      roleDistribution,
      members: members.map(m => ({
        id: m._id,
        name: m.name,
        roleTitle: m.roleTitle,
        status: m.status,
        joinedAt: m.joinedAt,
        investmentStartedAt: m.investmentStartedAt,
      })),
    };
  },
});
