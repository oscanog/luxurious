import {
  ActionCtx,
  MutationCtx,
  QueryCtx,
  action,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { getMobileProfileByUserId, requireMobileViewer } from "./mobileHelpers";

const FEED_LIMIT = 15;
const COMMENT_LIMIT = 25;
const MAX_MEDIA_ITEMS = 10;
const MAX_VIDEO_ITEMS = 3;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 250 * 1024 * 1024;
const MAX_TOTAL_VIDEO_DURATION_MS = 10 * 60 * 1000;
const MAX_CAPTION_LENGTH = 2200;
const MAX_HASHTAGS = 20;

const DEMO_AUTHORS = [
  {
    name: "Alice Rivera",
    email: "alice@luxurious.trade",
    role: "admin" as const,
    balance: 50000,
  },
  {
    name: "Clara Mendoza",
    email: "clara@luxurious.trade",
    role: "member" as const,
    balance: 10000,
  },
  {
    name: "David Lim",
    email: "david@luxurious.trade",
    role: "member" as const,
    balance: 25000,
  },
  {
    name: "Eva Nakamura",
    email: "eva@luxurious.trade",
    role: "admin" as const,
    balance: 75000,
  },
];

const DEMO_POSTS = [
  {
    authorEmail: "alice@luxurious.trade",
    caption: "London open focus today. Clean structure. #luxurious #trading #london",
    visibility: "public" as const,
    imageUrl: "https://picsum.photos/id/1011/1600/1100.jpg",
    fileName: "london-open.jpg",
    hoursAgo: 3,
  },
  {
    authorEmail: "clara@luxurious.trade",
    caption: "Small team meetup after session. Good energy. #community #lux",
    visibility: "public" as const,
    imageUrl: "https://picsum.photos/id/1015/1600/1100.jpg",
    fileName: "team-meetup.jpg",
    hoursAgo: 6,
  },
  {
    authorEmail: "david@luxurious.trade",
    caption: "Chart review board ready for tomorrow push. #analysis #setup #markets",
    visibility: "public" as const,
    imageUrl: "https://picsum.photos/id/1025/1600/1100.jpg",
    fileName: "chart-review.jpg",
    hoursAgo: 11,
  },
  {
    authorEmail: "eva@luxurious.trade",
    caption: "Private notes from leadership planning. #planning #leadership",
    visibility: "private" as const,
    imageUrl: "https://picsum.photos/id/1039/1600/1100.jpg",
    fileName: "leadership-planning.jpg",
    hoursAgo: 18,
  },
  {
    authorEmail: "alice@luxurious.trade",
    caption: "Desk setup sharp tonight. Waiting for New York volatility. #newyork #desk",
    visibility: "public" as const,
    imageUrl: "https://picsum.photos/id/1043/1600/1100.jpg",
    fileName: "desk-setup.jpg",
    hoursAgo: 24,
  },
  {
    authorEmail: "clara@luxurious.trade",
    caption: "Weekly recap card for members. Stay consistent. #recap #mindset",
    visibility: "public" as const,
    imageUrl: "https://picsum.photos/id/1060/1600/1100.jpg",
    fileName: "weekly-recap.jpg",
    hoursAgo: 31,
  },
];

type Viewer = Doc<"users">;
type SocialPost = Doc<"socialPosts">;
type SocialComment = Doc<"socialPostComments">;
type SocialMediaAsset = Doc<"socialMediaAssets">;
type SocialPostMedia = Doc<"socialPostMedia">;
type SocialReadCtx = QueryCtx | MutationCtx;

type FeedScope = "all" | "mine" | "saved";

function isAdmin(viewer: Viewer) {
  return viewer.email === "admin@luxurious.trade" || viewer.role === "admin";
}

function normalizeHashtag(value: string) {
  return value.trim().toLowerCase();
}

function extractHashtags(caption: string) {
  const tags = new Set<string>();
  const matches = caption.matchAll(/(^|\s)#([a-z0-9]+)/gi);
  for (const match of matches) {
    const raw = match[2];
    if (!raw) {
      continue;
    }
    tags.add(normalizeHashtag(raw));
    if (tags.size >= MAX_HASHTAGS) {
      break;
    }
  }
  return Array.from(tags);
}

function formatRelativeTime(timestamp: number) {
  const elapsedMinutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }
  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }
  const elapsedDays = Math.round(elapsedHours / 24);
  return `${elapsedDays}d ago`;
}

