import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // Optionally check if the user is an admin before generating upload URL
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can upload APKs");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

export const listActiveReleases = query({
  args: {},
  handler: async (ctx) => {
    const releases = await ctx.db
      .query("apkReleases")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .order("desc")
      .collect();

    // Augment with file URLs
    return await Promise.all(
      releases.map(async (release) => {
        const fileUrl = await ctx.storage.getUrl(release.storageId);
        return {
          ...release,
          fileUrl,
        };
      })
    );
  },
});

export const publishRelease = mutation({
  args: {
    version: v.string(),
    buildNumber: v.number(),
    releaseNotes: v.string(),
    storageId: v.id("_storage"),
    fileSize: v.number(),
    fileName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can publish APKs");
    }

    const releaseId = await ctx.db.insert("apkReleases", {
      version: args.version,
      buildNumber: args.buildNumber,
      releaseNotes: args.releaseNotes,
      storageId: args.storageId,
      fileSize: args.fileSize,
      fileName: args.fileName,
      isActive: true,
      publishedAt: Date.now(),
      uploadedBy: userId,
    });

    return releaseId;
  },
});

export const deleteRelease = mutation({
  args: {
    id: v.id("apkReleases"),
    hardDelete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can delete APKs");
    }

    if (args.hardDelete) {
      const release = await ctx.db.get(args.id);
      if (release) {
        await ctx.storage.delete(release.storageId);
        await ctx.db.delete(args.id);
      }
    } else {
      await ctx.db.patch(args.id, { isActive: false });
    }
  },
});
