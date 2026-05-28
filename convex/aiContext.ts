import { v } from "convex/values";
import { internalQuery, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

async function getProfile(ctx: QueryCtx, userId: Id<"users">) {
  return await ctx.db
    .query("mobileProfiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
}

function fmtDate(ms: number | undefined | null) {
  return ms ? new Date(ms).toISOString().slice(0, 10) : null;
}

function formatAsset(asset: Doc<"memberAssets">) {
  return `${asset.currency} ${asset.value} "${asset.name}" (${fmtDate(asset.createdAt)})`;
}

function relatedMemberIds(
  member: Doc<"networkMembers">,
  visibleMembers: Doc<"networkMembers">[],
) {
  const nameKey = member.name.trim().toLowerCase();
  const ids = new Set<Id<"networkMembers">>([member._id]);
  for (const candidate of visibleMembers) {
    if (member.userId && candidate.userId === member.userId) {
      ids.add(candidate._id);
    }
    if (candidate.name.trim().toLowerCase() === nameKey) {
      ids.add(candidate._id);
    }
  }
  return [...ids];
}

async function getMemberAssetLogs(
  ctx: QueryCtx,
  member: Doc<"networkMembers">,
  visibleMembers: Doc<"networkMembers">[],
  limit = 5,
) {
  const allAssets: Doc<"memberAssets">[] = [];
  for (const memberId of relatedMemberIds(member, visibleMembers)) {
    const assets = await ctx.db
      .query("memberAssets")
      .withIndex("by_memberId_and_createdAt", (q) => q.eq("memberId", memberId))
      .order("desc")
      .take(limit);
    allAssets.push(...assets);
  }

  const uniqueAssets = new Map<string, Doc<"memberAssets">>();
  for (const asset of allAssets) {
    uniqueAssets.set(`${asset.name}_${asset.value}_${asset.currency}_${asset.createdAt}`, asset);
  }

  return [...uniqueAssets.values()]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}

// ── Network ──────────────────────────────────────────────────────────────────

async function networkContext(
  ctx: QueryCtx,
  userId: Id<"users">,
  searchTerm?: string,
) {
  // Admin gets cross-profile view; regular users see only their network
  const user = await ctx.db.get("users", userId);
  const isAdmin = user?.role === "admin";

  let members: Doc<"networkMembers">[];
  if (isAdmin) {
    // Admin: search ALL members across ALL profiles (bounded)
    members = await ctx.db.query("networkMembers").take(200);
  } else {
    const profile = await getProfile(ctx, userId);
    if (!profile) return "No network profile found for this user.";
    members = await ctx.db
      .query("networkMembers")
      .withIndex("by_profileId_and_sortOrder", (q) =>
        q.eq("profileId", profile._id),
      )
      .take(100);
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    const matched = members.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.firstName?.toLowerCase().includes(term) ||
        m.lastName?.toLowerCase().includes(term),
    );
    if (matched.length === 0) return `No members matching "${searchTerm}".`;

    const lines: string[] = [];
    for (const m of matched) {
      const detail = [
        `Name: ${m.name}`,
        m.firstName ? `First: ${m.firstName}` : null,
        m.lastName ? `Last: ${m.lastName}` : null,
        `Role: ${m.roleTitle}`,
        `Status: ${m.status}`,
        m.email ? `Email: ${m.email}` : null,
        m.phone ? `Phone: ${m.phone}` : null,
        m.birthday ? `Birthday: ${m.birthday}` : null,
        m.joinedAt ? `Joined: ${fmtDate(m.joinedAt)}` : null,
        m.investmentStartedAt
          ? `Investment Started: ${fmtDate(m.investmentStartedAt)}`
          : null,
        m.bonchatId ? `Bonchat ID: ${m.bonchatId}` : null,
        m.bonchatUsername ? `Bonchat Username: ${m.bonchatUsername}` : null,
        m.yepbitId ? `Yepbit ID: ${m.yepbitId}` : null,
        m.yepbitUsername ? `Yepbit Username: ${m.yepbitUsername}` : null,
        m.currentWork ? `Work: ${m.currentWork}` : null,
        `Viewer: ${m.isViewer}`,
      ]
        .filter(Boolean)
        .join(", ");
      lines.push(detail);

      const assets = await getMemberAssetLogs(ctx, m, members, 5);
      if (assets.length > 0) {
        lines.push(`  Latest org chart asset: ${formatAsset(assets[0])}`);
        lines.push(
          `  Recent org chart asset logs: ${assets.map(formatAsset).join("; ")}`,
        );
        const total = assets.reduce((sum, a) => sum + a.value, 0);
        lines.push(`  Total logged org chart assets: ${assets[0].currency} ${total.toFixed(2)}`);
      } else {
        lines.push("  Org chart asset logs: none");
      }
    }
    return lines.join("\n");
  }

  // Overview — show ALL members with key details
  const counts: Record<string, number> = {};
  for (const m of members) counts[m.status] = (counts[m.status] || 0) + 1;
  const memberLines: string[] = [];
  for (const m of members) {
    const parts = [`- ${m.name} (${m.roleTitle}, ${m.status})`];
    if (m.bonchatId) parts.push(`bonchatId=${m.bonchatId}`);
    if (m.bonchatUsername) parts.push(`bonchatUser=${m.bonchatUsername}`);
    if (m.yepbitId) parts.push(`yepbitId=${m.yepbitId}`);
    if (m.yepbitUsername) parts.push(`yepbitUser=${m.yepbitUsername}`);
    if (m.email) parts.push(`email=${m.email}`);
    const assets = await getMemberAssetLogs(ctx, m, members, 1);
    if (assets[0]) {
      parts.push(`latestOrgAsset=${assets[0].currency} ${assets[0].value}`);
      parts.push(`latestOrgAssetName="${assets[0].name}"`);
      parts.push(`latestOrgAssetDate=${fmtDate(assets[0].createdAt)}`);
    }
    memberLines.push(parts.join(" "));
  }
  return [
    `Total members: ${members.length}`,
    "Org chart assets come from memberAssets logs. They are separate from Finance Banking & Assets accounts.",
    `Status: ${Object.entries(counts)
      .map(([s, c]) => `${s}=${c}`)
      .join(", ")}`,
    ...memberLines,
  ].join("\n");
}

// ── Trading ──────────────────────────────────────────────────────────────────

async function tradingContext(ctx: QueryCtx, userId: Id<"users">) {
  const trades = await ctx.db
    .query("trades")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .order("desc")
    .take(10);

  const signals = await ctx.db
    .query("tradingSignals")
    .withIndex("by_status", (q) => q.eq("status", "active"))
    .take(10);

  const lines: string[] = [];
  if (trades.length > 0) {
    lines.push("Recent trades:");
    for (const t of trades) {
      lines.push(
        `- ${t.symbol} ${t.side} ${t.type} entry=${t.entryPrice} amt=${t.amount} status=${t.status}`,
      );
    }
  }
  if (signals.length > 0) {
    lines.push("Active signals:");
    for (const s of signals) {
      lines.push(
        `- ${s.symbol} ${s.type} entry=${s.entry} tp1=${s.tp1} sl=${s.sl} tf=${s.timeframe}`,
      );
    }
  }
  return lines.length > 0 ? lines.join("\n") : "No trades or signals found.";
}

// ── Finance ──────────────────────────────────────────────────────────────────

async function financeContext(ctx: QueryCtx, userId: Id<"users">) {
  const profile = await getProfile(ctx, userId);
  if (!profile) return "No profile found.";

  const accounts = await ctx.db
    .query("financialAccounts")
    .withIndex("by_profileId_and_sortOrder", (q) =>
      q.eq("profileId", profile._id),
    )
    .take(20);

  const txns = await ctx.db
    .query("financialTransactions")
    .withIndex("by_profileId_and_occurredAt", (q) =>
      q.eq("profileId", profile._id),
    )
    .order("desc")
    .take(15);

  const lines: string[] = [];
  if (accounts.length > 0) {
    lines.push("Finance Banking & Assets accounts. These are profile financial accounts, not org chart memberAssets logs:");
    for (const a of accounts) {
      lines.push(
        `- ${a.name} (${a.type}, ${a.institution}) balance=${a.balance} ${a.currencyCode}`,
      );
    }
  }
  if (txns.length > 0) {
    lines.push("Recent transactions:");
    for (const t of txns) {
      lines.push(
        `- ${t.kind} ${t.category} ${t.amount} ${t.currencyCode} ${fmtDate(t.occurredAt)}${t.note ? ` "${t.note}"` : ""}`,
      );
    }
  }
  return lines.length > 0 ? lines.join("\n") : "No financial data found.";
}

// ── Academy ──────────────────────────────────────────────────────────────────

async function academyContext(ctx: QueryCtx, userId: Id<"users">) {
  const levels = await ctx.db
    .query("academyLevels")
    .withIndex("by_order")
    .take(20);

  const progress = await ctx.db
    .query("academyProgress")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .take(100);

  const lines = [
    `Available levels: ${levels.map((l) => `${l.order}. ${l.title}`).join(", ")}`,
    `Completed lessons: ${progress.length}`,
  ];
  if (progress.length > 0) {
    const recent = progress.slice(-5);
    lines.push(
      `Recent: ${recent.map((p) => `${p.lessonSlug} (${fmtDate(p.completedAt)})`).join(", ")}`,
    );
  }
  return lines.join("\n");
}

// ── Social ───────────────────────────────────────────────────────────────────

async function socialContext(ctx: QueryCtx, userId: Id<"users">) {
  const posts = await ctx.db
    .query("socialPosts")
    .withIndex("by_authorUserId_and_lifecycle_and_createdAt", (q) =>
      q.eq("authorUserId", userId).eq("lifecycle", "published"),
    )
    .order("desc")
    .take(10);

  if (posts.length === 0) return "No published posts.";
  return [
    `Published posts: ${posts.length}`,
    ...posts.map(
      (p) =>
        `- "${(p.caption ?? "").slice(0, 60)}" likes=${p.likeCount} comments=${p.commentCount} ${fmtDate(p.publishedAt)}`,
    ),
  ].join("\n");
}

// ── Support ──────────────────────────────────────────────────────────────────

async function supportContext(ctx: QueryCtx, userId: Id<"users">) {
  const profile = await getProfile(ctx, userId);
  if (!profile) return "No profile found.";

  const tickets = await ctx.db
    .query("tickets")
    .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
    .take(10);

  if (tickets.length === 0) return "No tickets.";
  return tickets
    .map(
      (t) =>
        `- [${t.status}] ${t.subject} (priority=${t.priority}, ${fmtDate(t.createdAt)})`,
    )
    .join("\n");
}

// ── Admin ────────────────────────────────────────────────────────────────────

async function adminContext(ctx: QueryCtx, userId: Id<"users">) {
  const user = await ctx.db.get("users", userId);
  if (user?.email !== "admin@luxurious.trade" && user?.role !== "admin") {
    return "Admin scope requires admin role.";
  }

  const users = await ctx.db.query("users").take(200);
  const signals = await ctx.db
    .query("tradingSignals")
    .withIndex("by_status", (q) => q.eq("status", "active"))
    .take(50);
  const releases = await ctx.db
    .query("apkReleases")
    .withIndex("by_publishedAt")
    .order("desc")
    .take(3);

  return [
    `Total users: ${users.length}`,
    `Active signals: ${signals.length}`,
    releases.length > 0
      ? `Latest APK: v${releases[0].version} build ${releases[0].buildNumber}`
      : "No APK releases.",
  ].join("\n");
}

// ── Presentations ────────────────────────────────────────────────────────────

async function presentationsContext(ctx: QueryCtx, userId: Id<"users">) {
  const decks = await ctx.db
    .query("presentations")
    .withIndex("by_createdBy", (q) => q.eq("createdBy", userId))
    .order("desc")
    .take(10);

  if (decks.length === 0) return "No presentations.";
  return decks
    .map(
      (p) =>
        `- "${p.title}" slides=${p.slides.length} updated=${fmtDate(p.updatedAt)} archived=${p.isArchived}`,
    )
    .join("\n");
}

// ── Calendar ─────────────────────────────────────────────────────────────────

async function calendarContext(ctx: QueryCtx, userId: Id<"users">) {
  const profile = await getProfile(ctx, userId);
  if (!profile) return "No profile found.";

  const events = await ctx.db
    .query("events")
    .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
    .take(20);

  if (events.length === 0) return "No events.";
  return events
    .map(
      (e) =>
        `- [${e.category}] ${e.title} ${e.date} done=${e.isDone}`,
    )
    .join("\n");
}

// ── Shopping ─────────────────────────────────────────────────────────────────

async function shoppingContext(ctx: QueryCtx, userId: Id<"users">) {
  const profile = await getProfile(ctx, userId);
  if (!profile) return "No profile found.";

  const items = await ctx.db
    .query("shoppingItems")
    .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
    .take(30);

  if (items.length === 0) return "Shopping list is empty.";
  return items
    .map(
      (i) =>
        `- ${i.isChecked ? "☑" : "☐"} ${i.name} qty=${i.quantity} cat=${i.category} pri=${i.priority}`,
    )
    .join("\n");
}

// ── Main entry point ─────────────────────────────────────────────────────────

type ScopeKey =
  | "network"
  | "trading"
  | "finance"
  | "academy"
  | "social"
  | "support"
  | "admin"
  | "presentations"
  | "calendar"
  | "shopping";

const scopeHandlers: Record<
  ScopeKey,
  (ctx: QueryCtx, userId: Id<"users">, searchTerm?: string) => Promise<string>
> = {
  network: networkContext,
  trading: tradingContext,
  finance: financeContext,
  academy: academyContext,
  social: socialContext,
  support: supportContext,
  admin: adminContext,
  presentations: presentationsContext,
  calendar: calendarContext,
  shopping: shoppingContext,
};

export const gatherContext = internalQuery({
  args: {
    userId: v.id("users"),
    scopes: v.array(v.string()),
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const parts: string[] = [];

    for (const scope of args.scopes) {
      const handler = scopeHandlers[scope as ScopeKey];
      if (!handler) continue;
      const data = await handler(ctx, args.userId, args.searchTerm);
      parts.push(`[${scope.toUpperCase()} DATA]\n${data}`);
    }

    return parts.length > 0 ? parts.join("\n\n") : "";
  },
});