function canViewPost(viewer: Viewer, post: SocialPost) {
  if (post.lifecycle !== "published") {
    return post.authorUserId === viewer._id || isAdmin(viewer);
  }
  if (post.moderationStatus === "removed") {
    return post.authorUserId === viewer._id || isAdmin(viewer);
  }
  if (post.visibility === "public") {
    return true;
  }
  return post.authorUserId === viewer._id || isAdmin(viewer);
}

async function getAuthorCard(ctx: SocialReadCtx, authorUserId: Id<"users">) {
  const author = await ctx.db.get("users", authorUserId);
  if (!author) {
    throw new Error("Author missing.");
  }
  const profile = await getMobileProfileByUserId(ctx, author._id);
  const displayName =
    profile?.displayName?.trim() ||
    author.name?.trim() ||
    author.email?.split("@")[0] ||
    "Trader";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const avatarUrl = profile?.avatarStorageId
    ? await ctx.storage.getUrl(profile.avatarStorageId)
    : null;
  return {
    userId: author._id,
    profileId: profile?._id ?? null,
    displayName,
    initials: initials || "TR",
    avatarUrl,
  };
}

async function getActiveDraftPost(ctx: SocialReadCtx, userId: Id<"users">) {
  const drafts = await ctx.db
    .query("socialPosts")
    .withIndex("by_authorUserId_and_lifecycle_and_updatedAt", (q) =>
      q.eq("authorUserId", userId).eq("lifecycle", "draft"),
    )
    .order("desc")
    .take(2);
  return drafts[0] ?? null;
}

async function listPostMediaRows(ctx: SocialReadCtx, postId: Id<"socialPosts">) {
  return await ctx.db
    .query("socialPostMedia")
    .withIndex("by_postId_and_sortOrder", (q) => q.eq("postId", postId))
    .take(MAX_MEDIA_ITEMS);
}

async function getMediaLink(ctx: SocialReadCtx, row: SocialPostMedia) {
  const asset = await ctx.db.get("socialMediaAssets", row.assetId);
  if (!asset) {
    return null;
  }
  const playbackStorageId = asset.processedStorageId ?? asset.originalStorageId;
  const url = await ctx.storage.getUrl(playbackStorageId);
  const posterUrl = asset.posterStorageId ? await ctx.storage.getUrl(asset.posterStorageId) : null;
  return {
    assetId: asset._id,
    kind: asset.kind,
    mimeType: asset.processedMimeType ?? asset.mimeType,
    url,
    posterUrl,
    width: asset.width ?? null,
    height: asset.height ?? null,
    durationMs: asset.durationMs ?? null,
    processingStatus: asset.processingStatus,
    fileName: asset.fileName ?? null,
    altText: row.altText ?? null,
    sortOrder: row.sortOrder,
  };
}

async function listPostMediaLinks(ctx: SocialReadCtx, postId: Id<"socialPosts">) {
  const rows = await listPostMediaRows(ctx, postId);
  const media = await Promise.all(rows.map((row) => getMediaLink(ctx, row)));
  return media.filter((item) => item !== null);
}

async function countReadyAssets(ctx: SocialReadCtx, postId: Id<"socialPosts">) {
  const rows = await listPostMediaRows(ctx, postId);
  let readyCount = 0;
  for (const row of rows) {
    const asset = await ctx.db.get("socialMediaAssets", row.assetId);
    if (asset?.processingStatus === "ready") {
      readyCount += 1;
    }
  }
  return readyCount;
}

async function getAssetSummaries(ctx: SocialReadCtx, postId: Id<"socialPosts">) {
  const rows = await listPostMediaRows(ctx, postId);
  const summaries: SocialMediaAsset[] = [];
  for (const row of rows) {
    const asset = await ctx.db.get("socialMediaAssets", row.assetId);
    if (asset) {
      summaries.push(asset);
    }
  }
  return summaries;
}

async function syncPostCounts(ctx: MutationCtx, postId: Id<"socialPosts">) {
  const mediaCount = (await listPostMediaRows(ctx, postId)).length;
  await ctx.db.patch("socialPosts", postId, {
    mediaCount,
    updatedAt: Date.now(),
  });
}

async function syncPostHashtags(
  ctx: MutationCtx,
  postId: Id<"socialPosts">,
  hashtags: string[],
  createdAt: number,
) {
  const existing = await ctx.db
    .query("socialPostHashtags")
    .withIndex("by_postId", (q) => q.eq("postId", postId))
    .take(32);
  for (const row of existing) {
    await ctx.db.delete("socialPostHashtags", row._id);
  }
  for (const hashtag of hashtags) {
    await ctx.db.insert("socialPostHashtags", {
      postId,
      hashtag,
      createdAt,
    });
  }
}

