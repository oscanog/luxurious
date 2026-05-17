import { MutationCtx, QueryCtx, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { Doc, Id } from "./_generated/dataModel";
import {
  getMobileProfileForViewerOrThrow,
  listUnifiedNetworkMembers,
  requireMobileViewer,
} from "./mobileHelpers";

const MAX_DIRECT_DOWNLINES = 1000000;

async function countDirectChildren(
  ctx: QueryCtx | MutationCtx,
  profileId: Id<"mobileProfiles">,
  parentId: Id<"networkMembers">,
): Promise<number> {
  const children = await ctx.db
    .query("networkMembers")
    .withIndex("by_profileId_and_parentMemberId", (q) =>
      q.eq("profileId", profileId).eq("parentMemberId", parentId),
    )
    .take(MAX_DIRECT_DOWNLINES + 1);
  return children.length;
}

export const inviteMember = mutation({
  args: {
    name: v.string(),
    roleTitle: v.string(),
    bonchatUsername: v.optional(v.string()),
    yepbitUsername: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const now = Date.now();
    
    // Find viewer to set as parent
    const viewer = await ctx.db
      .query("networkMembers")
      .withIndex("by_profileId_and_isViewer", (q) => q.eq("profileId", profile._id).eq("isViewer", true))
      .unique();

    if (viewer) {
      const childCount = await countDirectChildren(ctx, profile._id, viewer._id);
      if (childCount >= MAX_DIRECT_DOWNLINES) {
        throw new Error(`Parent already has ${MAX_DIRECT_DOWNLINES} direct downlines.`);
      }
    }

    return await ctx.db.insert("networkMembers", {
      profileId: profile._id,
      name: args.name,
      roleTitle: args.roleTitle,
      status: "invited",
      parentMemberId: viewer?._id ?? null,
      isViewer: false,
      sortOrder: now, // Simplistic sort order
      bonchatUsername: args.bonchatUsername,
      yepbitUsername: args.yepbitUsername,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateMemberSocials = mutation({
  args: {
    memberId: v.id("networkMembers"),
    bonchatUsername: v.optional(v.union(v.string(), v.null())),
    yepbitUsername: v.optional(v.union(v.string(), v.null())),
    bonchatId: v.optional(v.union(v.string(), v.null())),
    yepbitId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const member = await ctx.db.get(args.memberId);
    
    if (!member || member.profileId !== profile._id) {
      throw new Error("Member not found or access denied.");
    }

    await ctx.db.patch(args.memberId, {
      bonchatUsername: args.bonchatUsername?.trim() || undefined,
      yepbitUsername: args.yepbitUsername?.trim() || undefined,
      bonchatId: args.bonchatId?.trim() || undefined,
      yepbitId: args.yepbitId?.trim() || undefined,
      updatedAt: Date.now(),
    });
  },
});

type NetworkMember = Doc<"networkMembers">;

type OrgTreeNode = {
  id: Id<"networkMembers">;
  parentMemberId: Id<"networkMembers"> | null;
  name: string;
  roleTitle: string;
  status: NetworkMember["status"];
  isViewer: boolean;
  directChildrenCount: number;
  totalDownlineCount: number;
  allowAdd?: boolean;
  latestAsset?: {
    name: string;
    value: number;
    currency: string;
    createdAt: number;
  } | null;
  member: {
    id: Id<"users"> | Id<"networkMembers">;
    name: string;
    email: string;
    roleTitle: string;
    rank: string;
    status: NetworkMember["status"];
    avatarInitials: string;
    totalDownlines: number;
    invitedCount: number;
    pendingCount: number;
    uplineId: Id<"networkMembers"> | null;
    allowAdd?: boolean;
    latestAsset?: {
      name: string;
      value: number;
      currency: string;
      createdAt: number;
    } | null;
  };
  children: OrgTreeNode[];
};

type DeleteMode = "reconnect" | "cascade";
type MobileDeleteCtx = QueryCtx | MutationCtx;
type DeleteImpact = {
  memberId: Id<"networkMembers">;
  memberName: string;
  status: NetworkMember["status"];
  hasLinkedAccount: boolean;
  directChildrenCount: number;
  totalDescendantCount: number;
  subtreeMemberCount: number;
  subtreeLinkedAccountCount: number;
};

function isOrgAdmin(viewer: Doc<"users">) {
  return viewer.email === "admin@luxurious.trade" || viewer.role === "admin";
}

async function requireOrgAdmin(ctx: MobileDeleteCtx) {
  const viewer = await requireMobileViewer(ctx);
  if (!isOrgAdmin(viewer)) {
    throw new Error("Admin access required.");
  }
  return viewer;
}

function buildParentLookup(members: NetworkMember[]) {
  const parentLookup = new Map<Id<"networkMembers"> | "root", NetworkMember[]>();

  for (const member of members) {
    const parentKey = member.parentMemberId ?? "root";
    const list = parentLookup.get(parentKey) ?? [];
    list.push(member);
    parentLookup.set(parentKey, list);
  }

  return parentLookup;
}

function getRank(totalDownlines: number) {
  if (totalDownlines >= 100) return "President";
  if (totalDownlines >= 50) return "Director";
  if (totalDownlines >= 20) return "Manager";
  if (totalDownlines >= 5) return "Lead";
  return "Member";
}

function buildTree(
  parentLookup: Map<Id<"networkMembers"> | "root", NetworkMember[]>,
  parentId: Id<"networkMembers"> | "root",
  latestAssetsMap?: Map<Id<"networkMembers">, { name: string; value: number; currency: string; createdAt: number } | null>
): OrgTreeNode[] {
  const children = parentLookup.get(parentId) ?? [];
  return children.map((member) => {
    const totalDownlines = countDescendants(parentLookup, member._id);
    const latestAsset = latestAssetsMap?.get(member._id) ?? null;
    return {
      id: member._id,
      parentMemberId: member.parentMemberId ?? null,
      name: member.name,
      roleTitle: member.roleTitle,
      status: member.status,
      isViewer: member.isViewer,
      directChildrenCount: (parentLookup.get(member._id) ?? []).length,
      totalDownlineCount: totalDownlines,
      allowAdd: true,
      latestAsset,
      member: {
        id: member.userId ?? (member._id as any),
        name: member.name,
        email: member.email ?? "",
        roleTitle: member.roleTitle,
        rank: getRank(totalDownlines),
        status: member.status,
        avatarInitials: member.name.substring(0, 2).toUpperCase(),
        totalDownlines: totalDownlines,
        invitedCount: 0,
        pendingCount: 0,
        uplineId: (member.parentMemberId as any),
        allowAdd: true,
        latestAsset,
      },
      children: buildTree(parentLookup, member._id, latestAssetsMap),
    };
  });
}

function countDescendants(
  parentLookup: Map<Id<"networkMembers"> | "root", NetworkMember[]>,
  memberId: Id<"networkMembers">,
): number {
  const children = parentLookup.get(memberId) ?? [];
  return children.reduce((sum, child) => sum + 1 + countDescendants(parentLookup, child._id), 0);
}

function collectDescendantIds(
  parentLookup: Map<Id<"networkMembers"> | "root", NetworkMember[]>,
  memberId: Id<"networkMembers">,
  target: Set<Id<"networkMembers">>,
) {
  const children = parentLookup.get(memberId) ?? [];
  for (const child of children) {
    target.add(child._id);
    collectDescendantIds(parentLookup, child._id, target);
  }
}

function listDescendantMembers(
  parentLookup: Map<Id<"networkMembers"> | "root", NetworkMember[]>,
  memberId: Id<"networkMembers">,
) {
  const descendants: NetworkMember[] = [];

  function walk(currentId: Id<"networkMembers">) {
    const children = parentLookup.get(currentId) ?? [];
    for (const child of children) {
      descendants.push(child);
      walk(child._id);
    }
  }

  walk(memberId);
  return descendants;
}

function buildDeleteImpact(
  parentLookup: Map<Id<"networkMembers"> | "root", NetworkMember[]>,
  member: NetworkMember,
): DeleteImpact {
  const directChildren = parentLookup.get(member._id) ?? [];
  const descendants = listDescendantMembers(parentLookup, member._id);
  const subtree = [member, ...descendants];

  return {
    memberId: member._id,
    memberName: member.name,
    status: member.status,
    hasLinkedAccount: member.userId !== undefined,
    directChildrenCount: directChildren.length,
    totalDescendantCount: descendants.length,
    subtreeMemberCount: subtree.length,
    subtreeLinkedAccountCount: subtree.filter((entry) => entry.userId !== undefined).length,
  };
}

function resolveParentUserId(nextParent: NetworkMember | null, viewer: Doc<"users">) {
  if (nextParent === null) {
    return null;
  }
  if (nextParent.isViewer) {
    return viewer._id;
  }
  return nextParent.userId ?? null;
}

async function purgeProfileScopedData(ctx: MutationCtx, profile: Doc<"mobileProfiles">) {
  const profileMembers = await ctx.db
    .query("networkMembers")
    .withIndex("by_profileId_and_sortOrder", (q) => q.eq("profileId", profile._id))
    .collect();
  for (const member of profileMembers) {
    await ctx.db.delete("networkMembers", member._id);
  }

  const notificationStates = await ctx.db
    .query("mobileNotificationStates")
    .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
    .collect();
  for (const row of notificationStates) {
    await ctx.db.delete("mobileNotificationStates", row._id);
  }

  const deviceTokens = await ctx.db
    .query("mobileDeviceTokens")
    .withIndex("by_profileId_and_updatedAt", (q) => q.eq("profileId", profile._id))
    .collect();
  for (const row of deviceTokens) {
    await ctx.db.delete("mobileDeviceTokens", row._id);
  }

  const transactions = await ctx.db
    .query("financialTransactions")
    .withIndex("by_profileId_and_occurredAt", (q) => q.eq("profileId", profile._id))
    .collect();
  for (const row of transactions) {
    await ctx.db.delete("financialTransactions", row._id);
  }

  const accounts = await ctx.db
    .query("financialAccounts")
    .withIndex("by_profileId_and_sortOrder", (q) => q.eq("profileId", profile._id))
    .collect();
  for (const row of accounts) {
    await ctx.db.delete("financialAccounts", row._id);
  }

  const budgets = await ctx.db
    .query("budgetPlans")
    .withIndex("by_profileId_and_sortOrder", (q) => q.eq("profileId", profile._id))
    .collect();
  for (const row of budgets) {
    await ctx.db.delete("budgetPlans", row._id);
  }

  const debts = await ctx.db
    .query("debtPlans")
    .withIndex("by_profileId_and_sortOrder", (q) => q.eq("profileId", profile._id))
    .collect();
  for (const row of debts) {
    await ctx.db.delete("debtPlans", row._id);
  }

  const installments = await ctx.db
    .query("installmentPlans")
    .withIndex("by_profileId_and_sortOrder", (q) => q.eq("profileId", profile._id))
    .collect();
  for (const row of installments) {
    await ctx.db.delete("installmentPlans", row._id);
  }

  const events = await ctx.db
    .query("events")
    .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
    .collect();
  for (const row of events) {
    await ctx.db.delete("events", row._id);
  }

  const receipts = await ctx.db
    .query("receipts")
    .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
    .collect();
  for (const row of receipts) {
    await ctx.storage.delete(row.storageId);
    await ctx.db.delete("receipts", row._id);
  }

  const shoppingItems = await ctx.db
    .query("shoppingItems")
    .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
    .collect();
  for (const row of shoppingItems) {
    await ctx.db.delete("shoppingItems", row._id);
  }

  const tickets = await ctx.db
    .query("tickets")
    .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
    .collect();
  for (const row of tickets) {
    await ctx.db.delete("tickets", row._id);
  }

  if (profile.avatarStorageId) {
    await ctx.storage.delete(profile.avatarStorageId);
  }

  await ctx.db.delete("mobileProfiles", profile._id);
}

async function purgeLinkedAccount(ctx: MutationCtx, userId: Id<"users">) {
  const user = await ctx.db.get("users", userId);
  if (!user) {
    return 0;
  }

  const profiles = await ctx.db
    .query("mobileProfiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();
  for (const profile of profiles) {
    await purgeProfileScopedData(ctx, profile);
  }

  const wallets = await ctx.db.query("wallets").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
  for (const row of wallets) {
    await ctx.db.delete("wallets", row._id);
  }

  const trades = await ctx.db.query("trades").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
  for (const row of trades) {
    await ctx.db.delete("trades", row._id);
  }

  const academyProgress = await ctx.db
    .query("academyProgress")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const row of academyProgress) {
    await ctx.db.delete("academyProgress", row._id);
  }

  const signalParticipation = await ctx.db
    .query("signalParticipation")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const row of signalParticipation) {
    await ctx.db.delete("signalParticipation", row._id);
  }

  const sessionAttendance = await ctx.db
    .query("sessionAttendance")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();
  for (const row of sessionAttendance) {
    await ctx.db.delete("sessionAttendance", row._id);
  }

  const invitations = await ctx.db
    .query("invitations")
    .withIndex("by_upline", (q) => q.eq("uplineId", userId))
    .collect();
  for (const row of invitations) {
    await ctx.db.delete("invitations", row._id);
  }

  const authAccounts = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
    .collect();
  const accountIds = new Set(authAccounts.map((row) => row._id));

  for (const accountId of accountIds) {
    const verificationCodes = await ctx.db
      .query("authVerificationCodes")
      .withIndex("accountId", (q) => q.eq("accountId", accountId))
      .collect();
    for (const row of verificationCodes) {
      await ctx.db.delete("authVerificationCodes", row._id);
    }
  }

  const authSessions = await ctx.db
    .query("authSessions")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .collect();
  const sessionIds = new Set(authSessions.map((row) => row._id));

  for (const sessionId of sessionIds) {
    const refreshTokens = await ctx.db
      .query("authRefreshTokens")
      .withIndex("sessionId", (q) => q.eq("sessionId", sessionId))
      .collect();
    for (const row of refreshTokens) {
      await ctx.db.delete("authRefreshTokens", row._id);
    }
  }

  const authVerifiers = await ctx.db.query("authVerifiers").collect();
  for (const row of authVerifiers) {
    if (row.sessionId && sessionIds.has(row.sessionId)) {
      await ctx.db.delete("authVerifiers", row._id);
    }
  }

  for (const row of authSessions) {
    await ctx.db.delete("authSessions", row._id);
  }

  for (const row of authAccounts) {
    await ctx.db.delete("authAccounts", row._id);
  }

  await ctx.db.delete("users", userId);
  return 1;
}

function buildOverview(
  members: NetworkMember[],
  directUpline?: NetworkMember | null,
  latestAssetsMap?: Map<Id<"networkMembers">, { name: string; value: number; currency: string; createdAt: number } | null>
) {
  const membersById = new Map<Id<"networkMembers">, NetworkMember>();
  const parentLookup = buildParentLookup(members);

  for (const member of members) {
    membersById.set(member._id, member);
  }

  const viewer = members.find((member) => member.isViewer) ?? null;
  let uplineCount = 0;
  let currentParentId = viewer?.parentMemberId ?? null;
  while (currentParentId) {
    const parent = membersById.get(currentParentId);
    if (!parent) {
      break;
    }
    uplineCount += 1;
    currentParentId = parent.parentMemberId ?? null;
  }

  const joinedCount = members.filter((member) => member.status === "joined").length;
  const invitedCount = members.filter((member) => member.status === "invited").length;
  const pendingCount = members.filter((member) => member.status === "pending").length;
  const directMembers = viewer ? parentLookup.get(viewer._id) ?? [] : [];
  const toInviteCount = Math.max(6 - directMembers.length, 0);
  const downlineCount = viewer ? countDescendants(parentLookup, viewer._id) : 0;

  let treeRoots: OrgTreeNode[] = [];
  if (viewer) {
    const totalDownlines = countDescendants(parentLookup, viewer._id);
    const latestAsset = latestAssetsMap?.get(viewer._id) ?? null;
    const viewerNode: OrgTreeNode = {
      id: viewer._id,
      parentMemberId: viewer.parentMemberId ?? null,
      name: viewer.name,
      roleTitle: viewer.roleTitle,
      status: viewer.status,
      isViewer: viewer.isViewer,
      directChildrenCount: (parentLookup.get(viewer._id) ?? []).length,
      totalDownlineCount: totalDownlines,
      allowAdd: true,
      latestAsset,
      member: {
        id: viewer.userId ?? (viewer._id as any),
        name: viewer.name,
        email: viewer.email ?? "",
        roleTitle: viewer.roleTitle,
        rank: getRank(totalDownlines),
        status: viewer.status,
        avatarInitials: viewer.name.substring(0, 2).toUpperCase(),
        totalDownlines: totalDownlines,
        invitedCount: 0,
        pendingCount: 0,
        uplineId: (viewer.parentMemberId as any),
        allowAdd: true,
        latestAsset,
      },
      children: buildTree(parentLookup, viewer._id, latestAssetsMap),
    };

    if (directUpline) {
      const uplineDownlines = totalDownlines + 1;
      const uplineAsset = latestAssetsMap?.get(directUpline._id) ?? null;
      treeRoots = [{
        id: directUpline._id,
        parentMemberId: directUpline.parentMemberId ?? null,
        name: directUpline.name,
        roleTitle: directUpline.roleTitle,
        status: directUpline.status,
        isViewer: false,
        directChildrenCount: 1,
        totalDownlineCount: uplineDownlines,
        allowAdd: false,
        latestAsset: uplineAsset,
        member: {
          id: directUpline.userId ?? (directUpline._id as any),
          name: directUpline.name,
          email: directUpline.email ?? "",
          roleTitle: directUpline.roleTitle,
          rank: getRank(uplineDownlines),
          status: directUpline.status,
          avatarInitials: directUpline.name.substring(0, 2).toUpperCase(),
          totalDownlines: uplineDownlines,
          invitedCount: 0,
          pendingCount: 0,
          uplineId: (directUpline.parentMemberId as any),
          allowAdd: false,
          latestAsset: uplineAsset,
        },
        children: [viewerNode],
      }];
    } else {
      treeRoots = buildTree(parentLookup, "root", latestAssetsMap);
    }
  } else {
    treeRoots = buildTree(parentLookup, "root");
  }

  return {
    viewer: viewer == null
        ? null
        : {
            id: viewer._id,
            name: viewer.name,
            roleTitle: viewer.roleTitle,
          },
    stats: {
      joinedCount,
      invitedCount,
      pendingCount,
      toInviteCount,
      uplinesCount: uplineCount,
      downlinesCount: downlineCount,
      totalNetworkCount: Math.max(0, uplineCount + downlineCount),
    },
    directMembers: directMembers.map((member) => ({
      id: member._id,
      name: member.name,
      roleTitle: member.roleTitle,
      status: member.status,
    })),
    members: members.map((member) => ({
      id: member._id,
      name: member.name,
      roleTitle: member.roleTitle,
      status: member.status,
      isViewer: member.isViewer,
      parentMemberId: member.parentMemberId ?? null,
      directChildrenCount: (parentLookup.get(member._id) ?? []).length,
      bonchatId: member.bonchatId,
      bonchatUsername: member.bonchatUsername,
      yepbitId: member.yepbitId,
      yepbitUsername: member.yepbitUsername,
      userId: member.userId,
      email: member.email,
    })),
    tree: treeRoots,
  };
}

export const getDashboard = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const members = await listUnifiedNetworkMembers(ctx, profile._id);
    let directUpline: Doc<"networkMembers"> | null = null;
    if (profile.userId) {
      const parentTreeMember = await ctx.db
        .query("networkMembers")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), profile.userId),
            q.eq(q.field("isViewer"), false)
          )
        )
        .first();
      if (parentTreeMember && parentTreeMember.parentMemberId) {
        directUpline = await ctx.db.get(parentTreeMember.parentMemberId);
      }
    }

    const allAssets = await ctx.db.query("memberAssets").collect();
    const latestAssetsMap = new Map<Id<"networkMembers">, { name: string; value: number; currency: string; createdAt: number } | null>();
    const assetsByMember = new Map<Id<"networkMembers">, Doc<"memberAssets">[]>();
    for (const asset of allAssets) {
      const list = assetsByMember.get(asset.memberId) ?? [];
      list.push(asset);
      assetsByMember.set(asset.memberId, list);
    }
    for (const [memberId, list] of assetsByMember.entries()) {
      list.sort((a, b) => b.createdAt - a.createdAt);
      const latest = list[0];
      if (latest) {
        latestAssetsMap.set(memberId, {
          name: latest.name,
          value: latest.value,
          currency: latest.currency,
          createdAt: latest.createdAt,
        });
      }
    }

    return buildOverview(members, directUpline, latestAssetsMap);
  },
});

