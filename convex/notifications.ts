import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import {
  CATEGORY_COLORS,
  MobileCtx,
  getMobileProfileForViewerOrThrow,
  listAccountsForProfile,
  listNetworkMembersForProfile,
  requireMobileViewer,
} from "./mobileHelpers";

type FeedTone = "blue" | "gold" | "emerald" | "amber" | "violet";

type FeedEvent = {
  id: string;
  title: string;
  body: string;
  occurredAt: number;
  icon: string;
  tone: FeedTone;
  source: "network" | "finance" | "rank" | "device";
};

type NetworkMember = Doc<"networkMembers">;
type Transaction = Doc<"financialTransactions">;
type DerivedRank = ReturnType<typeof deriveRank>;

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function deriveRank(joinedDownlineCount: number) {
  if (joinedDownlineCount >= 6) {
    return {
      tier: 2,
      name: "Senior Stakeholder",
      frame: "gold",
      rangeLabel: "6+ joined downlines",
      nextTarget: null as number | null,
    };
  }
  if (joinedDownlineCount >= 3) {
    return {
      tier: 1,
      name: "Junior Stakeholder",
      frame: "silver",
      rangeLabel: "3-5 joined downlines",
      nextTarget: 6,
    };
  }
  return {
    tier: 0,
    name: "Junior Certified",
    frame: "bronze",
    rangeLabel: "0-2 joined downlines",
    nextTarget: 3,
  };
}

function countJoinedDownlines(
  parentLookup: Map<string, Array<{ _id: string; status: string }>>,
  parentId: string,
): number {
  const children = parentLookup.get(parentId) ?? [];
  return children.reduce((sum, child) => {
    const childCount = countJoinedDownlines(parentLookup, child._id);
    return sum + (child.status === "joined" ? 1 : 0) + childCount;
  }, 0);
}

async function loadNotificationState(ctx: MobileCtx, profileId: Id<"mobileProfiles">) {
  return await ctx.db
    .query("mobileNotificationStates")
    .withIndex("by_profileId", (q) => q.eq("profileId", profileId))
    .unique();
}