async function buildCommentPayload(
  ctx: SocialReadCtx,
  viewer: Viewer,
  comment: SocialComment,
  post: SocialPost,
) {
  const author = await getAuthorCard(ctx, comment.authorUserId);
  const viewerOwnsPost = post.authorUserId === viewer._id;
  const viewerOwnsComment = comment.authorUserId === viewer._id;
  return {
    id: comment._id,
    body: comment.status === "visible" ? comment.body : "Comment removed",
    status: comment.status,
    createdAt: comment.createdAt,
    relativeTime: formatRelativeTime(comment.createdAt),
    author,
    canDelete: viewerOwnsComment || viewerOwnsPost || isAdmin(viewer),
  };
}

async function buildPostPayload(ctx: SocialReadCtx, viewer: Viewer, post: SocialPost) {
  const author = await getAuthorCard(ctx, post.authorUserId);
  const media = await listPostMediaLinks(ctx, post._id);
  const likeRow = await ctx.db
    .query("socialPostLikes")
    .withIndex("by_postId_and_userId", (q) => q.eq("postId", post._id).eq("userId", viewer._id))
    .unique();
  const saveRow = await ctx.db
    .query("socialSavedPosts")
    .withIndex("by_postId_and_userId", (q) => q.eq("postId", post._id).eq("userId", viewer._id))
    .unique();
  const commentRows = await ctx.db
    .query("socialPostComments")
    .withIndex("by_postId_and_createdAt", (q) => q.eq("postId", post._id))
    .order("desc")
    .take(2);
  const commentPreview = [];
  for (let index = commentRows.length - 1; index >= 0; index -= 1) {
    const row = commentRows[index];
    if (!row || row.status !== "visible") {
      continue;
    }
    commentPreview.push(await buildCommentPayload(ctx, viewer, row, post));
  }

  return {
    id: post._id,
    caption: post.caption ?? "",
    hashtags: post.hashtags,
    visibility: post.visibility,
    lifecycle: post.lifecycle,
    moderationStatus: post.moderationStatus,
    mediaCount: post.mediaCount,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    saveCount: post.saveCount,
    publishedAt: post.publishedAt ?? null,
    updatedAt: post.updatedAt,
    relativeTime: formatRelativeTime(post.publishedAt ?? post.updatedAt),
    sharePath: `/social-feed/post/${post._id}`,
    author,
    media,
    viewerState: {
      liked: likeRow !== null,
      saved: saveRow !== null,
      isOwner: post.authorUserId === viewer._id,
      isAdmin: isAdmin(viewer),
    },
    commentPreview,
  };
}

function assertCaption(value: string) {
  if (value.length > MAX_CAPTION_LENGTH) {
    throw new Error(`Caption too long. Max ${MAX_CAPTION_LENGTH} characters.`);
  }
}

function assertHashtagCount(hashtags: string[]) {
  if (hashtags.length > MAX_HASHTAGS) {
    throw new Error(`Too many hashtags. Max ${MAX_HASHTAGS}.`);
  }
}

function assertPostMediaRules(assets: SocialMediaAsset[]) {
  if (assets.length === 0) {
    throw new Error("Post needs at least one media item.");
  }
  if (assets.length > MAX_MEDIA_ITEMS) {
    throw new Error(`Too many media items. Max ${MAX_MEDIA_ITEMS}.`);
  }
  const videoItems = assets.filter((asset) => asset.kind === "video");
  if (videoItems.length > MAX_VIDEO_ITEMS) {
    throw new Error(`Too many videos. Max ${MAX_VIDEO_ITEMS}.`);
  }
  const totalVideoDurationMs = videoItems.reduce((sum, asset) => sum + (asset.durationMs ?? 0), 0);
  if (totalVideoDurationMs > MAX_TOTAL_VIDEO_DURATION_MS) {
    throw new Error("Total video duration too long.");
  }
  if (assets.some((asset) => asset.processingStatus !== "ready")) {
    throw new Error("All media must be ready before publish.");
  }
}