export const getTree = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const members = await listUnifiedNetworkMembers(ctx, profile._id);
    let directUpline: Doc<"networkMembers"> | null = null;
    if (profile.userId) {
      const parentTreeMember = await ctx.db
        .query("networkMembers")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), profile.userId),
            q.eq(q.field("isViewer"), false)
          )
        )
        .first();
      if (parentTreeMember && parentTreeMember.parentMemberId) {
        directUpline = await ctx.db.get(parentTreeMember.parentMemberId);
      }
    }

    const allAssets = await ctx.db.query("memberAssets").collect();
    const latestAssetsMap = new Map<Id<"networkMembers">, { name: string; value: number; currency: string; createdAt: number } | null>();
    const assetsByMember = new Map<Id<"networkMembers">, Doc<"memberAssets">[]>();
    for (const asset of allAssets) {
      const list = assetsByMember.get(asset.memberId) ?? [];
      list.push(asset);
      assetsByMember.set(asset.memberId, list);
    }
    for (const [memberId, list] of assetsByMember.entries()) {
      list.sort((a, b) => b.createdAt - a.createdAt);
      const latest = list[0];
      if (latest) {
        latestAssetsMap.set(memberId, {
          name: latest.name,
          value: latest.value,
          currency: latest.currency,
          createdAt: latest.createdAt,
        });
      }
    }

    return buildOverview(members, directUpline, latestAssetsMap).tree;
  },
});

