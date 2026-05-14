import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getMobileProfileForViewerOrThrow } from "./mobileHelpers";

export const getItems = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    return await ctx.db
      .query("shoppingItems")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .collect();
  },
});

export const addItem = mutation({
  args: {
    name: v.string(),
    quantity: v.string(),
    category: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    return await ctx.db.insert("shoppingItems", {
      ...args,
      profileId: profile._id,
      isChecked: false,
    });
  },
});

export const toggleItem = mutation({
  args: {
    id: v.id("shoppingItems"),
    isChecked: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("shoppingItems", args.id, { isChecked: args.isChecked });
  },
});

export const removeItem = mutation({
  args: { id: v.id("shoppingItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete("shoppingItems", args.id);
  },
});

export const clearChecked = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const checked = await ctx.db
      .query("shoppingItems")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .filter((q) => q.eq(q.field("isChecked"), true))
      .collect();

    for (const item of checked) {
      await ctx.db.delete("shoppingItems", item._id);
    }
  },
});