async function buildFeedData(ctx: MobileCtx) {
  const viewer = await requireMobileViewer(ctx);
  const profile = await getMobileProfileForViewerOrThrow(ctx);
  const members = await listNetworkMembersForProfile(ctx, profile._id);
  const accounts = await listAccountsForProfile(ctx, profile._id);
  const transactions = await ctx.db
    .query("financialTransactions")
    .withIndex("by_profileId_and_occurredAt", (q) => q.eq("profileId", profile._id))
    .order("desc")
    .take(50);
  const devices = await ctx.db
    .query("mobileDeviceTokens")
    .withIndex("by_profileId_and_updatedAt", (q) => q.eq("profileId", profile._id))
    .order("desc")
    .take(1);
  const state = await loadNotificationState(ctx, profile._id);

  const parentLookup = new Map<string, Array<{ _id: string; status: string }>>();
  for (const member of members) {
    if (!member.parentMemberId) {
      continue;
    }
    const key = member.parentMemberId;
    const list = parentLookup.get(key) ?? [];
    list.push({ _id: member._id, status: member.status });
    parentLookup.set(key, list);
  }

  const viewerMember = members.find((member) => member.isViewer) ?? null;
  const joinedDownlineCount =
    viewerMember == null ? 0 : countJoinedDownlines(parentLookup, viewerMember._id);
  const rank = deriveRank(joinedDownlineCount);
  const accountById = new Map(accounts.map((account) => [account._id, account]));
  const events: FeedEvent[] = [];

  const joinedMembers = members
    .filter((member) => !member.isViewer && member.status === "joined" && member.joinedAt != null)
    .sort((a, b) => (b.joinedAt ?? 0) - (a.joinedAt ?? 0))
    .slice(0, 20);
  for (const member of joinedMembers) {
    events.push({
      id: `joined:${member._id}`,
      title: `${member.name} joined network`,
      body: `${member.roleTitle} now active in your downline.`,
      occurredAt: member.joinedAt ?? member.updatedAt,
      icon: "group_add",
      tone: "blue",
      source: "network",
    });
  }

  const pipelineMembers = members
    .filter((member) => !member.isViewer && member.status !== "joined")
    .slice(0, 20);
  for (const member of pipelineMembers) {
    const isPending = member.status === "pending";
    events.push({
      id: `pipeline:${member._id}`,
      title: isPending ? `${member.name} waiting on verification` : `${member.name} invite still open`,
      body: isPending
        ? "Nudge this contact to complete onboarding."
        : "Invite delivered. Follow up to convert prospect.",
      occurredAt: member.updatedAt,
      icon: isPending ? "hourglass_top" : "mail_outline",
      tone: isPending ? "amber" : "violet",
      source: "network",
    });
  }

  for (const transaction of transactions) {
    const isIncome = transaction.kind === "income";
    const accountName = accountById.get(transaction.accountId)?.name ?? "Main account";
    const amountLabel = formatCurrency(transaction.amount);
    events.push({
      id: `transaction:${transaction._id}`,
      title: isIncome ? `${amountLabel} landed` : `${amountLabel} spent`,
      body: isIncome
        ? `${transaction.category} posted into ${accountName}.`
        : `${transaction.category} charged against ${accountName}.`,
      occurredAt: transaction.occurredAt,
      icon: isIncome ? "south_west" : "north_east",
      tone: isIncome ? "emerald" : "amber",
      source: "finance",
    });
  }

  if (rank.nextTarget != null) {
    const remaining = Math.max(rank.nextTarget - joinedDownlineCount, 0);
    events.push({
      id: `rank:${rank.tier}:${joinedDownlineCount}`,
      title: `${remaining} more joined downlines for next frame`,
      body: `Current rank ${rank.name}. Push to unlock ${rank.nextTarget === 6 ? "Gold" : "Silver"} frame.`,
      occurredAt: profile.updatedAt,
      icon: "workspace_premium",
      tone: "gold",
      source: "rank",
    });
  } else {
    events.push({
      id: `rank:${rank.tier}:${joinedDownlineCount}`,
      title: "Gold frame status locked",
      body: `${viewer.name ?? profile.displayName} holds top mobile rank now.`,
      occurredAt: profile.updatedAt,
      icon: "workspace_premium",
      tone: "gold",
      source: "rank",
    });
  }

  if (devices[0] != null) {
    const device = devices[0];
    events.push({
      id: `device:${device._id}`,
      title: `${device.platform} alerts ready`,
      body: `Future push delivery registered through ${device.provider}.`,
      occurredAt: device.updatedAt,
      icon: "notifications_active",
      tone: "blue",
      source: "device",
    });
  }

  const sortedEvents = events
    .sort((a, b) => b.occurredAt - a.occurredAt)
    .slice(0, 100);
  const lastReadAt = state?.lastReadAt ?? 0;
  const unreadCount = sortedEvents.filter((event) => event.occurredAt > lastReadAt).length;
  const latestOccurredAt = sortedEvents[0]?.occurredAt ?? lastReadAt;
  const promotions = buildPromotions({
    joinedDownlineCount,
    rank,
    members,
    transactions,
  });

  return {
    items: sortedEvents.map((event) => ({
      ...event,
      isUnread: event.occurredAt > lastReadAt,
    })),
    unreadCount,
    latestOccurredAt,
    lastReadAt,
    activePromotionCount: promotions.length,
  };
}

