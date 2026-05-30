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
    const profile = await ensureMobileProfileForViewer(ctx);
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
    };
  },
});
