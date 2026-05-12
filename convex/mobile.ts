import { mutation, query } from "./_generated/server";
import {
  ensureMobileProfileForViewer,
  getMobileProfileForViewer,
  requireMobileViewer,
} from "./mobileHelpers";

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
    const isAdmin = viewer.email === "admin@luxurious.trade" || viewer.role === "admin";

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
      },
      isAdmin,
    };
  },
});