function buildPromotions(args: {
  joinedDownlineCount: number;
  rank: DerivedRank;
  members: NetworkMember[];
  transactions: Transaction[];
}) {
  const viewer = args.members.find((member) => member.isViewer) ?? null;
  const directMembers = viewer
    ? args.members.filter((member) => member.parentMemberId === viewer._id)
    : [];
  const joinedDirectCount = directMembers.filter((member) => member.status === "joined").length;
  const invitedCount = directMembers.filter((member) => member.status === "invited").length;
  const pendingCount = directMembers.filter((member) => member.status === "pending").length;
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const monthStartMs = monthStart.getTime();
  const monthTransactions = args.transactions.filter(
    (transaction) => transaction.occurredAt >= monthStartMs,
  );
  const incomeThisMonth = monthTransactions
    .filter((transaction) => transaction.kind === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenseThisMonth = monthTransactions
    .filter((transaction) => transaction.kind === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const netThisMonth = incomeThisMonth - expenseThisMonth;
  const remainingToNextRank =
    args.rank.nextTarget == null ? 0 : Math.max(args.rank.nextTarget - args.joinedDownlineCount, 0);

  const promotions = [
    {
      id: "network-sprint",
      badge: "Network",
      title:
        pendingCount > 0
          ? `${pendingCount} pending recruit${pendingCount === 1 ? "" : "s"} can close this week`
          : `${Math.max(6 - joinedDirectCount, 0)} open seats in direct circle`,
      body:
        pendingCount > 0
          ? "Follow up fastest movers and convert pending records into joined downlines."
          : `${invitedCount} invited prospect${invitedCount === 1 ? "" : "s"} ready for next nudge.`,
      ctaLabel: "Open members",
      tone: "blue",
      accent: CATEGORY_COLORS["Freelance"] ?? "#2563eb",
    },
    {
      id: "rank-sprint",
      badge: "Promotion",
      title:
        args.rank.nextTarget == null
          ? "Gold frame secured"
          : `${remainingToNextRank} more joined downlines unlock next frame`,
      body:
        args.rank.nextTarget == null
          ? "Senior Stakeholder tier active. Keep mentoring second-line growth."
          : `Current status ${args.rank.name}. Next milestone lands at ${args.rank.nextTarget} joined downlines.`,
      ctaLabel: "Open feed",
      tone: "gold",
      accent: "#D4AF37",
    },
    {
      id: "momentum-boost",
      badge: "Momentum",
      title:
        netThisMonth >= 0
          ? `${formatCurrency(netThisMonth)} positive flow this month`
          : `${formatCurrency(Math.abs(netThisMonth))} burn needs attention`,
      body:
        netThisMonth >= 0
          ? "Use current margin to reward top performers or fund next campaign."
          : `Income ${formatCurrency(incomeThisMonth)} vs expenses ${formatCurrency(expenseThisMonth)} this month.`,
      ctaLabel: "Review history",
      tone: netThisMonth >= 0 ? "emerald" : "amber",
      accent: netThisMonth >= 0 ? "#22c55e" : "#f59e0b",
    },
  ];

  return promotions;
}

export const getFeed = query({
  args: {},
  handler: async (ctx) => {
    return await buildFeedData(ctx);
  },
});

export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    const feed = await buildFeedData(ctx);
    return {
      unreadCount: feed.unreadCount,
      latestOccurredAt: feed.latestOccurredAt,
      lastReadAt: feed.lastReadAt,
      activePromotionCount: feed.activePromotionCount,
    };
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const feed = await buildFeedData(ctx);
    const now = Date.now();
    const nextReadAt = Math.max(feed.latestOccurredAt, now);
    const existing = await ctx.db
      .query("mobileNotificationStates")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .unique();

    if (existing) {
      await ctx.db.patch("mobileNotificationStates", existing._id, {
        lastReadAt: nextReadAt,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("mobileNotificationStates", {
        profileId: profile._id,
        lastReadAt: nextReadAt,
        updatedAt: now,
      });
    }

    return {
      markedReadAt: nextReadAt,
      unreadCount: 0,
    };
  },
});

export const registerDeviceToken = mutation({
  args: {
    installationId: v.string(),
    token: v.string(),
    platform: v.string(),
    provider: v.string(),
    environment: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const now = Date.now();
    const installationId = args.installationId.trim();
    const token = args.token.trim();
    if (installationId.length === 0 || token.length === 0) {
      throw new Error("installationId and token required.");
    }

    const existing = await ctx.db
      .query("mobileDeviceTokens")
      .withIndex("by_profileId_and_installationId", (q) =>
        q.eq("profileId", profile._id).eq("installationId", installationId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch("mobileDeviceTokens", existing._id, {
        token,
        platform: args.platform.trim(),
        provider: args.provider.trim(),
        environment: args.environment.trim(),
        updatedAt: now,
        lastSeenAt: now,
      });
      return {
        registered: true,
        deviceId: existing._id,
      };
    }

    const deviceId = await ctx.db.insert("mobileDeviceTokens", {
      profileId: profile._id,
      installationId,
      token,
      platform: args.platform.trim(),
      provider: args.provider.trim(),
      environment: args.environment.trim(),
      createdAt: now,
      updatedAt: now,
      lastSeenAt: now,
    });

    return {
      registered: true,
      deviceId,
    };
  },
});

export const listPromotions = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const members = await listNetworkMembersForProfile(ctx, profile._id);
    const parentLookup = new Map<string, Array<{ _id: string; status: string }>>();
    for (const member of members) {
      if (!member.parentMemberId) {
        continue;
      }
      const list = parentLookup.get(member.parentMemberId) ?? [];
      list.push({ _id: member._id, status: member.status });
      parentLookup.set(member.parentMemberId, list);
    }
    const viewerMember = members.find((member) => member.isViewer) ?? null;
    const joinedDownlineCount =
      viewerMember == null ? 0 : countJoinedDownlines(parentLookup, viewerMember._id);
    const rank = deriveRank(joinedDownlineCount);
    const transactions = await ctx.db
      .query("financialTransactions")
      .withIndex("by_profileId_and_occurredAt", (q) => q.eq("profileId", profile._id))
      .order("desc")
      .take(12);
    return buildPromotions({
      joinedDownlineCount,
      rank,
      members,
      transactions,
    });
  },
});