function ensureMimeKind(kind: "image" | "video", mimeType: string) {
  if (kind === "image" && !["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
    throw new Error("Unsupported image type.");
  }
  if (kind === "video" && !["video/mp4", "video/quicktime"].includes(mimeType)) {
    throw new Error("Unsupported video type.");
  }
}

async function requireOwnedDraft(
  ctx: SocialReadCtx,
  viewer: Viewer,
  postId: Id<"socialPosts">,
) {
  const post = await ctx.db.get("socialPosts", postId);
  if (!post) {
    throw new Error("Draft not found.");
  }
  if (post.authorUserId !== viewer._id) {
    throw new Error("Draft ownership mismatch.");
  }
  if (post.lifecycle !== "draft") {
    throw new Error("Draft no longer editable.");
  }
  return post;
}

export const seedDemoPost = internalMutation({
  args: {
    authorUserId: v.id("users"),
    caption: v.string(),
    visibility: v.union(v.literal("public"), v.literal("private")),
    storageId: v.id("_storage"),
    fileName: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    publishedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("socialPosts")
      .withIndex("by_authorUserId_and_lifecycle_and_createdAt", (q) =>
        q.eq("authorUserId", args.authorUserId).eq("lifecycle", "published"),
      )
      .take(24);
    const duplicate = existing.find((post) => post.caption === args.caption);
    if (duplicate) {
      return { postId: duplicate._id, created: false };
    }

    const authorProfile = await getMobileProfileByUserId(ctx, args.authorUserId);
    const hashtags = extractHashtags(args.caption);
    const now = Date.now();
    const assetId = await ctx.db.insert("socialMediaAssets", {
      ownerUserId: args.authorUserId,
      ownerProfileId: authorProfile?._id,
      originalStorageId: args.storageId,
      processedStorageId: args.storageId,
      kind: "image",
      mimeType: args.mimeType,
      processedMimeType: args.mimeType,
      fileName: args.fileName,
      sizeBytes: args.sizeBytes,
      processedSizeBytes: args.sizeBytes,
      processingStatus: "ready",
      transcodeProfile: "seed-remote-image",
      sourceExtension: args.fileName.split(".").pop()?.toLowerCase(),
      createdAt: args.publishedAt,
      updatedAt: now,
    });
    const postId = await ctx.db.insert("socialPosts", {
      authorUserId: args.authorUserId,
      authorProfileId: authorProfile?._id,
      caption: args.caption,
      hashtags,
      visibility: args.visibility,
      lifecycle: "published",
      moderationStatus: "clear",
      mediaCount: 1,
      likeCount: 0,
      commentCount: 0,
      saveCount: 0,
      publishedAt: args.publishedAt,
      lastEditedAt: args.publishedAt,
      createdAt: args.publishedAt,
      updatedAt: now,
    });
    await ctx.db.insert("socialPostMedia", {
      postId,
      assetId,
      sortOrder: 0,
      createdAt: args.publishedAt,
    });
    await syncPostHashtags(ctx, postId, hashtags, args.publishedAt);
    return { postId, created: true };
  },
});

async function ensureDemoAuthor(actionCtx: ActionCtx, author: (typeof DEMO_AUTHORS)[number]) {
  const userId = await actionCtx.runMutation(internal.seed.ensureSeedUser, {
    name: author.name,
    email: author.email,
    role: author.role,
    balance: author.balance,
  });
  return userId;
}

export const seedDemoData = action({
  args: {},
  handler: async (ctx) => {
    const userIdsByEmail = new Map<string, Id<"users">>();
    for (const author of DEMO_AUTHORS) {
      const userId = await ensureDemoAuthor(ctx, author);
      userIdsByEmail.set(author.email, userId);
    }

    let created = 0;
    let skipped = 0;
    for (const [index, entry] of DEMO_POSTS.entries()) {
      const authorUserId = userIdsByEmail.get(entry.authorEmail);
      if (!authorUserId) {
        continue;
      }
      const response = await fetch(entry.imageUrl);
      if (!response.ok) {
        throw new Error(`Seed image fetch failed: ${entry.imageUrl}`);
      }
      const blob = await response.blob();
      const storageId = await ctx.storage.store(blob);
      const result = await ctx.runMutation(internal.socialFeed.seedDemoPost, {
        authorUserId,
        caption: entry.caption,
        visibility: entry.visibility,
        storageId,
        fileName: entry.fileName,
        mimeType: blob.type || "image/jpeg",
        sizeBytes: blob.size,
        publishedAt: Date.now() - ((entry.hoursAgo * 60 * 60 * 1000) + index),
      });
      if (result.created) {
        created += 1;
      } else {
        skipped += 1;
      }
    }

    return {
      created,
      skipped,
      totalPosts: DEMO_POSTS.length,
    };
  },
});

export const getHomeFeed = query({
  args: {
    scope: v.optional(v.union(v.literal("all"), v.literal("mine"), v.literal("saved"))),
    hashtag: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireMobileViewer(ctx);
    const limit = Math.min(Math.max(args.limit ?? FEED_LIMIT, 1), 30);
    const scope: FeedScope = args.scope ?? "all";
    const normalizedHashtag = args.hashtag ? normalizeHashtag(args.hashtag) : null;
    const posts: SocialPost[] = [];
    const seen = new Set<string>();

    if (scope === "mine") {
      const authored = await ctx.db
        .query("socialPosts")
        .withIndex("by_authorUserId_and_lifecycle_and_createdAt", (q) =>
          q.eq("authorUserId", viewer._id).eq("lifecycle", "published"),
        )
        .order("desc")
        .take(limit * 2);
      for (const post of authored) {
        if (normalizedHashtag && !post.hashtags.includes(normalizedHashtag)) {
          continue;
        }
        posts.push(post);
        if (posts.length >= limit) {
          break;
        }
      }
    } else if (scope === "saved") {
      const saved = await ctx.db
        .query("socialSavedPosts")
        .withIndex("by_userId_and_createdAt", (q) => q.eq("userId", viewer._id))
        .order("desc")
        .take(limit * 4);
      for (const row of saved) {
        const post = await ctx.db.get("socialPosts", row.postId);
        if (!post || !canViewPost(viewer, post) || post.lifecycle !== "published") {
          continue;
        }
        if (normalizedHashtag && !post.hashtags.includes(normalizedHashtag)) {
          continue;
        }
        if (seen.has(post._id)) {
          continue;
        }
        seen.add(post._id);
        posts.push(post);
        if (posts.length >= limit) {
          break;
        }
      }
    } else if (normalizedHashtag) {
      const hashtagRows = await ctx.db
        .query("socialPostHashtags")
        .withIndex("by_hashtag_and_createdAt", (q) => q.eq("hashtag", normalizedHashtag))
        .order("desc")
        .take(limit * 4);
      for (const row of hashtagRows) {
        const post = await ctx.db.get("socialPosts", row.postId);
        if (!post || !canViewPost(viewer, post) || post.lifecycle !== "published") {
          continue;
        }
        if (seen.has(post._id)) {
          continue;
        }
        seen.add(post._id);
        posts.push(post);
        if (posts.length >= limit) {
          break;
        }
      }
    } else {
      const publicPosts = await ctx.db
        .query("socialPosts")
        .withIndex("by_lifecycle_and_visibility_and_publishedAt", (q) =>
          q.eq("lifecycle", "published").eq("visibility", "public"),
        )
        .order("desc")
        .take(limit);
      posts.push(...publicPosts.filter((post) => post.moderationStatus !== "removed"));
    }

    return await Promise.all(posts.map((post) => buildPostPayload(ctx, viewer, post)));
  },
});

export const getMyActiveDraft = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireMobileViewer(ctx);
    const draft = await getActiveDraftPost(ctx, viewer._id);
    if (!draft) {
      return null;
    }
    const media = await listPostMediaLinks(ctx, draft._id);
    return {
      id: draft._id,
      caption: draft.caption ?? "",
      hashtags: draft.hashtags,
      visibility: draft.visibility,
      lifecycle: draft.lifecycle,
      mediaCount: draft.mediaCount,
      updatedAt: draft.updatedAt,
      lastEditedAt: draft.lastEditedAt,
      media,
      readyMediaCount: await countReadyAssets(ctx, draft._id),
    };
  },
});

