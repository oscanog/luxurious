import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("invitations")
      .withIndex("by_upline", (q) => q.eq("uplineId", userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Check for existing pending invite
    const existing = await ctx.db
      .query("invitations")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existing) {
      throw new Error("A pending invitation already exists for this email.");
    }

    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    
    const id = await ctx.db.insert("invitations", {
      uplineId: userId,
      email: args.email,
      status: "pending",
      sentAt: Date.now(),
      code,
    });

    return await ctx.db.get("invitations", id);
  },
});

export const revoke = mutation({
  args: {
    id: v.id("invitations"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const invite = await ctx.db.get("invitations", args.id);
    if (!invite || invite.uplineId !== userId) {
      throw new Error("Invitation not found or unauthorized");
    }

    if (invite.status !== "pending") {
      throw new Error("Only pending invitations can be revoked");
    }

    await ctx.db.delete("invitations", args.id);
  },
});

export const resend = mutation({
  args: {
    id: v.id("invitations"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const invite = await ctx.db.get("invitations", args.id);
    if (!invite || invite.uplineId !== userId) {
      throw new Error("Invitation not found or unauthorized");
    }

    // In a real app, this would trigger an email send.
    // For now, we just update the sentAt timestamp.
    await ctx.db.patch("invitations", args.id, {
      sentAt: Date.now(),
    });
  },
});
