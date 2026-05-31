import { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

export type MobileProfile = Doc<"mobileProfiles">;
export type MobileViewer = Doc<"users">;
export type MobileCtx = QueryCtx | MutationCtx;
export type AvatarFilter = "natural" | "gold" | "cool" | "mono";

type AccountSeed = {
  name: string;
  institution: string;
  type: "savings" | "cash" | "credit" | "checking" | "investment";
  balance: number;
  currencyCode: string;
  sortOrder: number;
};

type BudgetSeed = {
  category: string;
  limitAmount: number;
  color: string;
  sortOrder: number;
};

type DebtSeed = {
  name: string;
  remainingAmount: number;
  paymentAmount: number;
  paymentCadence: string;
  lender: string;
  kind: string;
  sortOrder: number;
};

type InstallmentSeed = {
  itemName: string;
  currentInstallment: number;
  totalInstallments: number;
  paymentAmount: number;
  nextDueDate: string;
  sortOrder: number;
};

type TransactionSeed = {
  accountName: string;
  kind: "income" | "expense";
  category: string;
  amount: number;
  note?: string;
  occurredAt: number;
  currencyCode: string;
  source: "manual" | "receipt";
};

type NetworkMemberSeed = {
  key: string;
  name: string;
  roleTitle: string;
  status: "joined" | "invited" | "pending";
  parentKey: string | null;
  isViewer: boolean;
  sortOrder: number;
  joinedAt?: number;
  userId?: Id<"users">;
};

type DescendantEntry = {
  depth: number;
  key: string;
  parentKey: string;
  user: MobileViewer;
};

export const DEFAULT_CURRENCIES = [
  { code: "USD", name: "US Dollar", rate: 1.0 },
  { code: "EUR", name: "Euro", rate: 0.92 },
  { code: "GBP", name: "British Pound", rate: 0.78 },
  { code: "JPY", name: "Japanese Yen", rate: 155.4 },
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Food: "#f59e0b",
  "Dining Out": "#fb923c",
  Bills: "#facc15",
  Shopping: "#ec4899",
  Fun: "#22c55e",
  Entertainment: "#3b82f6",
  Transport: "#60a5fa",
  Groceries: "#22c55e",
  Salary: "#10b981",
  Freelance: "#06b6d4",
  Dividends: "#8b5cf6",
  Other: "#94a3b8",
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DEFAULT_ACCOUNTS: AccountSeed[] = [
  {
    name: "Main Savings",
    institution: "Chase",
    balance: 15200.5,
    type: "savings",
    currencyCode: "USD",
    sortOrder: 0,
  },
  {
    name: "Spending Wallet",
    institution: "Cash",
    balance: 450,
    type: "cash",
    currencyCode: "USD",
    sortOrder: 1,
  },
  {
    name: "Luxurious Credit",
    institution: "Amex",
    balance: -2100,
    type: "credit",
    currencyCode: "USD",
    sortOrder: 2,
  },
];

const DEFAULT_BUDGETS: BudgetSeed[] = [
  { category: "Dining Out", limitAmount: 600, color: "#f59e0b", sortOrder: 0 },
  { category: "Groceries", limitAmount: 1000, color: "#22c55e", sortOrder: 1 },
  {
    category: "Entertainment",
    limitAmount: 150,
    color: "#3b82f6",
    sortOrder: 2,
  },
  { category: "Shopping", limitAmount: 500, color: "#ef4444", sortOrder: 3 },
];

const DEFAULT_DEBTS: DebtSeed[] = [
  {
    name: "Student Loan",
    remainingAmount: 25000,
    paymentAmount: 450,
    paymentCadence: "Monthly",
    lender: "Federal",
    kind: "installment",
    sortOrder: 0,
  },
  {
    name: "Car Loan",
    remainingAmount: 12000,
    paymentAmount: 320,
    paymentCadence: "Monthly",
    lender: "Toyota Financial",
    kind: "installment",
    sortOrder: 1,
  },
  {
    name: "Credit Card",
    remainingAmount: 1500,
    paymentAmount: 100,
    paymentCadence: "Minimum",
    lender: "Amex",
    kind: "revolving",
    sortOrder: 2,
  },
];

const DEFAULT_INSTALLMENTS: InstallmentSeed[] = [
  {
    itemName: "iPhone 15 Pro",
    currentInstallment: 4,
    totalInstallments: 12,
    paymentAmount: 120,
    nextDueDate: "2026-06-15",
    sortOrder: 0,
  },
  {
    itemName: "MacBook Air M2",
    currentInstallment: 8,
    totalInstallments: 24,
    paymentAmount: 85,
    nextDueDate: "2026-06-22",
    sortOrder: 1,
  },
  {
    itemName: "Sony Headphones",
    currentInstallment: 2,
    totalInstallments: 6,
    paymentAmount: 50,
    nextDueDate: "2026-07-01",
    sortOrder: 2,
  },
];

function monthsAgo(months: number) {
  const date = new Date();
  date.setUTCDate(12);
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCMonth(date.getUTCMonth() - months);
  return date.getTime();
}

const DEFAULT_TRANSACTIONS: TransactionSeed[] = [
  {
    accountName: "Main Savings",
    kind: "income",
    category: "Salary",
    amount: 5000,
    note: "Monthly salary",
    occurredAt: monthsAgo(3),
    currencyCode: "USD",
    source: "manual",
  },
  {
    accountName: "Spending Wallet",
    kind: "expense",
    category: "Groceries",
    amount: 800,
    note: "Groceries",
    occurredAt: monthsAgo(3) + 86400000,
    currencyCode: "USD",
    source: "manual",
  },
  {
    accountName: "Spending Wallet",
    kind: "expense",
    category: "Dining Out",
    amount: 420,
    note: "Dining out",
    occurredAt: monthsAgo(3) + 172800000,
    currencyCode: "USD",
    source: "manual",
  },
  {
    accountName: "Main Savings",
    kind: "income",
    category: "Salary",
    amount: 5200,
    note: "Monthly salary",
    occurredAt: monthsAgo(2),
    currencyCode: "USD",
    source: "manual",
  },
  {
    accountName: "Spending Wallet",
    kind: "expense",
    category: "Shopping",
    amount: 550,
    note: "Shopping",
    occurredAt: monthsAgo(2) + 86400000,
    currencyCode: "USD",
    source: "manual",
  },
  {
    accountName: "Spending Wallet",
    kind: "expense",
    category: "Entertainment",
    amount: 120,
    note: "Entertainment",
    occurredAt: monthsAgo(2) + 172800000,
    currencyCode: "USD",
    source: "manual",
  },
  {
    accountName: "Main Savings",
    kind: "income",
    category: "Salary",
    amount: 4800,
    note: "Monthly salary",
    occurredAt: monthsAgo(1),
    currencyCode: "USD",
    source: "manual",
  },
  {
    accountName: "Main Savings",
    kind: "income",
    category: "Freelance",
    amount: 600,
    note: "Freelance project",
    occurredAt: monthsAgo(1) + 43200000,
    currencyCode: "USD",
    source: "manual",
  },
  {
    accountName: "Spending Wallet",
    kind: "expense",
    category: "Groceries",
    amount: 500,
    note: "Groceries",
    occurredAt: monthsAgo(1) + 86400000,
    currencyCode: "USD",
    source: "manual",
  },
  {
    accountName: "Spending Wallet",
    kind: "expense",
    category: "Dining Out",
    amount: 340,
    note: "Dining out",
    occurredAt: monthsAgo(1) + 172800000,
    currencyCode: "USD",
    source: "manual",
  },
  {
    accountName: "Main Savings",
    kind: "income",
    category: "Salary",
    amount: 6000,
    note: "Monthly salary",
    occurredAt: monthsAgo(0),
    currencyCode: "USD",
    source: "manual",
  },
  {
    accountName: "Spending Wallet",
    kind: "expense",
    category: "Groceries",
    amount: 300,
    note: "Groceries",
    occurredAt: monthsAgo(0) + 86400000,
    currencyCode: "USD",
    source: "manual",
  },
  {
    accountName: "Spending Wallet",
    kind: "expense",
    category: "Dining Out",
    amount: 210,
    note: "Dining out",
    occurredAt: monthsAgo(0) + 172800000,
    currencyCode: "USD",
    source: "manual",
  },
  {
    accountName: "Spending Wallet",
    kind: "expense",
    category: "Entertainment",
    amount: 80,
    note: "Movies",
    occurredAt: monthsAgo(0) + 259200000,
    currencyCode: "USD",
    source: "manual",
  },
  {
    accountName: "Spending Wallet",
    kind: "expense",
    category: "Shopping",
    amount: 160,
    note: "Clothes",
    occurredAt: monthsAgo(0) + 345600000,
    currencyCode: "USD",
    source: "manual",
  },
];

export async function requireMobileViewer(
  ctx: MobileCtx,
): Promise<MobileViewer> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  const user = await ctx.db.get("users", userId);
  if (!user) {
    throw new Error("Authenticated user missing.");
  }
  return user;
}

export async function getMobileProfileByUserId(
  ctx: MobileCtx,
  userId: Id<"users">,
): Promise<MobileProfile | null> {
  return await ctx.db
    .query("mobileProfiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
}

export async function getMobileProfileForViewer(ctx: MobileCtx) {
  const viewer = await requireMobileViewer(ctx);
  return await getMobileProfileByUserId(ctx, viewer._id);
}

export async function getMobileProfileForViewerOrThrow(ctx: MobileCtx) {
  const profile = await getMobileProfileForViewer(ctx);
  if (!profile) {
    throw new Error("Mobile profile missing. Call mobile:bootstrap first.");
  }
  return profile;
}

export async function ensureMobileProfileForViewer(ctx: MutationCtx) {
  const viewer = await requireMobileViewer(ctx);
  const existing = await getMobileProfileByUserId(ctx, viewer._id);
  const now = Date.now();
  const fallbackDisplayName = getViewerDisplayName(viewer);

  if (existing) {
    const storedDisplayName = existing.displayName.trim();
    await ctx.db.patch("mobileProfiles", existing._id, {
      userId: viewer._id,
      viewerKey: `auth_${viewer._id}`,
      displayName:
        storedDisplayName.length > 0 ? storedDisplayName : fallbackDisplayName,
      avatarFilter: existing.avatarFilter ?? "natural",
      avatarMirror: existing.avatarMirror ?? false,
      avatarOffsetX: existing.avatarOffsetX ?? 0,
      avatarOffsetY: existing.avatarOffsetY ?? 0,
      avatarRotationQuarterTurns: existing.avatarRotationQuarterTurns ?? 0,
      avatarScale: existing.avatarScale ?? 1,
      updatedAt: now,
    });
    const existingMembers = await listNetworkMembersForProfile(
      ctx,
      existing._id,
    );
    if (existingMembers.length === 0) {
      await syncNetworkMembersForViewer(ctx, existing._id, viewer, now);
    }
    return await ctx.db.get("mobileProfiles", existing._id);
  }

  const profileId = await ctx.db.insert("mobileProfiles", {
    userId: viewer._id,
    viewerKey: `auth_${viewer._id}`,
    displayName: fallbackDisplayName,
    preferredCurrencyCode: "USD",
    avatarFilter: "natural",
    avatarMirror: false,
    avatarOffsetX: 0,
    avatarOffsetY: 0,
    avatarRotationQuarterTurns: 0,
    avatarScale: 1,
    createdAt: now,
    updatedAt: now,
  });

  const accountIdsByName = new Map<string, Id<"financialAccounts">>();
  for (const account of DEFAULT_ACCOUNTS) {
    const accountId = await ctx.db.insert("financialAccounts", {
      profileId,
      ...account,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });
    accountIdsByName.set(account.name, accountId);
  }

  for (const budget of DEFAULT_BUDGETS) {
    await ctx.db.insert("budgetPlans", {
      profileId,
      ...budget,
      period: "monthly",
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const debt of DEFAULT_DEBTS) {
    await ctx.db.insert("debtPlans", {
      profileId,
      ...debt,
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const installment of DEFAULT_INSTALLMENTS) {
    await ctx.db.insert("installmentPlans", {
      profileId,
      ...installment,
      createdAt: now,
      updatedAt: now,
    });
  }

  await syncNetworkMembersForViewer(ctx, profileId, viewer, now);

  for (const transaction of DEFAULT_TRANSACTIONS) {
    const accountId = accountIdsByName.get(transaction.accountName);
    if (!accountId) {
      continue;
    }
    await ctx.db.insert("financialTransactions", {
      profileId,
      accountId,
      kind: transaction.kind,
      category: transaction.category,
      note: transaction.note,
      amount: transaction.amount,
      occurredAt: transaction.occurredAt,
      currencyCode: transaction.currencyCode,
      source: transaction.source,
      createdAt: now,
    });
  }

  return await ctx.db.get("mobileProfiles", profileId);
}

export async function listNetworkMembersForProfile(
  ctx: MobileCtx,
  profileId: Id<"mobileProfiles">,
) {
  return await ctx.db
    .query("networkMembers")
    .withIndex("by_profileId_and_sortOrder", (q) =>
      q.eq("profileId", profileId),
    )
    .take(64);
}

export async function listUnifiedNetworkMembers(
  ctx: MobileCtx,
  profileId: Id<"mobileProfiles">,
): Promise<Doc<"networkMembers">[]> {
  const profile = await ctx.db.get("mobileProfiles", profileId);
  const primaryMembers = await ctx.db
    .query("networkMembers")
    .withIndex("by_profileId_and_sortOrder", (q) =>
      q.eq("profileId", profileId),
    )
    .collect();

  const primaryViewer =
    primaryMembers.find((member) => member.isViewer) ?? null;
  const canonicalMembers =
    profile?.userId && primaryViewer
      ? await listCanonicalDownlineMembers(ctx, profile, primaryViewer)
      : [];
  const allMembers: Doc<"networkMembers">[] =
    canonicalMembers.length > 0 && primaryViewer
      ? [primaryViewer, ...canonicalMembers]
      : [...primaryMembers];
  const processedUserIds = new Set<string>();
  const profileQueue = [{ profileId, members: allMembers }];
  const userIdToParentMemberId = new Map<Id<"users">, Id<"networkMembers">>();

  for (const m of allMembers) {
    if (m.userId && !m.isViewer) {
      userIdToParentMemberId.set(m.userId, m._id);
    }
  }

  while (profileQueue.length > 0) {
    const current = profileQueue.shift()!;
    for (const member of current.members) {
      if (member.userId && !member.isViewer) {
        const linkedUserId = member.userId;
        if (processedUserIds.has(linkedUserId)) {
          continue;
        }
        processedUserIds.add(linkedUserId);

        const linkedProfiles = await ctx.db
          .query("mobileProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", linkedUserId))
          .collect();

        for (const linkedProfile of linkedProfiles) {
          const childMembers = await ctx.db
            .query("networkMembers")
            .withIndex("by_profileId_and_sortOrder", (q) =>
              q.eq("profileId", linkedProfile._id),
            )
            .collect();

          if (childMembers.length === 0) {
            continue;
          }

          const childViewer = childMembers.find((m) => m.isViewer);
          if (!childViewer) {
            continue;
          }

          const parentMemberIdInParentTree =
            userIdToParentMemberId.get(linkedUserId) || member._id;
          const childMemberById = new Map(
            childMembers.map((cm) => [cm._id, cm]),
          );
          const ancestorIds = new Set<Id<"networkMembers">>();
          let currentAncestorId = childViewer.parentMemberId ?? null;
          let guard = 0;
          while (currentAncestorId && guard < 20) {
            const ancestor = childMemberById.get(currentAncestorId);
            if (!ancestor) {
              break;
            }
            ancestorIds.add(ancestor._id);
            currentAncestorId = ancestor.parentMemberId ?? null;
            guard += 1;
          }

          const remappedMembers: Doc<"networkMembers">[] = [];

          for (const cm of childMembers) {
            if (cm.isViewer || ancestorIds.has(cm._id)) {
              continue;
            }
            const remappedParentId =
              cm.parentMemberId === childViewer._id
                ? parentMemberIdInParentTree
                : cm.parentMemberId;

            remappedMembers.push({
              ...cm,
              parentMemberId: remappedParentId,
            });
          }

          allMembers.push(...remappedMembers);

          for (const rm of remappedMembers) {
            if (rm.userId && !rm.isViewer) {
              userIdToParentMemberId.set(rm.userId, rm._id);
            }
          }

          profileQueue.push({
            profileId: linkedProfile._id,
            members: remappedMembers,
          });
        }
      }
    }
  }

  const userIdToInvestmentDate = new Map<Id<"users">, number>();
  const allDbMembers = await ctx.db.query("networkMembers").collect();
  for (const m of allDbMembers) {
    if (
      m.userId &&
      m.investmentStartedAt !== undefined &&
      m.investmentStartedAt !== null
    ) {
      const existing = userIdToInvestmentDate.get(m.userId);
      if (existing === undefined || m.investmentStartedAt < existing) {
        userIdToInvestmentDate.set(m.userId, m.investmentStartedAt);
      }
    }
  }

  for (let i = 0; i < allMembers.length; i++) {
    const m = allMembers[i];
    if (m && m.userId) {
      const canonicalDate = userIdToInvestmentDate.get(m.userId);
      if (
        canonicalDate !== undefined &&
        m.investmentStartedAt !== canonicalDate
      ) {
        allMembers[i] = {
          ...m,
          investmentStartedAt: canonicalDate,
        };
      }
    }
  }

  return allMembers;
}

async function listCanonicalDownlineMembers(
  ctx: MobileCtx,
  profile: MobileProfile,
  primaryViewer: Doc<"networkMembers">,
) {
  if (!profile.userId) {
    return [];
  }

  const viewerUser = await ctx.db.get("users", profile.userId);
  const rootsById = await ctx.db
    .query("networkMembers")
    .withIndex("by_userId", (q) => q.eq("userId", profile.userId))
    .take(20);
  const rootsByEmail = viewerUser?.email
    ? await ctx.db
        .query("networkMembers")
        .withIndex("by_email", (q) => q.eq("email", viewerUser.email))
        .take(20)
    : [];
  const rootByKey = new Map<Id<"networkMembers">, Doc<"networkMembers">>();
  for (const root of [...rootsById, ...rootsByEmail]) {
    rootByKey.set(root._id, root);
  }
  const linkedRoots = [...rootByKey.values()];
  const externalRoots = linkedRoots.filter(
    (member) =>
      !member.isViewer &&
      member.profileId !== profile._id &&
      member.parentMemberId !== undefined &&
      member.parentMemberId !== null,
  );
  if (externalRoots.length === 0) {
    return [];
  }

  const mergedMembers: Doc<"networkMembers">[] = [];
  const seenIds = new Set<Id<"networkMembers">>();
  for (const root of externalRoots) {
    const profileMembers = await ctx.db
      .query("networkMembers")
      .withIndex("by_profileId_and_sortOrder", (q) =>
        q.eq("profileId", root.profileId),
      )
      .collect();
    const parentLookup = new Map<
      Id<"networkMembers">,
      Doc<"networkMembers">[]
    >();
    for (const member of profileMembers) {
      if (!member.parentMemberId) {
        continue;
      }
      const siblings = parentLookup.get(member.parentMemberId) ?? [];
      siblings.push(member);
      parentLookup.set(member.parentMemberId, siblings);
    }

    const stack = [...(parentLookup.get(root._id) ?? [])];
    while (stack.length > 0) {
      const member = stack.shift();
      if (!member || seenIds.has(member._id)) {
        continue;
      }
      seenIds.add(member._id);
      mergedMembers.push({
        ...member,
        parentMemberId:
          member.parentMemberId === root._id
            ? primaryViewer._id
            : member.parentMemberId,
      });
      stack.push(...(parentLookup.get(member._id) ?? []));
    }
  }

  return mergedMembers;
}

async function seedDefaultNetworkMembers(
  ctx: MutationCtx,
  profileId: Id<"mobileProfiles">,
  seeds: NetworkMemberSeed[],
  now: number,
) {
  const networkIdsByKey = new Map<string, Id<"networkMembers">>();
  for (const member of seeds) {
    const memberId = await ctx.db.insert("networkMembers", {
      profileId,
      name: member.name,
      roleTitle: member.roleTitle,
      status: member.status,
      parentMemberId: null,
      isViewer: member.isViewer,
      sortOrder: member.sortOrder,
      joinedAt: member.joinedAt,
      userId: member.userId,
      createdByUserId: member.userId,
      ownedByUserId: member.userId,
      createdAt: now,
      updatedAt: now,
    });
    networkIdsByKey.set(member.key, memberId);
  }

  for (const member of seeds) {
    if (!member.parentKey) {
      continue;
    }
    const memberId = networkIdsByKey.get(member.key);
    const parentMemberId = networkIdsByKey.get(member.parentKey);
    if (!memberId || !parentMemberId) {
      continue;
    }
    await ctx.db.patch("networkMembers", memberId, { parentMemberId });
  }
}

async function syncNetworkMembersForViewer(
  ctx: MutationCtx,
  profileId: Id<"mobileProfiles">,
  viewer: MobileViewer,
  now: number,
) {
  const existingMembers = await listNetworkMembersForProfile(ctx, profileId);
  for (const member of existingMembers) {
    await ctx.db.delete("networkMembers", member._id);
  }
  const seeds = await buildNetworkSeedsForViewer(ctx, viewer);
  await seedDefaultNetworkMembers(ctx, profileId, seeds, now);
}

async function buildNetworkSeedsForViewer(
  ctx: MutationCtx,
  viewer: MobileViewer,
): Promise<NetworkMemberSeed[]> {
  const seeds: NetworkMemberSeed[] = [];
  const usersById = new Map<Id<"users">, MobileViewer>();
  const allUsers = await ctx.db.query("users").take(64);
  for (const user of allUsers) {
    usersById.set(user._id, user);
  }

  const uplineChain: MobileViewer[] = [];
  let currentUplineId = viewer.uplineId ?? null;
  let guard = 0;
  while (currentUplineId && guard < 6) {
    const upline = usersById.get(currentUplineId);
    if (!upline) {
      break;
    }
    uplineChain.push(upline);
    currentUplineId = upline.uplineId ?? null;
    guard += 1;
  }
  uplineChain.reverse();

  let parentKey: string | null = null;
  for (let i = 0; i < uplineChain.length; i += 1) {
    const upline = uplineChain[i];
    if (!upline) {
      continue;
    }
    const key = `upline_${i}`;
    seeds.push({
      key,
      name: getViewerDisplayName(upline),
      roleTitle: i === 0 ? "Regional Upline" : "Team Upline",
      status: "joined",
      parentKey,
      isViewer: false,
      sortOrder: seeds.length,
      joinedAt: monthsAgo(10 - i),
      userId: upline._id,
    });
    parentKey = key;
  }

  seeds.push({
    key: "viewer",
    name: getViewerDisplayName(viewer),
    roleTitle: viewer.role == "admin" ? "Admin Lead" : "Network Lead",
    status: "joined",
    parentKey,
    isViewer: true,
    sortOrder: seeds.length,
    joinedAt: monthsAgo(6),
    userId: viewer._id,
  });

  const descendants: DescendantEntry[] = [];
  await collectDescendants(ctx, viewer._id, 1, "viewer", descendants);
  for (let i = 0; i < descendants.length; i += 1) {
    const entry = descendants[i];
    if (!entry) {
      continue;
    }
    seeds.push({
      key: entry.key,
      name: getViewerDisplayName(entry.user),
      roleTitle: entry.depth === 1 ? "Direct Downline" : "Second Line",
      status: "joined",
      parentKey: entry.parentKey,
      isViewer: false,
      sortOrder: seeds.length,
      joinedAt: monthsAgo(entry.depth === 1 ? 4 : 2),
      userId: entry.user._id,
    });
  }

  const [invitedProspect, pendingProspect] = buildProspectNames(viewer);
  seeds.push({
    key: "invited_0",
    name: invitedProspect,
    roleTitle: "Invited Prospect",
    status: "invited",
    parentKey: "viewer",
    isViewer: false,
    sortOrder: seeds.length,
  });
  seeds.push({
    key: "pending_0",
    name: pendingProspect,
    roleTitle: "Pending Verification",
    status: "pending",
    parentKey: "viewer",
    isViewer: false,
    sortOrder: seeds.length,
  });

  return seeds;
}

async function collectDescendants(
  ctx: MutationCtx,
  parentId: Id<"users">,
  depth: number,
  parentKey: string,
  descendants: DescendantEntry[],
): Promise<void> {
  if (depth > 2 || descendants.length >= 8) {
    return;
  }

  const children = await ctx.db
    .query("users")
    .withIndex("by_upline", (q) => q.eq("uplineId", parentId))
    .take(4);

  for (let i = 0; i < children.length; i += 1) {
    const child = children[i];
    if (!child) {
      continue;
    }
    const key = `member_${descendants.length}`;
    descendants.push({
      depth,
      key,
      parentKey,
      user: child,
    });
    await collectDescendants(ctx, child._id, depth + 1, key, descendants);
    if (descendants.length >= 8) {
      return;
    }
  }
}

function getViewerDisplayName(user: MobileViewer): string {
  const name = user.name?.trim();
  if (name !== undefined && name.length > 0) {
    return name;
  }
  const email = user.email?.trim();
  if (email !== undefined && email.length > 0) {
    return email.split("@")[0] ?? "Trader";
  }
  return "Trader";
}

function buildProspectNames(viewer: MobileViewer): [string, string] {
  const firstNames = [
    "Amara",
    "Noel",
    "Sofia",
    "Kai",
    "Mila",
    "Levi",
    "Celine",
    "Nico",
  ];
  const lastNames = [
    "Torres",
    "Navarro",
    "Reyes",
    "Santos",
    "Lim",
    "Cruz",
    "Park",
    "Mendoza",
  ];

  const source = viewer.email ?? viewer._id;
  let hash = 0;
  for (const character of source) {
    hash = (hash * 31 + character.charCodeAt(0)) & 0x7fffffff;
  }

  function buildName(offset: number) {
    const first =
      firstNames[(hash + offset) % firstNames.length] ??
      firstNames[0] ??
      "Amara";
    const last =
      lastNames[(hash + offset * 3) % lastNames.length] ??
      lastNames[0] ??
      "Torres";
    return `${first} ${last}`;
  }

  return [buildName(1), buildName(2)];
}

export async function listAccountsForProfile(
  ctx: MobileCtx,
  profileId: Id<"mobileProfiles">,
) {
  return await ctx.db
    .query("financialAccounts")
    .withIndex("by_profileId_and_sortOrder", (q) =>
      q.eq("profileId", profileId),
    )
    .take(20);
}

export async function getDefaultAccount(
  ctx: MutationCtx,
  profileId: Id<"mobileProfiles">,
  kind: "income" | "expense",
) {
  const accounts = await listAccountsForProfile(ctx, profileId);
  const preferred = accounts.find((account) =>
    kind === "income"
      ? account.type !== "credit"
      : account.type === "cash" || account.type === "checking",
  );
  return preferred ?? accounts[0] ?? null;
}

export function formatMonthKey(timestamp: number) {
  const date = new Date(timestamp);
  const month = MONTH_LABELS[date.getUTCMonth()];
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${month}`;
}

export function getMonthLabel(timestamp: number) {
  return MONTH_LABELS[new Date(timestamp).getUTCMonth()];
}

export function getMonthStart(timestamp: number) {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
}

export function getCurrentMonthStart() {
  return getMonthStart(Date.now());
}

export function getAvatarEditorState(profile: MobileProfile) {
  const filter: AvatarFilter = profile.avatarFilter ?? "natural";
  return {
    filter,
    mirrored: profile.avatarMirror ?? false,
    offsetX: profile.avatarOffsetX ?? 0,
    offsetY: profile.avatarOffsetY ?? 0,
    rotationQuarterTurns: profile.avatarRotationQuarterTurns ?? 0,
    scale: profile.avatarScale ?? 1,
  };
}
