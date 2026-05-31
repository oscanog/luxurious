import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export const hasPasswordAccount = internalQuery({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    if (!email) {
      return false;
    }

    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", email),
      )
      .take(1);

    return accounts.length > 0;
  },
});
