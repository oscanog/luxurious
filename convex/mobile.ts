import { mutation, query } from "./_generated/server";
import {
  ensureMobileProfileForViewer,
  getMobileProfileForViewer,
  requireMobileViewer,
} from "./mobileHelpers";
import { getUserAdminLevel } from "./orgAccess";

export const bootstrap = mutation({
  args: {},
  handler: async (ctx) => {
    await requireMobileViewer(ctx);
    const profile = await ensureMobileProfileForViewer(ctx);

    // No auto-join. Users must explicitly use TeamJoinScreen if they have no teams.

    return {
      profileId: profile?._id ?? null,
      displayName: profile?.displayName ?? "Trader",
      preferredCurrencyCode: profile?.preferredCurrencyCode ?? "USD",
    };
  },
});

export const status = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireMobileViewer(ctx);
    const profile = await getMobileProfileForViewer(ctx);
    const adminLevel = getUserAdminLevel(viewer);
    const canPromoteAdmins = adminLevel >= 2;
    const canManageAnyVisibleMember = adminLevel >= 2;
    const canManageCapacity = adminLevel >= 2;
    // M026: Workspace Admin (Level 3 or Level 2)
    const canManageWorkspace = adminLevel >= 2;

    // ── M025: Team context ──
    const memberships = await ctx.db
      .query("teamMemberships")
      .withIndex("by_userId", (q) => q.eq("userId", viewer._id))
      .take(50);

    const teams = [];
    for (const m of memberships) {
      const team = await ctx.db.get(m.teamId);
      if (team) {
        let logoUrl = null;
        if (team.logoId) {
          logoUrl = await ctx.storage.getUrl(team.logoId);
        }
        teams.push({
          _id: team._id,
          name: team.name,
          slug: team.slug,
          logoUrl: logoUrl,
          role: m.role,
          isDefault: team.isDefault,
        });
      }
    }

    // Resolve active team
    let activeTeamId = viewer.activeTeamId ?? null;
    if (!activeTeamId && teams.length > 0) {
      activeTeamId = teams[0]._id;
    }

    return {
      ready: profile !== null,
      profileId: profile?._id ?? null,
      displayName: profile?.displayName ?? null,
      preferredCurrencyCode: profile?.preferredCurrencyCode ?? null,
      user: {
        id: viewer._id,
        name: viewer.name ?? "Trader",
        email: viewer.email ?? "",
        role: viewer.role ?? "member",
        adminLevel,
      },
      isAdmin: adminLevel >= 1,
      adminLevel,
      canPromoteAdmins,
      canManageAnyVisibleMember,
      canManageCapacity,
      canManageWorkspace,
      // M025
      activeTeamId,
      teams,
      hasTeams: teams.length > 0,
    };
  },
});
