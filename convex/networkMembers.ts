import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getMobileProfileForViewerOrThrow } from "./mobileHelpers";

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
    
    // Security check
    if (member.profileId !== profile._id) {
      const user = await ctx.db.get(profile.userId!);
      if (user?.role !== "admin") {
        throw new Error("Unauthorized");
      }
    }

    const { memberId, ...updates } = args;
    await ctx.db.patch(memberId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});