export const getDeleteMemberImpact = query({
  args: {
    memberId: v.id("networkMembers"),
  },
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx);
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const members = await listUnifiedNetworkMembers(ctx, profile._id);
    const member = members.find((entry) => entry._id === args.memberId) ?? null;

    if (!member) {
      throw new Error("Member not found.");
    }
    if (member.isViewer) {
      throw new Error("Viewer root cannot be deleted.");
    }

    return buildDeleteImpact(buildParentLookup(members), member);
  },
});

export const listMembers = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("joined"),
        v.literal("invited"),
        v.literal("pending"),
        v.literal("to-invite"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const members = await listUnifiedNetworkMembers(ctx, profile._id);
    const filtered = args.status
      ? members.filter((member) => member.status === args.status)
      : members;
    return buildOverview(filtered).members;
  },
});

export const listMembersPaginated = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("joined"),
        v.literal("invited"),
        v.literal("pending"),
        v.literal("to-invite"),
      ),
    ),
    search: v.optional(v.string()),
    sortBy: v.optional(v.union(v.literal("name"), v.literal("date"))),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    
    let query;
    if (args.status) {
      query = ctx.db
        .query("networkMembers")
        .withIndex("by_profileId_and_status", (q) => 
          q.eq("profileId", profile._id).eq("status", args.status as any)
        )
        .order("desc");
    } else {
      query = ctx.db
        .query("networkMembers")
        .withIndex("by_profileId_and_sortOrder", (q) => q.eq("profileId", profile._id))
        .order("desc");
    }

    const results = await query.paginate(args.paginationOpts);

    return {
      ...results,
      page: results.page.map((member) => ({
        id: member._id,
        name: member.name,
        roleTitle: member.roleTitle,
        status: member.status,
        isViewer: member.isViewer,
      })),
    };
  },
});

