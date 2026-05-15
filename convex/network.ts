import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import {
  getMobileProfileForViewerOrThrow,
  listNetworkMembersForProfile,
  requireMobileViewer,
} from "./mobileHelpers";

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
    bonchatUsername: v.optional(v.string()),
    yepbitUsername: v.optional(v.string()),
    bonchatId: v.optional(v.string()),
    yepbitId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const member = await ctx.db.get(args.memberId);
    
    if (!member || member.profileId !== profile._id) {
      throw new Error("Member not found or access denied.");
    }

    await ctx.db.patch(args.memberId, {
      bonchatUsername: args.bonchatUsername,
      yepbitUsername: args.yepbitUsername,
      bonchatId: args.bonchatId,
      yepbitId: args.yepbitId,
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
  children: OrgTreeNode[];
};

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

function buildTree(
  parentLookup: Map<Id<"networkMembers"> | "root", NetworkMember[]>,
  parentId: Id<"networkMembers"> | "root",
): OrgTreeNode[] {
  const children = parentLookup.get(parentId) ?? [];
  return children.map((member) => ({
    id: member._id,
    parentMemberId: member.parentMemberId ?? null,
    name: member.name,
    roleTitle: member.roleTitle,
    status: member.status,
    isViewer: member.isViewer,
    directChildrenCount: (parentLookup.get(member._id) ?? []).length,
    totalDownlineCount: countDescendants(parentLookup, member._id),
    children: buildTree(parentLookup, member._id),
  }));
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

function buildOverview(members: NetworkMember[]) {
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

  let treeRoots = buildTree(parentLookup, "root");
  if (treeRoots.length === 0 && viewer) {
    treeRoots = buildTree(parentLookup, viewer._id);
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
      bonchatId: member.bonchatId,
      bonchatUsername: member.bonchatUsername,
      yepbitId: member.yepbitId,
      yepbitUsername: member.yepbitUsername,
    })),
    tree: treeRoots,
  };
}

export const getDashboard = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const members = await listNetworkMembersForProfile(ctx, profile._id);
    return buildOverview(members);
  },
});

export const getTree = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const members = await listNetworkMembersForProfile(ctx, profile._id);
    return buildOverview(members).tree;
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
    const members = await listNetworkMembersForProfile(ctx, profile._id);
    const filtered = args.status
      ? members.filter((member) => member.status === args.status)
      : members;
    return buildOverview(filtered).members;
  },
});

export const reassignMemberParent = mutation({
  args: {
    memberId: v.id("networkMembers"),
    newParentMemberId: v.union(v.id("networkMembers"), v.null()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireMobileViewer(ctx);
    const isAdmin = viewer.email === "admin@luxurious.trade" || viewer.role === "admin";
    if (!isAdmin) {
      throw new Error("Admin access required.");
    }

    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const members = await listNetworkMembersForProfile(ctx, profile._id);
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

    const descendantIds = new Set<Id<"networkMembers">>();
    collectDescendantIds(parentLookup, member._id, descendantIds);
    if (nextParent && descendantIds.has(nextParent._id)) {
      throw new Error("Member cannot be moved under its own descendant.");
    }

    await ctx.db.patch(args.memberId, {
      parentMemberId: args.newParentMemberId,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      memberId: member._id,
      newParentMemberId: args.newParentMemberId,
    };
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
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    
    const query = ctx.db
      .query("networkMembers")
      .withIndex("by_profileId_and_sortOrder", (q) => q.eq("profileId", profile._id));

    const result = await query.paginate(args.paginationOpts);

    let page = result.page;
    
    // Filter
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      page = page.filter((m) => 
        m.name.toLowerCase().includes(searchLower) || 
        m.roleTitle.toLowerCase().includes(searchLower)
      );
    }
    
    if (args.status) {
      page = page.filter((m) => m.status === args.status);
    }

    // Sort
    if (args.sortBy) {
      page.sort((a, b) => {
        let valA: any = a.name;
        let valB: any = b.name;
        if (args.sortBy === "date") {
          valA = a._creationTime;
          valB = b._creationTime;
        }
        
        const order = args.sortOrder === "desc" ? -1 : 1;
        if (valA < valB) return -1 * order;
        if (valA > valB) return 1 * order;
        return 0;
      });
    }

    return {
      ...result,
      page: page.map((member) => ({
        id: member._id,
        name: member.name,
        roleTitle: member.roleTitle,
        status: member.status,
        isViewer: member.isViewer,
        parentMemberId: member.parentMemberId ?? null,
        bonchatId: member.bonchatId,
        bonchatUsername: member.bonchatUsername,
        yepbitId: member.yepbitId,
        yepbitUsername: member.yepbitUsername,
      })),
    };
  },
});
