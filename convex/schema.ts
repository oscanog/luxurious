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
});