export const reassignMemberParent = mutation({
  args: {
    memberId: v.id("networkMembers"),
    newParentMemberId: v.union(v.id("networkMembers"), v.null()),
    reconnectChildren: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireMobileViewer(ctx);
    const isAdmin = viewer.email === "admin@luxurious.trade" || viewer.role === "admin";
    if (!isAdmin) {
      throw new Error("Admin access required.");
    }

    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const members = await listUnifiedNetworkMembers(ctx, profile._id);
    const parentLookup = buildParentLookup(members);

    const member = members.find((entry) => entry._id === args.memberId) ?? null;
    if (!member) {
      throw new Error("Member not found.");
    }
    if (member.isViewer) {
      throw new Error("Viewer root cannot be moved.");
    }

    const nextParent =
      args.newParentMemberId === null
        ? null
        : members.find((entry) => entry._id === args.newParentMemberId) ?? null;

    if (args.newParentMemberId !== null && nextParent === null) {
      throw new Error("New parent not found.");
    }
    if (nextParent?._id === member._id) {
      throw new Error("Member cannot be parent of itself.");
    }
    if (nextParent?.status !== undefined && nextParent.status !== "joined") {
      throw new Error("New parent must be joined.");
    }

    // Enforce max direct downlines on new parent
    if (nextParent) {
      const existingChildren = parentLookup.get(nextParent._id) ?? [];
      // Exclude the member being moved (they may already be a child of this parent)
      const netChildren = existingChildren.filter((c) => c._id !== member._id);
      if (netChildren.length >= MAX_DIRECT_DOWNLINES) {
        throw new Error(
          `Cannot reassign: ${nextParent.name} already has ${MAX_DIRECT_DOWNLINES} direct downlines.`,
        );
      }
    }

    const descendantIds = new Set<Id<"networkMembers">>();
    collectDescendantIds(parentLookup, member._id, descendantIds);
    if (nextParent && descendantIds.has(nextParent._id)) {
      throw new Error("Member cannot be moved under its own descendant.");
    }

    const now = Date.now();
    await ctx.db.patch(args.memberId, {
      parentMemberId: args.newParentMemberId,
      updatedAt: now,
    });

    if (args.reconnectChildren) {
      const existingParentId = member.parentMemberId;
      const directChildren = parentLookup.get(member._id) ?? [];
      for (const child of directChildren) {
        await ctx.db.patch(child._id, {
          parentMemberId: existingParentId,
          updatedAt: now,
        });
      }
    }

    return {
      success: true,
      memberId: member._id,
      newParentMemberId: args.newParentMemberId,
    };
  },
});

