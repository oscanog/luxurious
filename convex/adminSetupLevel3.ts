import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const setupWorkspaceAdmins = mutation({
  args: {},
  handler: async (ctx) => {
    const targets = [
      { email: "erwin.almendrala@gmail.com", teamSlug: "teambechayerwinwin" },
      { email: "sehun4244@gmail.com", teamSlug: "default" },
    ];

    let updated = 0;

    for (const target of targets) {
      // Find the user
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", target.email))
        .first();

      if (!user) {
        console.warn(`User ${target.email} not found.`);
        continue;
      }

      // Find the team
      const team = await ctx.db
        .query("teams")
        .withIndex("by_slug", (q) => q.eq("slug", target.teamSlug))
        .first();

      if (!team) {
        console.warn(`Team ${target.teamSlug} not found.`);
        continue;
      }

      // Ensure membership exists and make them super_admin/admin of team
      const membership = await ctx.db
        .query("teamMemberships")
        .withIndex("by_teamId_and_userId", (q) =>
          q.eq("teamId", team._id).eq("userId", user._id)
        )
        .first();

      if (!membership) {
        await ctx.db.insert("teamMemberships", {
          teamId: team._id,
          userId: user._id,
          role: "super_admin",
          joinedAt: Date.now(),
        });
      } else if (membership.role !== "super_admin") {
        await ctx.db.patch(membership._id, { role: "super_admin" });
      }

      // Patch the user to Level 3 and set active team
      await ctx.db.patch(user._id, {
        adminLevel: 3,
        activeTeamId: team._id,
      });

      updated++;
    }

    return `Successfully setup ${updated} Workspace Admins.`;
  },
});
