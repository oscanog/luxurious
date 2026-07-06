import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";

export const DEFAULT_DIRECT_LIMIT = 3;
export const ROOT_ADMIN_EMAIL = "admin@luxurious.trade";
const MARKO_ADMIN_EMAIL = "sehun4244@gmail.com";

export type AdminLevel = 0 | 1 | 2 | 3;
type Ctx = QueryCtx | MutationCtx;
type UserLike = {
  _id?: Id<"users">;
  email?: string;
  name?: string;
  role?: string;
  adminLevel?: AdminLevel;
  activeTeamId?: Id<"teams">;
};
type ProfileLike =
  | Pick<Doc<"mobileProfiles">, "_id" | "userId">
  | null
  | undefined;
type MemberLike = Pick<
  Doc<"networkMembers">,
  | "_id"
  | "profileId"
  | "userId"
  | "isViewer"
  | "createdByUserId"
  | "ownedByUserId"
  | "directLimitOverride"
  | "status"
  | "teamId"
>;

// ── M025: Team Authorization ──
export async function requireTeamMembership(ctx: Ctx, teamId: Id<"teams"> | undefined) {
  const user = await requireAuthUser(ctx);
  const adminLevel = getUserAdminLevel(user);
  
  if (adminLevel >= 2 && adminLevel !== 3) {
    return { user, adminLevel };
  }
  
  if (!teamId) {
    throw new Error("Target team is required for authorization.");
  }
  
  const membership = await ctx.db
    .query("teamMemberships")
    .withIndex("by_teamId_and_userId", (q) =>
      q.eq("teamId", teamId).eq("userId", user._id),
    )
    .unique();
    
  if (!membership) {
    throw new Error("You do not have access to this team.");
  }
  
  return { user, adminLevel, membership };
}

function normalize(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function getUserAdminLevel(
  user: UserLike | null | undefined,
): AdminLevel {
  if (!user) {
    return 0;
  }
  const email = normalize(user.email);
  if (email === ROOT_ADMIN_EMAIL || email === MARKO_ADMIN_EMAIL) {
    return 2;
  }
  if (user.adminLevel === 3) {
    return 3;
  }
  if (user.adminLevel === 2) {
    return 2;
  }
  if (user.adminLevel === 1 || user.role === "admin") {
    return 1;
  }
  return 0;
}

export function isOrgAdmin(user: UserLike | null | undefined) {
  return getUserAdminLevel(user) >= 1;
}

export async function requireAuthUser(ctx: Ctx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  const user = await ctx.db.get("users", userId);
  if (!user) {
    throw new Error("Authenticated user missing.");
  }
  return user;
}

export async function requireAdminLevel(ctx: Ctx, minLevel: AdminLevel) {
  const user = await requireAuthUser(ctx);
  const adminLevel = getUserAdminLevel(user);
  // Level 3 is a specially constrained workspace admin, not automatically > 2.
  if (adminLevel < minLevel && !(minLevel === 3 && adminLevel === 3)) {
    throw new Error("Admin access required.");
  }
  return { user, adminLevel };
}

export function getEffectiveDirectLimit(
  member: MemberLike,
  currentDirectCount: number,
) {
  const configuredLimit =
    typeof member.directLimitOverride === "number" &&
    Number.isFinite(member.directLimitOverride)
      ? Math.max(DEFAULT_DIRECT_LIMIT, Math.floor(member.directLimitOverride))
      : DEFAULT_DIRECT_LIMIT;
  return Math.max(configuredLimit, currentDirectCount);
}

export function buildDirectStatusCounts(
  children: Array<Pick<Doc<"networkMembers">, "status">>,
) {
  return children.reduce(
    (counts, child) => {
      counts[child.status] += 1;
      return counts;
    },
    {
      joined: 0,
      invited: 0,
      pending: 0,
      "to-invite": 0,
    } as Record<Doc<"networkMembers">["status"], number>,
  );
}

export function canManageMember(
  viewer: UserLike,
  viewerProfile: ProfileLike,
  member: MemberLike,
  adminLevel = getUserAdminLevel(viewer),
) {
  if (adminLevel >= 2) {
    return true;
  }
  
  // M025: Enforce strict team boundary check if activeTeamId is present on user
  if (viewer.activeTeamId !== undefined && member.teamId !== undefined && viewer.activeTeamId !== member.teamId) {
     return false;
  }

  if (viewer._id && member.userId === viewer._id) {
    return true;
  }
  if (
    viewer._id &&
    (member.createdByUserId === viewer._id ||
      member.ownedByUserId === viewer._id)
  ) {
    return true;
  }
  return Boolean(
    viewerProfile &&
    member.isViewer &&
    viewerProfile.userId === viewer._id &&
    member.profileId === viewerProfile._id,
  );
}

export function canAddUnderParent(
  viewer: UserLike,
  viewerProfile: ProfileLike,
  parent: MemberLike,
  adminLevel = getUserAdminLevel(viewer),
) {
  if (adminLevel >= 2) {
    return true;
  }
  
  // M025: Enforce strict team boundary check
  if (viewer.activeTeamId !== undefined && parent.teamId !== undefined && viewer.activeTeamId !== parent.teamId) {
     return false;
  }
  return (
    (viewer._id !== undefined && parent.userId === viewer._id) ||
    (viewer._id !== undefined && parent.createdByUserId === viewer._id) ||
    (viewer._id !== undefined && parent.ownedByUserId === viewer._id) ||
    Boolean(
      viewerProfile &&
      parent.isViewer &&
      viewerProfile.userId === viewer._id &&
      parent.profileId === viewerProfile._id,
    )
  );
}

export function resolveOwnedByUserId(
  viewerId: Id<"users">,
  parent: Pick<
    Doc<"networkMembers">,
    "userId" | "ownedByUserId" | "createdByUserId"
  >,
) {
  return (
    parent.userId ?? parent.ownedByUserId ?? parent.createdByUserId ?? viewerId
  );
}