export const deleteMember = mutation({
  args: {
    memberId: v.id("networkMembers"),
    mode: v.union(v.literal("reconnect"), v.literal("cascade")),
    newParentMemberId: v.optional(v.union(v.id("networkMembers"), v.null())),
  },
  handler: async (ctx, args) => {
    const viewer = await requireOrgAdmin(ctx);
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const members = await listUnifiedNetworkMembers(ctx, profile._id);
    const parentLookup = buildParentLookup(members);
    const member = members.find((entry) => entry._id === args.memberId) ?? null;

    if (!member) {
      throw new Error("Member not found.");
    }
    if (member.isViewer) {
      throw new Error("Viewer root cannot be deleted.");
    }

    const directChildren = parentLookup.get(member._id) ?? [];
    const descendants = listDescendantMembers(parentLookup, member._id);
    const impact = buildDeleteImpact(parentLookup, member);
    const now = Date.now();

    let nextParent: NetworkMember | null = null;
    let requestedParentId: Id<"networkMembers"> | null = null;

    if (args.mode === "reconnect") {
      requestedParentId = args.newParentMemberId ?? null;

      if (requestedParentId !== null) {
        nextParent = members.find((entry) => entry._id === requestedParentId) ?? null;
        if (!nextParent) {
          throw new Error("New parent not found.");
        }
        if (nextParent._id === member._id) {
          throw new Error("Member cannot reconnect to itself.");
        }
        if (nextParent.status !== "joined") {
          throw new Error("New parent must be joined.");
        }
      }

      const descendantIds = new Set(descendants.map((entry) => entry._id));
      if (requestedParentId !== null && descendantIds.has(requestedParentId)) {
        throw new Error("Member cannot reconnect descendants under their own subtree.");
      }

      // Enforce max direct downlines on reconnect target
      if (nextParent) {
        const existingChildrenOfTarget = parentLookup.get(nextParent._id) ?? [];
        // Children of the deleted member will attach here; existing children minus the deleted member itself
        const currentCount = existingChildrenOfTarget.filter((c) => c._id !== member._id).length;
        if (currentCount + directChildren.length > MAX_DIRECT_DOWNLINES) {
          throw new Error(
            `Cannot reconnect: ${nextParent.name} would exceed ${MAX_DIRECT_DOWNLINES} direct downlines (has ${currentCount}, reconnecting ${directChildren.length}).`,
          );
        }
      }

      const nextParentUserId = resolveParentUserId(nextParent, viewer);
      for (const child of directChildren) {
        if (child.userId) {
          const childUser = await ctx.db.get("users", child.userId);
          if (childUser) {
            await ctx.db.patch("users", child.userId, {
              uplineId: nextParentUserId,
              lastUplineId: childUser.uplineId ?? null,
            });
          }
        }

        await ctx.db.patch("networkMembers", child._id, {
          parentMemberId: requestedParentId,
          updatedAt: now,
        });
      }
    }

    const membersToDelete = args.mode === "cascade" ? [...descendants, member] : [member];
    const userIdsToDelete = Array.from(
      new Set(
        membersToDelete
          .map((entry) => entry.userId)
          .filter((entry): entry is Id<"users"> => entry !== undefined),
      ),
    );

    let purgedAccountCount = 0;
    for (const userId of userIdsToDelete) {
      purgedAccountCount += await purgeLinkedAccount(ctx, userId);
    }

    for (const target of membersToDelete) {
      await ctx.db.delete("networkMembers", target._id);
    }

    return {
      success: true,
      mode: args.mode as DeleteMode,
      deletedMemberCount: membersToDelete.length,
      purgedAccountCount,
      affectedDownlineCount: impact.totalDescendantCount,
      reconnectedDownlineCount:
        args.mode === "reconnect" && requestedParentId !== null ? directChildren.length : 0,
      orphanedDownlineCount:
        args.mode === "reconnect" && requestedParentId === null ? directChildren.length : 0,
    };
  },
});


