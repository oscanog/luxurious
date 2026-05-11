import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── Queries ──────────────────────────────────────────────────

export const getLevels = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("academyLevels")
      .withIndex("by_order")
      .order("asc")
      .take(20);
  },
});

export const getLessons = query({
  args: { levelId: v.id("academyLevels") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("academyLessons")
      .withIndex("by_level", (q) => q.eq("levelId", args.levelId))
      .take(20);
  },
});

export const getLesson = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("academyLessons")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const getUserProgress = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("academyProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(100);
  },
});

// ── Mutations ────────────────────────────────────────────────

export const completeLesson = mutation({
  args: { lessonSlug: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if already completed
    const existing = await ctx.db
      .query("academyProgress")
      .withIndex("by_user_and_slug", (q) =>
        q.eq("userId", userId).eq("lessonSlug", args.lessonSlug)
      )
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("academyProgress", {
      userId,
      lessonSlug: args.lessonSlug,
      completedAt: Date.now(),
    });
  },
});

// ── Admin CRUD ───────────────────────────────────────────────

export const upsertLevel = mutation({
  args: {
    id: v.optional(v.id("academyLevels")),
    order: v.number(),
    title: v.string(),
    subtitle: v.string(),
    color: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.id) {
      await ctx.db.patch("academyLevels", args.id, {
        order: args.order,
        title: args.title,
        subtitle: args.subtitle,
        color: args.color,
        description: args.description,
      });
      return args.id;
    }
    return await ctx.db.insert("academyLevels", {
      order: args.order,
      title: args.title,
      subtitle: args.subtitle,
      color: args.color,
      description: args.description,
    });
  },
});

export const upsertLesson = mutation({
  args: {
    id: v.optional(v.id("academyLessons")),
    levelId: v.id("academyLevels"),
    order: v.number(),
    slug: v.string(),
    title: v.string(),
    duration: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.id) {
      await ctx.db.patch("academyLessons", args.id, {
        levelId: args.levelId,
        order: args.order,
        slug: args.slug,
        title: args.title,
        duration: args.duration,
        content: args.content,
      });
      return args.id;
    }
    return await ctx.db.insert("academyLessons", {
      levelId: args.levelId,
      order: args.order,
      slug: args.slug,
      title: args.title,
      duration: args.duration,
      content: args.content,
    });
  },
});

export const deleteLevel = mutation({
  args: { id: v.id("academyLevels") },
  handler: async (ctx, args) => {
    // Delete all lessons in this level first
    const lessons = await ctx.db
      .query("academyLessons")
      .withIndex("by_level", (q) => q.eq("levelId", args.id))
      .take(50);
    for (const lesson of lessons) {
      await ctx.db.delete("academyLessons", lesson._id);
    }
    await ctx.db.delete("academyLevels", args.id);
  },
});

export const deleteLesson = mutation({
  args: { id: v.id("academyLessons") },
  handler: async (ctx, args) => {
    await ctx.db.delete("academyLessons", args.id);
  },
});

// ── Seed (internal) ──────────────────────────────────────────

export const seedLevel = internalMutation({
  args: {
    order: v.number(),
    title: v.string(),
    subtitle: v.string(),
    color: v.string(),
    description: v.string(),
    lessons: v.array(
      v.object({
        order: v.number(),
        slug: v.string(),
        title: v.string(),
        duration: v.string(),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Check if level already exists
    const existing = await ctx.db
      .query("academyLevels")
      .withIndex("by_order", (q) => q.eq("order", args.order))
      .unique();

    let levelId;
    if (existing) {
      await ctx.db.patch("academyLevels", existing._id, {
        title: args.title,
        subtitle: args.subtitle,
        color: args.color,
        description: args.description,
      });
      levelId = existing._id;
    } else {
      levelId = await ctx.db.insert("academyLevels", {
        order: args.order,
        title: args.title,
        subtitle: args.subtitle,
        color: args.color,
        description: args.description,
      });
    }

    for (const lesson of args.lessons) {
      const existingLesson = await ctx.db
        .query("academyLessons")
        .withIndex("by_slug", (q) => q.eq("slug", lesson.slug))
        .unique();

      if (existingLesson) {
        await ctx.db.patch("academyLessons", existingLesson._id, {
          levelId,
          order: lesson.order,
          title: lesson.title,
          duration: lesson.duration,
          content: lesson.content,
        });
      } else {
        await ctx.db.insert("academyLessons", {
          levelId,
          ...lesson,
        });
      }
    }

    return levelId;
  },
});
