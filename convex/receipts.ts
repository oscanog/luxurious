import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getMobileProfileForViewerOrThrow } from "./mobileHelpers";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const saveReceipt = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    
    const receiptId = await ctx.db.insert("receipts", {
      profileId: profile._id,
      storageId: args.storageId,
      status: "pending",
    });

    // Mock OCR parsing after a delay or just set some dummy data
    // In a real app, this would be an action calling an OCR service
    return receiptId;
  },
});

export const getReceipts = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const receipts = await ctx.db
      .query("receipts")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .order("desc")
      .collect();

    return await Promise.all(
      receipts.map(async (r) => ({
        ...r,
        url: await ctx.storage.getUrl(r.storageId),
      }))
    );
  },
});

export const updateReceipt = mutation({
  args: {
    id: v.id("receipts"),
    vendor: v.string(),
    totalAmount: v.number(),
    date: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch("receipts", id, {
      ...data,
      status: "processed",
    });
  },
});