export const getPostDetail = query({
  args: {
    postId: v.id("socialPosts"),
    commentLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireMobileViewer(ctx);
    const post = await ctx.db.get("socialPosts", args.postId);
    if (!post) {
      return null;
    }
    if (!canViewPost(viewer, post)) {
      throw new Error("Post not visible.");
    }
    const payload = await buildPostPayload(ctx, viewer, post);
    const rows = await ctx.db
      .query("socialPostComments")
      .withIndex("by_postId_and_createdAt", (q) => q.eq("postId", post._id))
      .take(Math.min(Math.max(args.commentLimit ?? COMMENT_LIMIT, 1), 100));
    const comments = [];
    for (const row of rows) {
      comments.push(await buildCommentPayload(ctx, viewer, row, post));
    }
    return {
      ...payload,
      comments,
    };
  },
});

export const getAuthorPosts = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireMobileViewer(ctx);
    const limit = Math.min(Math.max(args.limit ?? 12, 1), 30);
    const posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_authorUserId_and_lifecycle_and_createdAt", (q) =>
        q.eq("authorUserId", args.userId).eq("lifecycle", "published"),
      )
      .order("desc")
      .take(limit * 3);

    const visiblePosts: SocialPost[] = [];
    for (const post of posts) {
      if (!canViewPost(viewer, post)) {
        continue;
      }
      visiblePosts.push(post);
      if (visiblePosts.length >= limit) {
        break;
      }
    }

    return {
      author: await getAuthorCard(ctx, args.userId),
      posts: await Promise.all(visiblePosts.map((post) => buildPostPayload(ctx, viewer, post))),
    };
  },
});

