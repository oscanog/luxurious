import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  // Spread auth tables but OVERRIDE users with our extended version
  ...authTables,
  users: defineTable({
    // ── Fields from authTables ──
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // ── Custom fields ──
    role: v.optional(v.union(v.literal("admin"), v.literal("member"))),
    uplineId: v.optional(v.union(v.id("users"), v.null())),
    lastUplineId: v.optional(v.union(v.id("users"), v.null())),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_upline", ["uplineId"]),

  wallets: defineTable({
    userId: v.id("users"),
    balance: v.number(), // Virtual USD
  }).index("by_user", ["userId"]),
  
  trades: defineTable({
    userId: v.id("users"),
    symbol: v.string(),
    type: v.union(v.literal("buy"), v.literal("sell")),
    side: v.union(v.literal("long"), v.literal("short")),
    entryPrice: v.number(),
    exitPrice: v.optional(v.number()),
    amount: v.number(),
    status: v.union(v.literal("open"), v.literal("closed")),
    openedAt: v.number(),
    closedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  // -- Trading Academy --
  academyLevels: defineTable({
    order: v.number(),          // 1, 2, 3...
    title: v.string(),          // "Market Foundations"
    subtitle: v.string(),       // "Freshman"
    color: v.string(),          // "hsl(221 83% 53%)"
    description: v.string(),
  }).index("by_order", ["order"]),

  academyLessons: defineTable({
    levelId: v.id("academyLevels"),
    order: v.number(),          // 1, 2, 3...
    slug: v.string(),           // "1.1"
    title: v.string(),
    duration: v.string(),       // "5 min"
    content: v.string(),        // Full lesson text
  }).index("by_level", ["levelId"])
    .index("by_slug", ["slug"]),

  academyProgress: defineTable({
    userId: v.id("users"),
    lessonSlug: v.string(),     // "1.1"
    completedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_and_slug", ["userId", "lessonSlug"]),

  mobileProfiles: defineTable({
    userId: v.optional(v.id("users")),
    viewerKey: v.string(),
    displayName: v.string(),
    preferredCurrencyCode: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_viewer_key", ["viewerKey"]),

  financialAccounts: defineTable({
    profileId: v.id("mobileProfiles"),
    name: v.string(),
    institution: v.string(),
    type: v.union(
      v.literal("savings"),
      v.literal("cash"),
      v.literal("credit"),
      v.literal("checking"),
      v.literal("investment"),
    ),
    balance: v.number(),
    currencyCode: v.string(),
    sortOrder: v.number(),
    isArchived: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_profileId_and_sortOrder", ["profileId", "sortOrder"])
    .index("by_profileId_and_type", ["profileId", "type"]),

  financialTransactions: defineTable({
    profileId: v.id("mobileProfiles"),
    accountId: v.id("financialAccounts"),
    kind: v.union(v.literal("income"), v.literal("expense")),
    category: v.string(),
    note: v.optional(v.string()),
    amount: v.number(),
    occurredAt: v.number(),
    currencyCode: v.string(),
    source: v.union(v.literal("manual"), v.literal("receipt")),
    createdAt: v.number(),
  })
    .index("by_profileId_and_occurredAt", ["profileId", "occurredAt"])
    .index("by_profileId_and_kind_and_occurredAt", ["profileId", "kind", "occurredAt"])
    .index("by_profileId_and_category_and_occurredAt", ["profileId", "category", "occurredAt"])
    .index("by_accountId_and_occurredAt", ["accountId", "occurredAt"]),

  budgetPlans: defineTable({
    profileId: v.id("mobileProfiles"),
    category: v.string(),
    limitAmount: v.number(),
    color: v.string(),
    period: v.literal("monthly"),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_profileId_and_sortOrder", ["profileId", "sortOrder"]),

  debtPlans: defineTable({
    profileId: v.id("mobileProfiles"),
    name: v.string(),
    remainingAmount: v.number(),
    paymentAmount: v.number(),
    paymentCadence: v.string(),
    lender: v.string(),
    kind: v.string(),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_profileId_and_sortOrder", ["profileId", "sortOrder"]),

  installmentPlans: defineTable({
    profileId: v.id("mobileProfiles"),
    itemName: v.string(),
    currentInstallment: v.number(),
    totalInstallments: v.number(),
    paymentAmount: v.number(),
    nextDueDate: v.string(),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_profileId_and_sortOrder", ["profileId", "sortOrder"]),

  networkMembers: defineTable({
    profileId: v.id("mobileProfiles"),
    name: v.string(),
    roleTitle: v.string(),
    status: v.union(v.literal("joined"), v.literal("invited"), v.literal("pending")),
    parentMemberId: v.optional(v.union(v.id("networkMembers"), v.null())),
    isViewer: v.boolean(),
    sortOrder: v.number(),
    joinedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_profileId_and_sortOrder", ["profileId", "sortOrder"])
    .index("by_profileId_and_parentMemberId", ["profileId", "parentMemberId"])
    .index("by_profileId_and_status", ["profileId", "status"])
    .index("by_profileId_and_isViewer", ["profileId", "isViewer"]),
});
