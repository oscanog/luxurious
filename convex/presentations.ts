import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// ── Helpers ─────────────────────────────────────────────────────────────────

async function requireAdmin(ctx: { auth: { getUserIdentity: () => Promise<unknown> }; db: { get: (id: Id<"users">) => Promise<{ role?: string } | null> } }) {
  const userId = await getAuthUserId(ctx as any);
  if (!userId) throw new Error("Unauthorized");
  const user = await ctx.db.get(userId);
  if (!user || user.role !== "admin") throw new Error("Admin only");
  return userId;
}

function blankSlideJson(): string {
  return JSON.stringify({
    version: "6.0.0",
    objects: [],
    background: "#ffffff",
  });
}

// ── Queries ──────────────────────────────────────────────────────────────────

/** List all non-archived presentations for the admin grid view. */
export const list = query({
  args: {
    search: v.optional(v.string()),
    sortBy: v.optional(v.union(v.literal("updatedAt"), v.literal("title"))),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") return [];

    let items = await ctx.db
      .query("presentations")
      .withIndex("by_isArchived", (q) =>
        q.eq("isArchived", args.includeArchived ?? false)
      )
      .order("desc")
      .collect();

    // Search filter
    if (args.search && args.search.trim()) {
      const term = args.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          (p.description ?? "").toLowerCase().includes(term) ||
          (p.tags ?? []).some((t) => t.toLowerCase().includes(term))
      );
    }

    // Sort
    const sortBy = args.sortBy ?? "updatedAt";
    const sortOrder = args.sortOrder ?? "desc";
    items.sort((a, b) => {
      if (sortBy === "title") {
        return sortOrder === "asc"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
      return sortOrder === "asc"
        ? a.updatedAt - b.updatedAt
        : b.updatedAt - a.updatedAt;
    });

    // Augment with cover thumbnail URLs
    return await Promise.all(
      items.map(async (p) => ({
        _id: p._id,
        title: p.title,
        description: p.description,
        slideCount: p.slides.length,
        slideWidth: p.slideWidth,
        slideHeight: p.slideHeight,
        updatedAt: p.updatedAt,
        isArchived: p.isArchived,
        tags: p.tags,
        coverJson: p.slides[0]?.canvasJson,
        coverThumbnailUrl: p.coverThumbnail
          ? await ctx.storage.getUrl(p.coverThumbnail)
          : null,
      }))
    );
  },
});

/** Get a full presentation with all slides. Editor load. */
export const get = query({
  args: { id: v.id("presentations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") return null;

    const p = await ctx.db.get(args.id);
    if (!p) return null;

    // Augment slide thumbnails
    const slides = await Promise.all(
      p.slides.map(async (s) => ({
        ...s,
        thumbnailUrl: s.thumbnail ? await ctx.storage.getUrl(s.thumbnail) : null,
      }))
    );

    return {
      ...p,
      slides,
      coverThumbnailUrl: p.coverThumbnail
        ? await ctx.storage.getUrl(p.coverThumbnail)
        : null,
    };
  },
});

/** List available starter templates. */
export const listTemplates = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let templates = args.category
      ? await ctx.db
          .query("presentationTemplates")
          .withIndex("by_category", (q) => q.eq("category", args.category!))
          .collect()
      : await ctx.db.query("presentationTemplates").collect();

    return await Promise.all(
      templates.map(async (t) => ({
        _id: t._id,
        name: t.name,
        category: t.category,
        slideCount: t.slides.length,
        slideWidth: t.slideWidth,
        slideHeight: t.slideHeight,
        thumbnailUrl: t.thumbnail ? await ctx.storage.getUrl(t.thumbnail) : null,
      }))
    );
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Create a new presentation from blank or an existing template. */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    templateId: v.optional(v.id("presentationTemplates")),
    slideWidth: v.optional(v.number()),
    slideHeight: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAdmin(ctx);
    let w = args.slideWidth ?? 1920;
    let h = args.slideHeight ?? 1080;

    let slides: Array<{ id: string; canvasJson: string; order: number }> = [];

    if (args.templateId) {
      const tmpl = await ctx.db.get(args.templateId);
      if (tmpl) {
        w = tmpl.slideWidth;
        h = tmpl.slideHeight;
        slides = tmpl.slides.map((s, i) => ({
          id: crypto.randomUUID(),
          canvasJson: s.canvasJson,
          order: i,
        }));
      }
    }

    if (slides.length === 0) {
      slides = [{ id: crypto.randomUUID(), canvasJson: blankSlideJson(), order: 0 }];
    }

    const id = await ctx.db.insert("presentations", {
      title: args.title,
      description: args.description,
      slides,
      slideWidth: w,
      slideHeight: h,
      createdBy: userId,
      updatedAt: Date.now(),
      isArchived: false,
    });

    return id;
  },
});