export const listComments = query({
  args: {
    postId: v.id("socialPosts"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireMobileViewer(ctx);
    const post = await ctx.db.get("socialPosts", args.postId);
    if (!post) {
      return [];
    }
    if (!canViewPost(viewer, post)) {
      throw new Error("Post not visible.");
    }
    const rows = await ctx.db
      .query("socialPostComments")
      .withIndex("by_postId_and_createdAt", (q) => q.eq("postId", args.postId))
      .take(Math.min(Math.max(args.limit ?? COMMENT_LIMIT, 1), 100));
    return await Promise.all(rows.map((row) => buildCommentPayload(ctx, viewer, row, post)));
  },
});

export const createDraft = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireMobileViewer(ctx);
    const existing = await getActiveDraftPost(ctx, viewer._id);
    if (existing) {
      return existing._id;
    }
    const profile = await getMobileProfileByUserId(ctx, viewer._id);
    const now = Date.now();
    return await ctx.db.insert("socialPosts", {
      authorUserId: viewer._id,
      authorProfileId: profile?._id,
      caption: "",
      hashtags: [],
      visibility: "public",
      lifecycle: "draft",
      moderationStatus: "clear",
      mediaCount: 0,
      likeCount: 0,
      commentCount: 0,
      saveCount: 0,
      lastEditedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateDraft = mutation({
  args: {
    postId: v.id("socialPosts"),
    caption: v.optional(v.string()),
    visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
  },
  handler: async (ctx, args) => {
    const viewer = await requireMobileViewer(ctx);
    const post = await requireOwnedDraft(ctx, viewer, args.postId);
    const caption = args.caption ?? post.caption ?? "";
    assertCaption(caption);
    const hashtags = extractHashtags(caption);
    assertHashtagCount(hashtags);
    const now = Date.now();
    await ctx.db.patch("socialPosts", post._id, {
      caption,
      hashtags,
      visibility: args.visibility ?? post.visibility,
      lastEditedAt: now,
      updatedAt: now,
    });
    await syncPostHashtags(ctx, post._id, hashtags, now);
    return {
      ok: true,
      hashtags,
      updatedAt: now,
    };
  },
});

export const discardDraft = mutation({
  args: {
    postId: v.id("socialPosts"),
  },
  handler: async (ctx, args) => {
    const viewer = await requireMobileViewer(ctx);
    const post = await requireOwnedDraft(ctx, viewer, args.postId);
    await ctx.db.patch("socialPosts", post._id, {
      lifecycle: "deleted",
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const generateMediaUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireMobileViewer(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const attachDraftMedia = mutation({
  args: {
    postId: v.id("socialPosts"),
    storageId: v.id("_storage"),
    kind: v.union(v.literal("image"), v.literal("video")),
    mimeType: v.string(),
    fileName: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    durationMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireMobileViewer(ctx);
    const post = await requireOwnedDraft(ctx, viewer, args.postId);
    const mediaRows = await listPostMediaRows(ctx, post._id);
    if (mediaRows.length >= MAX_MEDIA_ITEMS) {
      throw new Error(`Too many media items. Max ${MAX_MEDIA_ITEMS}.`);
    }

    const metadata = await ctx.db.system.get("_storage", args.storageId);
    if (!metadata) {
      throw new Error("Uploaded media missing.");
    }
    const mimeType = metadata.contentType ?? args.mimeType;
    ensureMimeKind(args.kind, mimeType);
    if (args.kind === "image" && metadata.size > MAX_IMAGE_BYTES) {
      throw new Error("Image too large.");
    }
    if (args.kind === "video" && metadata.size > MAX_VIDEO_BYTES) {
      throw new Error("Video too large.");
    }

    const existingAssets = await getAssetSummaries(ctx, post._id);
    const nextAssets = [
      ...existingAssets,
      {
        _id: "pending" as Id<"socialMediaAssets">,
        _creationTime: Date.now(),
        ownerUserId: viewer._id,
        ownerProfileId: post.authorProfileId,
        originalStorageId: args.storageId,
        processedStorageId: args.storageId,
        kind: args.kind,
        mimeType,
        processedMimeType: mimeType,
        fileName: args.fileName,
        sizeBytes: metadata.size,
        processedSizeBytes: metadata.size,
        width: args.width,
        height: args.height,
        durationMs: args.durationMs,
        posterStorageId: undefined,
        processingStatus: "ready" as const,
        processingError: undefined,
        transcodeProfile: "raw-v1",
        checksum: metadata.sha256,
        sourceExtension: args.fileName?.split(".").pop()?.toLowerCase(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    assertPostMediaRules(nextAssets);

    const now = Date.now();
    const assetId = await ctx.db.insert("socialMediaAssets", {
      ownerUserId: viewer._id,
      ownerProfileId: post.authorProfileId,
      originalStorageId: args.storageId,
      processedStorageId: args.storageId,
      kind: args.kind,
      mimeType,
      processedMimeType: mimeType,
      fileName: args.fileName,
      sizeBytes: metadata.size,
      processedSizeBytes: metadata.size,
      width: args.width,
      height: args.height,
      durationMs: args.durationMs,
      processingStatus: "ready",
      transcodeProfile: "raw-v1",
      checksum: metadata.sha256,
      sourceExtension: args.fileName?.split(".").pop()?.toLowerCase(),
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("socialPostMedia", {
      postId: post._id,
      assetId,
      sortOrder: mediaRows.length,
      createdAt: now,
    });
    await syncPostCounts(ctx, post._id);
    await ctx.db.patch("socialPosts", post._id, {
      lastEditedAt: now,
      updatedAt: now,
    });
    return { assetId };
  },
});

export const reorderDraftMedia = mutation({
  args: {
    postId: v.id("socialPosts"),
    orderedAssetIds: v.array(v.id("socialMediaAssets")),
  },
  handler: async (ctx, args) => {
    const viewer = await requireMobileViewer(ctx);
    const post = await requireOwnedDraft(ctx, viewer, args.postId);
    const rows = await listPostMediaRows(ctx, post._id);
    if (rows.length !== args.orderedAssetIds.length) {
      throw new Error("Media reorder mismatch.");
    }
    const rowByAssetId = new Map(rows.map((row) => [row.assetId, row]));
    for (let index = 0; index < args.orderedAssetIds.length; index += 1) {
      const assetId = args.orderedAssetIds[index];
      const row = rowByAssetId.get(assetId);
      if (!row) {
        throw new Error("Media item missing.");
      }
      await ctx.db.patch("socialPostMedia", row._id, { sortOrder: index });
    }
    await ctx.db.patch("socialPosts", post._id, {
      lastEditedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const removeDraftMedia = mutation({
  args: {
    postId: v.id("socialPosts"),
    assetId: v.id("socialMediaAssets"),
  },
  handler: async (ctx, args) => {
    const viewer = await requireMobileViewer(ctx);
    const post = await requireOwnedDraft(ctx, viewer, args.postId);
    const rows = await listPostMediaRows(ctx, post._id);
    const target = rows.find((row) => row.assetId === args.assetId);
    if (!target) {
      throw new Error("Media item missing.");
    }
    await ctx.db.delete("socialPostMedia", target._id);
    const remaining = rows.filter((row) => row._id !== target._id);
    for (let index = 0; index < remaining.length; index += 1) {
      const row = remaining[index];
      if (row.sortOrder !== index) {
        await ctx.db.patch("socialPostMedia", row._id, { sortOrder: index });
      }
    }
    await syncPostCounts(ctx, post._id);
    await ctx.db.patch("socialPosts", post._id, {
      lastEditedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const publishDraft = mutation({
  args: {
    postId: v.id("socialPosts"),
  },
  handler: async (ctx, args) => {
    const viewer = await requireMobileViewer(ctx);
    const post = await requireOwnedDraft(ctx, viewer, args.postId);
    const caption = post.caption ?? "";
    assertCaption(caption);
    const hashtags = extractHashtags(caption);
    assertHashtagCount(hashtags);
    const assets = await getAssetSummaries(ctx, post._id);
    assertPostMediaRules(assets);
    const now = Date.now();
    await ctx.db.patch("socialPosts", post._id, {
      caption,
      hashtags,
      lifecycle: "published",
      publishedAt: now,
      lastEditedAt: now,
      updatedAt: now,
    });
    await syncPostHashtags(ctx, post._id, hashtags, now);
    return {
      postId: post._id,
      sharePath: `/social-feed/post/${post._id}`,
    };
  },
});

export const toggleLike = mutation({
  args: {
    postId: v.id("socialPosts"),
  },
  handler: async (ctx, args) => {
    const viewer = await requireMobileViewer(ctx);
    const post = await ctx.db.get("socialPosts", args.postId);
    if (!post || !canViewPost(viewer, post)) {
      throw new Error("Post not visible.");
    }
    const existing = await ctx.db
      .query("socialPostLikes")
      .withIndex("by_postId_and_userId", (q) => q.eq("postId", post._id).eq("userId", viewer._id))
      .unique();
    if (existing) {
      await ctx.db.delete("socialPostLikes", existing._id);
      await ctx.db.patch("socialPosts", post._id, {
        likeCount: Math.max(0, post.likeCount - 1),
        updatedAt: Date.now(),
      });
      return { liked: false };
    }
    await ctx.db.insert("socialPostLikes", {
      postId: post._id,
      userId: viewer._id,
      createdAt: Date.now(),
    });
    await ctx.db.patch("socialPosts", post._id, {
      likeCount: post.likeCount + 1,
      updatedAt: Date.now(),
    });
    return { liked: true };
  },
});

export const toggleSave = mutation({
  args: {
    postId: v.id("socialPosts"),
  },
  handler: async (ctx, args) => {
    const viewer = await requireMobileViewer(ctx);
    const post = await ctx.db.get("socialPosts", args.postId);
    if (!post || !canViewPost(viewer, post)) {
      throw new Error("Post not visible.");
    }
    const existing = await ctx.db
      .query("socialSavedPosts")
      .withIndex("by_postId_and_userId", (q) => q.eq("postId", post._id).eq("userId", viewer._id))
      .unique();
    if (existing) {
      await ctx.db.delete("socialSavedPosts", existing._id);
      await ctx.db.patch("socialPosts", post._id, {
        saveCount: Math.max(0, post.saveCount - 1),
        updatedAt: Date.now(),
      });
      return { saved: false };
    }
    await ctx.db.insert("socialSavedPosts", {
      postId: post._id,
      userId: viewer._id,
      createdAt: Date.now(),
    });
    await ctx.db.patch("socialPosts", post._id, {
      saveCount: post.saveCount + 1,
      updatedAt: Date.now(),
    });
    return { saved: true };
  },
});

export const createComment = mutation({
  args: {
    postId: v.id("socialPosts"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await requireMobileViewer(ctx);
    const post = await ctx.db.get("socialPosts", args.postId);
    if (!post || !canViewPost(viewer, post)) {
      throw new Error("Post not visible.");
    }
    const body = args.body.trim();
    if (!body) {
      throw new Error("Comment body required.");
    }
    const profile = await getMobileProfileByUserId(ctx, viewer._id);
    const now = Date.now();
    const commentId = await ctx.db.insert("socialPostComments", {
      postId: post._id,
      authorUserId: viewer._id,
      authorProfileId: profile?._id,
      body,
      status: "visible",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch("socialPosts", post._id, {
      commentCount: post.commentCount + 1,
      updatedAt: now,
    });
    return commentId;
  },
});

export const deleteComment = mutation({
  args: {
    commentId: v.id("socialPostComments"),
  },
  handler: async (ctx, args) => {
    const viewer = await requireMobileViewer(ctx);
    const comment = await ctx.db.get("socialPostComments", args.commentId);
    if (!comment) {
      throw new Error("Comment missing.");
    }
    const post = await ctx.db.get("socialPosts", comment.postId);
    if (!post) {
      throw new Error("Post missing.");
    }
    const canDelete =
      comment.authorUserId === viewer._id || post.authorUserId === viewer._id || isAdmin(viewer);
    if (!canDelete) {
      throw new Error("Comment delete denied.");
    }
    if (comment.status !== "visible") {
      return { ok: true };
    }
    const nextStatus = isAdmin(viewer) || post.authorUserId === viewer._id ? "removed" : "deleted";
    await ctx.db.patch("socialPostComments", comment._id, {
      body: "",
      status: nextStatus,
      updatedAt: Date.now(),
    });
    await ctx.db.patch("socialPosts", post._id, {
      commentCount: Math.max(0, post.commentCount - 1),
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});