export const getMember = query({
  args: { memberId: v.id("networkMembers") },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const members = await listUnifiedNetworkMembers(ctx, profile._id);
    const member = members.find((entry) => entry._id === args.memberId) ?? null;
    if (!member) {
      return null;
    }
    const parentLookup = buildParentLookup(members);
    const directChildrenCount = (parentLookup.get(member._id) ?? []).length;
    const totalDownlines = countDescendants(parentLookup, member._id);
    const pendingCount = (parentLookup.get(member._id) ?? []).filter(c => c.status === "pending").length;

    const latestAssetDoc = await ctx.db
      .query("memberAssets")
      .withIndex("by_memberId", (q) => q.eq("memberId", args.memberId))
      .order("desc")
      .first();

    const latestAsset = latestAssetDoc
      ? {
          name: latestAssetDoc.name,
          value: latestAssetDoc.value,
          currency: latestAssetDoc.currency,
          createdAt: latestAssetDoc.createdAt,
        }
      : null;

    return {
      id: member._id,
      userId: member.userId,
      name: member.name,
      roleTitle: member.roleTitle,
      status: member.status,
      email: member.email,
      phone: member.phone,
      bonchatUsername: member.bonchatUsername,
      yepbitUsername: member.yepbitUsername,
      totalDownlines: totalDownlines,
      invitedCount: 0, // Placeholder
      directChildrenCount: directChildrenCount,
      pendingCount: pendingCount,
      latestAsset,
    };
  },
});

export const addMemberAsset = mutation({
  args: {
    memberId: v.id("networkMembers"),
    name: v.string(),
    value: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");

    const now = Date.now();
    const assetId = await ctx.db.insert("memberAssets", {
      memberId: args.memberId,
      name: args.name,
      value: args.value,
      currency: args.currency,
      createdAt: now,
    });
    return assetId;
  },
});

export const getMemberAssets = query({
  args: {
    memberId: v.id("networkMembers"),
  },
  handler: async (ctx, args) => {
    const assets = await ctx.db
      .query("memberAssets")
      .withIndex("by_memberId", (q) => q.eq("memberId", args.memberId))
      .collect();
    return assets.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const deleteMemberAsset = mutation({
  args: {
    assetId: v.id("memberAssets"),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) throw new Error("Asset not found");
    await ctx.db.delete(args.assetId);
  },
});

export const updateMemberAsset = mutation({
  args: {
    assetId: v.id("memberAssets"),
    value: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) throw new Error("Asset not found");
    await ctx.db.patch(args.assetId, {
      value: args.value,
      currency: args.currency,
    });
  },
});

