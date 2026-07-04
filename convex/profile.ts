import { v } from "convex/values";
import {
  action,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  MobileCtx,
  getAvatarEditorState,
  getMobileProfileForViewerOrThrow,
  listNetworkMembersForProfile,
  requireMobileViewer,
} from "./mobileHelpers";
import {
  invalidateSessions,
  modifyAccountCredentials,
  retrieveAccount,
} from "@convex-dev/auth/server";

const avatarFilterValidator = v.union(
  v.literal("natural"),
  v.literal("gold"),
  v.literal("cool"),
  v.literal("mono"),
);

function normalizeOptionalText(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function deriveRank(totalDownlines: number, directReferrals: number) {
  if (totalDownlines >= 1000) {
    return {
      tier: 3,
      name: "Senior Shareholder",
      frame: "gold",
      rangeLabel: "1000+ total downlines",
      nextTarget: null,
    };
  }
  if (totalDownlines >= 31 && directReferrals >= 6) {
    return {
      tier: 2,
      name: "Intermediate Shareholder",
      frame: "silver",
      rangeLabel: "31+ total, 6+ direct referrals",
      nextTarget: 1000,
    };
  }
  if (directReferrals >= 3) {
    return {
      tier: 1,
      name: "Junior Shareholder",
      frame: "bronze",
      rangeLabel: "3+ direct referrals",
      nextTarget: 31,
    };
  }
  return {
    tier: 0,
    name: "Ordinary Member",
    frame: "none",
    rangeLabel: "0-2 direct referrals",
    nextTarget: 3,
  };
}

function countJoinedDownlines(
  parentLookup: Map<string, Array<{ _id: string; status: string }>>,
  parentId: string,
): number {
  const children = parentLookup.get(parentId) ?? [];
  return children.reduce((sum, child) => {
    const childCount = countJoinedDownlines(parentLookup, child._id);
    return sum + (child.status === "joined" ? 1 : 0) + childCount;
  }, 0);
}

function countAllDownlines(
  parentLookup: Map<string, Array<{ _id: string; status: string }>>,
  parentId: string,
): number {
  const children = parentLookup.get(parentId) ?? [];
  return children.reduce((sum, child) => {
    return sum + 1 + countAllDownlines(parentLookup, child._id);
  }, 0);
}

async function buildProfilePayload(ctx: MobileCtx) {
  const viewer = await requireMobileViewer(ctx);
  const profile = await getMobileProfileForViewerOrThrow(ctx);
  const members = await listNetworkMembersForProfile(ctx, profile._id);

  const parentLookup = new Map<string, Array<{ _id: string; status: string }>>();
  for (const member of members) {
    if (!member.parentMemberId) {
      continue;
    }
    const key = member.parentMemberId;
    const list = parentLookup.get(key) ?? [];
    list.push({ _id: member._id, status: member.status });
    parentLookup.set(key, list);
  }

  const viewerMember = members.find((member) => member.isViewer) ?? null;
  const joinedDownlineCount =
    viewerMember == null ? 0 : countJoinedDownlines(parentLookup, viewerMember._id);
  const allDownlineCount =
    viewerMember == null ? 0 : countAllDownlines(parentLookup, viewerMember._id);
    
  const directChildren = viewerMember == null ? [] : (parentLookup.get(viewerMember._id) ?? []);
  const directJoinedCount = directChildren.filter(c => c.status === "joined").length;
  
  const rank = deriveRank(allDownlineCount, directJoinedCount);
  const avatar = getAvatarEditorState(profile);

  const storageUrl = profile.avatarStorageId 
    ? await ctx.storage.getUrl(profile.avatarStorageId) 
    : null;

    return {
      profileId: profile._id,
      displayName: profile.displayName,
      fullName: viewer.name ?? profile.displayName,
      email: viewer.email ?? "",
      role: viewer.role ?? "member",
      birthday: normalizeOptionalText(profile.birthday),
      bonchatId: normalizeOptionalText(profile.bonchatId),
      bonchatUsername: normalizeOptionalText(profile.bonchatUsername),
      yepbitId: normalizeOptionalText(profile.yepbitId),
      yepbitUsername: normalizeOptionalText(profile.yepbitUsername),
      joinedDownlineCount,
      directJoinedCount,
      totalDownlineCount: allDownlineCount,
      rank,
      avatar: {
        ...avatar,
        frame: rank.frame,
        storage: profile.avatarStorageId ? "cloud" : "device-local",
        storageUrl,
      },
      verification: {
        emailVerified: viewer.emailVerificationTime != null,
        phoneCertified: viewer.phoneVerificationTime != null,
      },
    provisioning: {
      adminProvisionedOnly: true,
    },
  };
}

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    return await buildProfilePayload(ctx);
  },
});

