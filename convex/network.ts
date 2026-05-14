import { query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import {
  getMobileProfileForViewerOrThrow,
  listNetworkMembersForProfile,
} from "./mobileHelpers";

type NetworkMember = Doc<"networkMembers">;

type OrgTreeNode = {
  id: Id<"networkMembers">;
  name: string;
  roleTitle: string;
  status: NetworkMember["status"];
  isViewer: boolean;
  children: OrgTreeNode[];
};

function buildTree(
  parentLookup: Map<Id<"networkMembers"> | "root", NetworkMember[]>,
  parentId: Id<"networkMembers"> | "root",
): OrgTreeNode[] {
  const children = parentLookup.get(parentId) ?? [];
  return children.map((member) => ({
    id: member._id,
    name: member.name,
    roleTitle: member.roleTitle,
    status: member.status,
    isViewer: member.isViewer,
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

function buildOverview(members: NetworkMember[]) {
  const membersById = new Map<Id<"networkMembers">, NetworkMember>();
  const parentLookup = new Map<Id<"networkMembers"> | "root", NetworkMember[]>();

  for (const member of members) {
    membersById.set(member._id, member);
    const parentKey = member.parentMemberId ?? "root";
    const list = parentLookup.get(parentKey) ?? [];
    list.push(member);
    parentLookup.set(parentKey, list);
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
    status: v.optional(v.union(v.literal("joined"), v.literal("invited"), v.literal("pending"))),
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
