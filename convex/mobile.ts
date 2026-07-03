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
    const viewer = await requireMobileViewer(ctx);
    const profile = await ensureMobileProfileForViewer(ctx);

    // M025: Auto-join default team if user has no teams and there is a default team
    const memberships = await ctx.db
      .query("teamMemberships")
      .withIndex("by_userId", (q) => q.eq("userId", viewer._id))
      .first();

    if (!memberships) {
      const defaultTeam = await ctx.db
        .query("teams")
        .withIndex("by_isDefault", (q) => q.eq("isDefault", true))
        .first();

      if (defaultTeam) {
        await ctx.db.insert("teamMemberships", {
          teamId: defaultTeam._id,
          userId: viewer._id,
          role: "member",
          joinedAt: Date.now(),
        });
        await ctx.db.patch(viewer._id, { activeTeamId: defaultTeam._id });
      }
    }

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

    // ── M025: Team context ──
    const memberships = await ctx.db
      .query("teamMemberships")
      .withIndex("by_userId", (q) => q.eq("userId", viewer._id))
      .take(50);

    const teams = [];
    for (const m of memberships) {
      const team = await ctx.db.get(m.teamId);
      if (team) {
        teams.push({
          _id: team._id,
          name: team.name,
          slug: team.slug,
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
      // M025
      activeTeamId,
      teams,
      hasTeams: teams.length > 0,
    };
  },
});