export const getRank = query({
  args: {},
  handler: async (ctx) => {
    const payload = await buildProfilePayload(ctx);
    return {
      joinedDownlineCount: payload.joinedDownlineCount,
      rank: payload.rank,
    };
  },
});

export const updateMe = mutation({
  args: {
    displayName: v.optional(v.string()),
    birthday: v.optional(v.string()),
    bonchatId: v.optional(v.string()),
    bonchatUsername: v.optional(v.string()),
    yepbitId: v.optional(v.string()),
    yepbitUsername: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireMobileViewer(ctx);
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const now = Date.now();

    const displayName = args.displayName?.trim();
    const patch: Record<string, string | number> = {
      updatedAt: now,
      displayName:
        displayName && displayName.length > 0
          ? displayName
          : viewer.name?.trim() || profile.displayName,
      birthday: args.birthday?.trim() ?? "",
      bonchatId: args.bonchatId?.trim() ?? "",
      bonchatUsername: args.bonchatUsername?.trim() ?? "",
      yepbitId: args.yepbitId?.trim() ?? "",
      yepbitUsername: args.yepbitUsername?.trim() ?? "",
    };

    await ctx.db.patch("mobileProfiles", profile._id, patch);
    if (displayName && displayName.length > 0) {
      await ctx.db.patch(viewer._id, { name: displayName });
      
      const viewerMember = await ctx.db
        .query("networkMembers")
        .withIndex("by_profileId_and_isViewer", (q) => q.eq("profileId", profile._id).eq("isViewer", true))
        .unique();
      if (viewerMember) {
        await ctx.db.patch(viewerMember._id, { name: displayName });
      }
    }
    return await buildProfilePayload(ctx);
  },
});

export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireMobileViewer(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const updateAvatar = mutation({
  args: {
    filter: avatarFilterValidator,
    mirrored: v.boolean(),
    offsetX: v.number(),
    offsetY: v.number(),
    rotationQuarterTurns: v.number(),
    scale: v.number(),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);

    const patch: any = {
      avatarFilter: args.filter,
      avatarMirror: args.mirrored,
      avatarOffsetX: clamp(args.offsetX, -1, 1),
      avatarOffsetY: clamp(args.offsetY, -1, 1),
      avatarRotationQuarterTurns: ((Math.round(args.rotationQuarterTurns) % 4) + 4) % 4,
      avatarScale: clamp(args.scale, 1, 2.4),
      updatedAt: Date.now(),
    };

    if (args.storageId !== undefined) {
      patch.avatarStorageId = args.storageId;
    }

    await ctx.db.patch("mobileProfiles", profile._id, patch);

    return await buildProfilePayload(ctx);
  },
});

export const getPasswordContext = internalQuery({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireMobileViewer(ctx);
    return {
      userId: viewer._id,
      email: viewer.email ?? "",
    };
  },
});

export const changePassword = action({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const currentPassword = args.currentPassword.trim();
    const newPassword = args.newPassword.trim();

    if (currentPassword.length === 0) {
      throw new Error("Current password required.");
    }
    if (newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters.");
    }
    if (currentPassword === newPassword) {
      throw new Error("New password must differ from current password.");
    }

    const passwordContext: { userId: Id<"users">; email: string } = await ctx.runQuery(
      internal.profile.getPasswordContext,
      {},
    );

    if (!passwordContext.email) {
      throw new Error("Current account has no email address.");
    }

    await retrieveAccount(ctx, {
      provider: "password",
      account: {
        id: passwordContext.email,
        secret: currentPassword,
      },
    });

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: {
        id: passwordContext.email,
        secret: newPassword,
      },
    });

    await invalidateSessions(ctx, {
      userId: passwordContext.userId,
    });

    return {
      changed: true,
      requiresReauth: true,
    };
  },
});