/** Update presentation metadata and/or slides (full slide array replacement). */
export const update = mutation({
  args: {
    id: v.id("presentations"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    slides: v.optional(
      v.array(
        v.object({
          id: v.string(),
          canvasJson: v.string(),
          order: v.number(),
          thumbnail: v.optional(v.id("_storage")),
          transition: v.optional(v.string()),
          transitionDuration: v.optional(v.number()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...fields } = args;

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (fields.title !== undefined) patch.title = fields.title;
    if (fields.description !== undefined) patch.description = fields.description;
    if (fields.tags !== undefined) patch.tags = fields.tags;
    if (fields.slides !== undefined) patch.slides = fields.slides;

    await ctx.db.patch(id, patch);
  },
});

/** Reorder slides by providing the new ordered array of slide IDs. */
export const updateSlideOrder = mutation({
  args: {
    id: v.id("presentations"),
    orderedSlideIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const p = await ctx.db.get(args.id);
    if (!p) throw new Error("Presentation not found");

    const slideMap = new Map(p.slides.map((s) => [s.id, s]));
    const reordered = args.orderedSlideIds
      .map((sid, i) => {
        const s = slideMap.get(sid);
        if (!s) return null;
        return { ...s, order: i };
      })
      .filter(Boolean) as typeof p.slides;

    await ctx.db.patch(args.id, { slides: reordered, updatedAt: Date.now() });
  },
});

/** Deep clone a presentation. Returns new ID. */
export const duplicate = mutation({
  args: { id: v.id("presentations") },
  handler: async (ctx, args) => {
    const userId = await requireAdmin(ctx);
    const original = await ctx.db.get(args.id);
    if (!original) throw new Error("Not found");

    const newSlides = original.slides.map((s) => ({
      id: crypto.randomUUID(),
      canvasJson: s.canvasJson,
      order: s.order,
      // Skip thumbnails — they'll be regenerated in the editor
    }));

    const newId = await ctx.db.insert("presentations", {
      title: `${original.title} (Copy)`,
      description: original.description,
      slides: newSlides,
      slideWidth: original.slideWidth,
      slideHeight: original.slideHeight,
      createdBy: userId,
      updatedAt: Date.now(),
      isArchived: false,
      tags: original.tags,
    });

    return newId;
  },
});

/** Soft-delete: mark as archived. */
export const archive = mutation({
  args: { id: v.id("presentations") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, { isArchived: true, updatedAt: Date.now() });
  },
});

/** Hard delete: remove record and all associated storage blobs. */
export const hardDelete = mutation({
  args: { id: v.id("presentations") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const p = await ctx.db.get(args.id);
    if (!p) return;

    // Delete slide thumbnails
    for (const slide of p.slides) {
      if (slide.thumbnail) {
        await ctx.storage.delete(slide.thumbnail);
      }
    }
    // Delete cover thumbnail
    if (p.coverThumbnail) {
      await ctx.storage.delete(p.coverThumbnail);
    }

    await ctx.db.delete(args.id);
  },
});

/** Generate a Convex storage upload URL for images/media in the editor. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Save a slide or cover thumbnail after generating it on the client. */
export const saveThumbnail = mutation({
  args: {
    presentationId: v.id("presentations"),
    slideId: v.optional(v.string()), // if omitted → cover thumbnail
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const p = await ctx.db.get(args.presentationId);
    if (!p) throw new Error("Not found");

    if (!args.slideId) {
      // Cover thumbnail
      await ctx.db.patch(args.presentationId, {
        coverThumbnail: args.storageId,
        updatedAt: Date.now(),
      });
    } else {
      // Slide thumbnail
      const slides = p.slides.map((s) =>
        s.id === args.slideId ? { ...s, thumbnail: args.storageId } : s
      );
      await ctx.db.patch(args.presentationId, { slides, updatedAt: Date.now() });
    }
  },
});

/** Save current presentation as a reusable template. */
export const saveAsTemplate = mutation({
  args: {
    presentationId: v.id("presentations"),
    name: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const p = await ctx.db.get(args.presentationId);
    if (!p) throw new Error("Not found");

    const slides = p.slides.map((s) => ({
      id: crypto.randomUUID(),
      canvasJson: s.canvasJson,
      order: s.order,
    }));

    const id = await ctx.db.insert("presentationTemplates", {
      name: args.name,
      category: args.category,
      slides,
      slideWidth: p.slideWidth,
      slideHeight: p.slideHeight,
      isSystem: false,
    });

    return id;
  },
});
