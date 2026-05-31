import {
  createAccount,
  getAuthUserId,
  invalidateSessions,
  modifyAccountCredentials,
} from "@convex-dev/auth/server";
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
  listUnifiedNetworkMembers,
} from "./mobileHelpers";
import {
  canAddUnderParent,
  canManageMember,
  getEffectiveDirectLimit,
  getUserAdminLevel,
  resolveOwnedByUserId,
} from "./orgAccess";

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
  city: v.optional(v.string()),
  province: v.optional(v.string()),
  country: v.optional(v.string()),
  locationAddress: v.optional(v.string()),
  latitude: v.optional(v.number()),
  longitude: v.optional(v.number()),
  role: v.optional(v.union(v.literal("admin"), v.literal("member"))),
} as const;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

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

type UpdateMemberEmailResult = {
  success: true;
  userId: Id<"users">;
  oldEmail: string;
  newEmail: string;
  name: string;
  patchedMemberCount: number;
  invalidatedSessionCount: number;
};

function buildParentLookup(
  members: Array<{
    _id: Id<"networkMembers">;
    parentMemberId?: Id<"networkMembers"> | null;
  }>,
) {
  const parentLookup = new Map<Id<"networkMembers"> | "root", typeof members>();
  for (const member of members) {
    const parentKey = member.parentMemberId ?? "root";
    const list = parentLookup.get(parentKey) ?? [];
    list.push(member);
    parentLookup.set(parentKey, list);
  }
  return parentLookup;
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

    const member = await ctx.db.get("networkMembers", args.memberId);
    if (!member) throw new Error("Member not found");

    if (member.profileId !== profile._id) {
      throw new Error("Unauthorized");
    }

    const { memberId, ...updates } = args;
    await ctx.db.patch("networkMembers", memberId, {
      ...updates,
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.aiDbEmbeddingActions.embedRecord, {
      table: "networkMembers",
      sourceId: memberId,
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
    const viewerProfile = await getMobileProfileByUserId(
      ctx,
      args.viewerUserId,
    );
    if (!viewerProfile) {
      throw new Error("Mobile profile missing. Call mobile:bootstrap first.");
    }

    const parent = await ctx.db.get("networkMembers", args.parentId);
    if (!parent) {
      throw new Error("Parent node not found");
    }
    const targetProfile = await ctx.db.get("mobileProfiles", parent.profileId);
    if (!targetProfile) {
      throw new Error("Parent profile missing.");
    }

    const existingChildren = await ctx.db
      .query("networkMembers")
      .withIndex("by_profileId_and_parentMemberId", (q) =>
        q
          .eq("profileId", targetProfile._id)
          .eq("parentMemberId", args.parentId),
      )
      .take(1000);

    const now = Date.now();
    const name = buildMemberName(args);

    const memberRole = args.role ?? "member";
    const defaultRoleTitle =
      args.type === "joined"
        ? memberRole === "admin"
          ? "Admin Lead"
          : "Active Member"
        : "Prospect";

    const memberId = await ctx.db.insert("networkMembers", {
      profileId: targetProfile._id,
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
      city: args.city?.trim() || undefined,
      province: args.province?.trim() || undefined,
      country: args.country?.trim() || undefined,
      locationAddress: args.locationAddress?.trim() || undefined,
      latitude: args.latitude,
      longitude: args.longitude,
      createdByUserId: args.viewerUserId,
      ownedByUserId: resolveOwnedByUserId(args.viewerUserId, parent),
      createdAt: now,
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.aiDbEmbeddingActions.embedRecord, {
      table: "networkMembers",
      sourceId: memberId,
    });

    if (args.authUserId) {
      const authUser = await ctx.db.get("users", args.authUserId);
      if (!authUser) {
        throw new Error("Created auth user missing.");
      }

      await ctx.db.patch("users", authUser._id, {
        role: memberRole,
        uplineId: parent.userId ?? args.viewerUserId,
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

    const viewer = await ctx.db.get("users", args.viewerUserId);
    if (!viewer) {
      throw new Error("Viewer not found.");
    }
    const members = await listUnifiedNetworkMembers(ctx, profile._id);
    const parent = members.find((entry) => entry._id === args.parentId) ?? null;
    if (!parent) {
      throw new Error("Parent node not found");
    }
    if (parent.status !== "joined") {
      throw new Error("Parent must be joined.");
    }
    const adminLevel = getUserAdminLevel(viewer);
    if (!canAddUnderParent(viewer, profile, parent, adminLevel)) {
      throw new Error("You cannot add downlines under this member.");
    }
    const parentLookup = buildParentLookup(members);
    const currentChildren = parentLookup.get(parent._id) ?? [];
    const limit = getEffectiveDirectLimit(parent, currentChildren.length);
    if (currentChildren.length >= limit) {
      throw new Error(`Parent already has ${limit} direct downlines.`);
    }

    return { profileId: profile._id, canPromoteAdmins: adminLevel >= 2 };
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

    const targetValidation: {
      profileId: Id<"mobileProfiles">;
      canPromoteAdmins: boolean;
    } = await ctx.runQuery(internal.networkMembers.validateAddMemberTarget, {
      viewerUserId,
      parentId: args.parentId,
    });
    const memberRole = targetValidation.canPromoteAdmins ? args.role : "member";

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
          role: memberRole,
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
        role: memberRole,
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

    const password = generateTemporaryPassword();

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: {
        id: memberInfo.email,
        secret: password,
      },
    });

    await invalidateSessions(ctx, {
      userId: memberInfo.userId,
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
  handler: async (ctx, args): Promise<UpdateMemberEmailResult> => {
    const viewerUserId = await getAuthUserId(ctx);
    if (!viewerUserId) {
      throw new Error("Not authenticated");
    }

    return await ctx.runMutation(internal.admin.updateUserEmailInternal, {
      adminUserId: viewerUserId,
      memberId: args.memberId,
      newEmail: args.newEmail,
    });
  },
});

export const getMemberAuthInfo = internalQuery({
  args: {
    viewerUserId: v.id("users"),
    memberId: v.id("networkMembers"),
  },
  handler: async (ctx, args) => {
    const viewer = await ctx.db.get("users", args.viewerUserId);
    if (!viewer) throw new Error("Viewer not found.");
    if (getUserAdminLevel(viewer) < 1) {
      throw new Error("Admin access required.");
    }

    const member = await ctx.db.get("networkMembers", args.memberId);
    if (!member) throw new Error("Member not found.");
    if (!member.userId) throw new Error("Member has no linked account.");
    const linkedUserId = member.userId;

    const user = await ctx.db.get("users", linkedUserId);
    if (!user) throw new Error("Linked user not found.");
    if (!user.email) throw new Error("User has no email on record.");

    const passwordAccounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", linkedUserId).eq("provider", "password"),
      )
      .take(10);
    if (passwordAccounts.length === 0) {
      throw new Error("Linked user has no password login account.");
    }

    const userEmail = normalizeEmail(user.email);
    const passwordAccount =
      passwordAccounts.find(
        (account) => normalizeEmail(account.providerAccountId) === userEmail,
      ) ?? (passwordAccounts.length === 1 ? passwordAccounts[0] : null);
    if (!passwordAccount) {
      throw new Error("Linked user has multiple password login accounts.");
    }

    return {
      userId: member.userId,
      email: normalizeEmail(passwordAccount.providerAccountId),
      name: member.name,
    };
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
    const viewer = await ctx.db.get("users", args.viewerUserId);
    if (!viewer) throw new Error("Viewer not found");

    const member = await ctx.db.get("networkMembers", args.memberId);
    if (!member) throw new Error("Member not found");
    const members = await listUnifiedNetworkMembers(ctx, profile._id);
    const visibleMember =
      members.find((entry) => entry._id === args.memberId) ?? null;
    if (!visibleMember) throw new Error("Unauthorized access");
    if (!canManageMember(viewer, profile, visibleMember)) {
      throw new Error("You can only manage members you own or created.");
    }
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
    const member = await ctx.db.get("networkMembers", args.memberId);
    if (!member) throw new Error("Member not found");

    const now = Date.now();
    await ctx.db.patch("networkMembers", args.memberId, {
      userId: args.authUserId,
      status: "joined",
      email: args.email,
      roleTitle: "Active Member",
      joinedAt: now,
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.aiDbEmbeddingActions.embedRecord, {
      table: "networkMembers",
      sourceId: args.memberId,
    });

    const authUser = await ctx.db.get("users", args.authUserId);
    if (authUser) {
      const parent = member.parentMemberId
        ? await ctx.db.get("networkMembers", member.parentMemberId)
        : null;
      await ctx.db.patch("users", args.authUserId, {
        role: "member",
        uplineId: parent?.userId ?? member.ownedByUserId ?? args.viewerUserId,
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
    const viewer = profile.userId
      ? await ctx.db.get("users", profile.userId)
      : null;
    if (!viewer) throw new Error("Viewer not found");
    const members = await listUnifiedNetworkMembers(ctx, profile._id);
    const member = members.find((entry) => entry._id === args.memberId) ?? null;
    if (!member) throw new Error("Member not found");
    if (!canManageMember(viewer, profile, member)) {
      throw new Error("You can only manage members you own or created.");
    }

    // If status is joined but no userId is set, client must call joinExistingMember action instead!
    if (args.status === "joined" && !member.userId) {
      throw new Error(
        "Cannot change status to joined without creating auth credentials. Use joinExistingMember action.",
      );
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

    await ctx.db.patch("networkMembers", args.memberId, updates);
    await ctx.scheduler.runAfter(0, internal.aiDbEmbeddingActions.embedRecord, {
      table: "networkMembers",
      sourceId: args.memberId,
    });
  },
});

export const updateMemberInvestmentDate = mutation({
  args: {
    memberId: v.id("networkMembers"),
    investmentStartedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const viewer = profile.userId
      ? await ctx.db.get("users", profile.userId)
      : null;
    if (!viewer) throw new Error("Viewer not found");
    const members = await listUnifiedNetworkMembers(ctx, profile._id);
    const member = members.find((entry) => entry._id === args.memberId) ?? null;
    if (!member) throw new Error("Member not found");
    if (!canManageMember(viewer, profile, member)) {
      throw new Error("You can only manage members you own or created.");
    }

    await ctx.db.patch("networkMembers", args.memberId, {
      investmentStartedAt: args.investmentStartedAt,
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.aiDbEmbeddingActions.embedRecord, {
      table: "networkMembers",
      sourceId: args.memberId,
    });
  },
});

export const updateMemberLocation = mutation({
  args: {
    memberId: v.id("networkMembers"),
    city: v.optional(v.string()),
    province: v.optional(v.string()),
    country: v.optional(v.string()),
    locationAddress: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const viewer = profile.userId
      ? await ctx.db.get("users", profile.userId)
      : null;
    if (!viewer) throw new Error("Viewer not found");
    const members = await listUnifiedNetworkMembers(ctx, profile._id);
    const member = members.find((entry) => entry._id === args.memberId) ?? null;
    if (!member) throw new Error("Member not found");
    if (!canManageMember(viewer, profile, member)) {
      throw new Error("You can only manage members you own or created.");
    }

    await ctx.db.patch("networkMembers", args.memberId, {
      city: args.city,
      province: args.province,
      country: args.country,
      locationAddress: args.locationAddress,
      latitude: args.latitude,
      longitude: args.longitude,
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.aiDbEmbeddingActions.embedRecord, {
      table: "networkMembers",
      sourceId: args.memberId,
    });
  },
});

export const getAnalyticsStats = query({
  args: { rootMemberId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);

    // Fetch all members for the profile
    const members = await ctx.db
      .query("networkMembers")
      .withIndex("by_profileId_and_sortOrder", (q) =>
        q.eq("profileId", profile._id),
      )
      .collect();

    const allAssets = await ctx.db.query("memberAssets").collect();
    const latestAssetByMember = new Map<
      string,
      { value: number; currency: string }
    >();
    for (const asset of allAssets) {
      const existing = latestAssetByMember.get(asset.memberId);
      if (!existing || asset.createdAt > (existing as any).createdAt) {
        latestAssetByMember.set(asset.memberId, {
          value: asset.value,
          currency: asset.currency,
          createdAt: asset.createdAt,
        } as any);
      }
    }

    let filteredMembers = members;
    if (args.rootMemberId) {
      const rootId = args.rootMemberId;
      const descendants = new Set<string>([rootId]);

      const parentToChildren = new Map<string, string[]>();
      for (const m of members) {
        if (m.parentMemberId) {
          const parentId = m.parentMemberId;
          if (!parentToChildren.has(parentId)) {
            parentToChildren.set(parentId, []);
          }
          parentToChildren.get(parentId)!.push(m._id);
        }
      }

      const queue = [rootId];
      while (queue.length > 0) {
        const current = queue.shift()!;
        const children = parentToChildren.get(current) || [];
        for (const childId of children) {
          if (!descendants.has(childId)) {
            descendants.add(childId);
            queue.push(childId);
          }
        }
      }

      filteredMembers = members.filter((m) => descendants.has(m._id));
    }

    const joinsByDate: Record<string, number> = {};
    const investmentsByDate: Record<string, number> = {};
    const statusDistribution: Record<string, number> = {};
    const roleDistribution: Record<string, number> = {};

    for (const member of filteredMembers) {
      if (member.joinedAt) {
        const d = new Date(member.joinedAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        joinsByDate[key] = (joinsByDate[key] || 0) + 1;
      }
      if (member.investmentStartedAt) {
        const d = new Date(member.investmentStartedAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        investmentsByDate[key] = (investmentsByDate[key] || 0) + 1;
      }

      const status = member.status || "unknown";
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;

      const role = member.roleTitle || "Prospect";
      roleDistribution[role] = (roleDistribution[role] || 0) + 1;
    }

    return {
      totalMembers: filteredMembers.length,
      joinsByDate,
      investmentsByDate,
      statusDistribution,
      roleDistribution,
      members: filteredMembers.map((m) => ({
        id: m._id,
        name: m.name,
        roleTitle: m.roleTitle,
        status: m.status,
        joinedAt: m.joinedAt,
        investmentStartedAt: m.investmentStartedAt,
        latestAsset: latestAssetByMember.get(m._id) || null,
      })),
    };
  },
});
