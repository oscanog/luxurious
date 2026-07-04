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
    adminLevel: v.optional(v.union(v.literal(0), v.literal(1), v.literal(2), v.literal(3))),
    adminAssignedBy: v.optional(v.id("users")),
    adminAssignedAt: v.optional(v.number()),
    uplineId: v.optional(v.union(v.id("users"), v.null())),
    lastUplineId: v.optional(v.union(v.id("users"), v.null())),
    // ── M025: Multi-Team ──
    activeTeamId: v.optional(v.id("teams")),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_name", ["name"])
    .index("by_upline", ["uplineId"])
    .index("by_activeTeamId", ["activeTeamId"]),

  // ── M025: Multi-Team tables ──────────────────────────────────────────────────
  teams: defineTable({
    name: v.string(),
    slug: v.string(), // server-like address, e.g. "luxxurious-team"
    description: v.optional(v.string()),
    createdBy: v.id("users"),
    masterUplineId: v.optional(v.id("users")),
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_isDefault", ["isDefault"]),

  teamMemberships: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(
      v.literal("super_admin"),
      v.literal("admin"),
      v.literal("member"),
    ),
    joinedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_teamId_and_userId", ["teamId", "userId"])
    .index("by_teamId_and_role", ["teamId", "role"]),

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
    order: v.number(), // 1, 2, 3...
    title: v.string(), // "Market Foundations"
    subtitle: v.string(), // "Freshman"
    color: v.string(), // "hsl(221 83% 53%)"
    description: v.string(),
  }).index("by_order", ["order"]),

  academyLessons: defineTable({
    levelId: v.id("academyLevels"),
    order: v.number(), // 1, 2, 3...
    slug: v.string(), // "1.1"
    title: v.string(),
    duration: v.string(), // "5 min"
    content: v.string(), // Full lesson text
  })
    .index("by_level", ["levelId"])
    .index("by_slug", ["slug"]),

  academyProgress: defineTable({
    userId: v.id("users"),
    lessonSlug: v.string(), // "1.1"
    completedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_slug", ["userId", "lessonSlug"]),

  mobileProfiles: defineTable({
    userId: v.optional(v.id("users")),
    viewerKey: v.string(),
    displayName: v.string(),
    preferredCurrencyCode: v.string(),
    birthday: v.optional(v.string()),
    bonchatId: v.optional(v.string()),
    bonchatUsername: v.optional(v.string()),
    yepbitId: v.optional(v.string()),
    yepbitUsername: v.optional(v.string()),
    avatarFilter: v.optional(
      v.union(
        v.literal("natural"),
        v.literal("gold"),
        v.literal("cool"),
        v.literal("mono"),
      ),
    ),
    avatarMirror: v.optional(v.boolean()),
    avatarOffsetX: v.optional(v.number()),
    avatarOffsetY: v.optional(v.number()),
    avatarRotationQuarterTurns: v.optional(v.number()),
    avatarScale: v.optional(v.number()),
    avatarStorageId: v.optional(v.id("_storage")),
    tier: v.optional(
      v.union(v.literal("free"), v.literal("silver"), v.literal("gold")),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_viewer_key", ["viewerKey"]),

  mobileNotificationStates: defineTable({
    profileId: v.id("mobileProfiles"),
    lastReadAt: v.number(),
    updatedAt: v.number(),
  }).index("by_profileId", ["profileId"]),

  mobileDeviceTokens: defineTable({
    profileId: v.id("mobileProfiles"),
    installationId: v.string(),
    token: v.string(),
    platform: v.string(),
    provider: v.string(),
    environment: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastSeenAt: v.number(),
  })
    .index("by_profileId_and_installationId", ["profileId", "installationId"])
    .index("by_profileId_and_updatedAt", ["profileId", "updatedAt"])
    .index("by_token", ["token"]),

  socialMediaAssets: defineTable({
    ownerUserId: v.id("users"),
    ownerProfileId: v.optional(v.id("mobileProfiles")),
    originalStorageId: v.id("_storage"),
    processedStorageId: v.optional(v.id("_storage")),
    kind: v.union(v.literal("image"), v.literal("video")),
    mimeType: v.string(),
    processedMimeType: v.optional(v.string()),
    fileName: v.optional(v.string()),
    sizeBytes: v.number(),
    processedSizeBytes: v.optional(v.number()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    posterStorageId: v.optional(v.id("_storage")),
    processingStatus: v.union(
      v.literal("uploading"),
      v.literal("queued"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("failed"),
    ),
    processingError: v.optional(v.string()),
    transcodeProfile: v.optional(v.string()),
    checksum: v.optional(v.string()),
    sourceExtension: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ownerUserId_and_createdAt", ["ownerUserId", "createdAt"])
    .index("by_ownerUserId_and_processingStatus_and_createdAt", [
      "ownerUserId",
      "processingStatus",
      "createdAt",
    ])
    .index("by_processingStatus_and_createdAt", [
      "processingStatus",
      "createdAt",
    ]),

  socialPosts: defineTable({
    authorUserId: v.id("users"),
    authorProfileId: v.optional(v.id("mobileProfiles")),
    caption: v.optional(v.string()),
    hashtags: v.array(v.string()),
    visibility: v.union(v.literal("public"), v.literal("private")),
    lifecycle: v.union(
      v.literal("draft"),
      v.literal("publishing"),
      v.literal("published"),
      v.literal("archived"),
      v.literal("deleted"),
    ),
    moderationStatus: v.union(
      v.literal("clear"),
      v.literal("flagged"),
      v.literal("removed"),
    ),
    mediaCount: v.number(),
    likeCount: v.number(),
    commentCount: v.number(),
    saveCount: v.number(),
    publishedAt: v.optional(v.number()),
    lastEditedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_authorUserId_and_lifecycle_and_updatedAt", [
      "authorUserId",
      "lifecycle",
      "updatedAt",
    ])
    .index("by_authorUserId_and_lifecycle_and_createdAt", [
      "authorUserId",
      "lifecycle",
      "createdAt",
    ])
    .index("by_lifecycle_and_visibility_and_publishedAt", [
      "lifecycle",
      "visibility",
      "publishedAt",
    ])
    .index("by_visibility_and_publishedAt", ["visibility", "publishedAt"]),

  socialPostMedia: defineTable({
    postId: v.id("socialPosts"),
    assetId: v.id("socialMediaAssets"),
    sortOrder: v.number(),
    altText: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_postId_and_sortOrder", ["postId", "sortOrder"])
    .index("by_assetId", ["assetId"]),

  socialPostLikes: defineTable({
    postId: v.id("socialPosts"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_postId_and_createdAt", ["postId", "createdAt"])
    .index("by_postId_and_userId", ["postId", "userId"])
    .index("by_userId_and_createdAt", ["userId", "createdAt"]),

  socialPostComments: defineTable({
    postId: v.id("socialPosts"),
    authorUserId: v.id("users"),
    authorProfileId: v.optional(v.id("mobileProfiles")),
    body: v.string(),
    status: v.union(
      v.literal("visible"),
      v.literal("deleted"),
      v.literal("removed"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_postId_and_createdAt", ["postId", "createdAt"])
    .index("by_authorUserId_and_createdAt", ["authorUserId", "createdAt"]),

  socialSavedPosts: defineTable({
    postId: v.id("socialPosts"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_userId_and_createdAt", ["userId", "createdAt"])
    .index("by_postId_and_userId", ["postId", "userId"]),

  socialPostHashtags: defineTable({
    postId: v.id("socialPosts"),
    hashtag: v.string(),
    createdAt: v.number(),
  })
    .index("by_hashtag_and_createdAt", ["hashtag", "createdAt"])
    .index("by_postId", ["postId"]),

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
    .index("by_profileId_and_kind_and_occurredAt", [
      "profileId",
      "kind",
      "occurredAt",
    ])
    .index("by_profileId_and_category_and_occurredAt", [
      "profileId",
      "category",
      "occurredAt",
    ])
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
    userId: v.optional(v.id("users")),
    // ── M025: Multi-Team ──
    teamId: v.optional(v.id("teams")),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    middleName: v.optional(v.string()),
    name: v.string(), // Legacy full name
    roleTitle: v.string(),
    status: v.union(
      v.literal("joined"),
      v.literal("invited"),
      v.literal("pending"),
      v.literal("to-invite"),
    ),
    parentMemberId: v.optional(v.union(v.id("networkMembers"), v.null())),
    isViewer: v.boolean(),
    sortOrder: v.number(),
    joinedAt: v.optional(v.number()),
    bonchatId: v.optional(v.string()),
    bonchatUsername: v.optional(v.string()),
    yepbitId: v.optional(v.string()),
    yepbitUsername: v.optional(v.string()),
    birthday: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    currentWork: v.optional(v.string()),
    investmentStartedAt: v.optional(v.number()),
    city: v.optional(v.string()),
    province: v.optional(v.string()),
    country: v.optional(v.string()),
    locationAddress: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    directLimitOverride: v.optional(v.number()),
    createdByUserId: v.optional(v.id("users")),
    ownedByUserId: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_profileId_and_sortOrder", ["profileId", "sortOrder"])
    .index("by_profileId_and_parentMemberId", ["profileId", "parentMemberId"])
    .index("by_profileId_and_status", ["profileId", "status"])
    .index("by_profileId_and_isViewer", ["profileId", "isViewer"])
    .index("by_createdByUserId", ["createdByUserId"])
    .index("by_ownedByUserId", ["ownedByUserId"])
    .index("by_userId", ["userId"])
    .index("by_email", ["email"])
    .index("by_teamId", ["teamId"]),

  memberAssets: defineTable({
    memberId: v.id("networkMembers"),
    name: v.string(),
    value: v.number(),
    currency: v.string(),
    createdAt: v.number(),
  })
    .index("by_memberId", ["memberId"])
    .index("by_memberId_and_createdAt", ["memberId", "createdAt"]),

  invitations: defineTable({
    uplineId: v.id("users"),
    email: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("expired"),
    ),
    sentAt: v.number(),
    code: v.string(), // Unique invitation code
  })
    .index("by_upline", ["uplineId"])
    .index("by_email", ["email"])
    .index("by_code", ["code"]),

  events: defineTable({
    profileId: v.id("mobileProfiles"),
    title: v.string(),
    description: v.optional(v.string()),
    date: v.string(), // ISO date string
    category: v.union(
      v.literal("financial"),
      v.literal("personal"),
      v.literal("network"),
    ),
    isDone: v.boolean(),
  })
    .index("by_profileId", ["profileId"])
    .index("by_profileId_and_date", ["profileId", "date"]),

  receipts: defineTable({
    profileId: v.id("mobileProfiles"),
    storageId: v.id("_storage"),
    vendor: v.optional(v.string()),
    totalAmount: v.optional(v.number()),
    date: v.optional(v.string()),
    category: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("processed"),
      v.literal("failed"),
    ),
  })
    .index("by_profileId", ["profileId"])
    .index("by_status", ["status"]),

  shoppingItems: defineTable({
    profileId: v.id("mobileProfiles"),
    name: v.string(),
    quantity: v.string(), // e.g. "2 pcs", "1 kg"
    category: v.string(), // e.g. "Office", "Home", "Tech"
    isChecked: v.boolean(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  })
    .index("by_profileId", ["profileId"])
    .index("by_profileId_and_category", ["profileId", "category"]),

  tickets: defineTable({
    profileId: v.id("mobileProfiles"),
    subject: v.string(),
    message: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("resolved"),
      v.literal("closed"),
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    createdAt: v.number(),
  })
    .index("by_profileId", ["profileId"])
    .index("by_status", ["status"]),

  tradingSignals: defineTable({
    symbol: v.string(),
    type: v.union(v.literal("buy"), v.literal("sell")),
    entry: v.number(),
    tp1: v.number(),
    tp2: v.optional(v.number()),
    tp3: v.optional(v.number()),
    sl: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("tp_hit"),
      v.literal("sl_hit"),
      v.literal("cancelled"),
    ),
    result: v.optional(v.number()),
    riskReward: v.optional(v.string()),
    timeframe: v.string(),
    strategy: v.string(),
    notes: v.optional(v.string()),
    isFeatured: v.boolean(),
    tier: v.union(v.literal("free"), v.literal("silver"), v.literal("gold")),
    analystId: v.id("users"),
    closedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_analyst", ["analystId"])
    .index("by_tier", ["tier"]),

  signalSchedules: defineTable({
    title: v.string(),
    session: v.union(
      v.literal("london"),
      v.literal("new_york"),
      v.literal("asia"),
      v.literal("custom"),
    ),
    dayOfWeek: v.number(),
    time: v.string(),
    timezone: v.string(),
    analystName: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  }),

  signalMilestones: defineTable({
    title: v.string(),
    description: v.string(),
    tier: v.union(v.literal("free"), v.literal("silver"), v.literal("gold")),
    requiredSignals: v.number(),
    requiredWinRate: v.optional(v.number()),
    sortOrder: v.number(),
    isActive: v.boolean(),
  }).index("by_sortOrder", ["sortOrder"]),

  signalParticipation: defineTable({
    signalId: v.id("tradingSignals"),
    userId: v.id("users"),
    status: v.union(v.literal("success"), v.literal("error")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_signal", ["signalId"])
    .index("by_user", ["userId"]),

  sessionAttendance: defineTable({
    date: v.string(), // YYYY-MM-DD
    userId: v.id("users"),
    sessionTime: v.string(), // "3pm", "6pm", etc.
    attended: v.boolean(),
  })
    .index("by_date_and_user", ["date", "userId"])
    .index("by_userId", ["userId"]),

  apkReleases: defineTable({
    version: v.string(), // e.g., "1.0.4"
    buildNumber: v.number(), // e.g., 42
    releaseNotes: v.string(), // Markdown formatted
    storageId: v.id("_storage"), // Convex storage reference
    fileSize: v.number(), // Size in bytes
    fileName: v.string(),
    isActive: v.boolean(), // Soft delete or visibility toggle
    publishedAt: v.number(), // Timestamp
    uploadedBy: v.optional(v.id("users")), // Admin reference
  })
    .index("by_publishedAt", ["publishedAt"])
    .index("by_buildNumber", ["buildNumber"])
    .index("by_isActive", ["isActive", "publishedAt"]),

  // ── M014: Presentation Studio ──────────────────────────────────────────────
  presentations: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    // Each slide: id (uuid), serialized Fabric.js canvas JSON, display order, optional thumbnail
    slides: v.array(
      v.object({
        id: v.string(),
        canvasJson: v.string(),
        order: v.number(),
        thumbnail: v.optional(v.id("_storage")),
        transition: v.optional(v.string()), // "fade"|"slide-left"|"slide-right"|"zoom"|"none"
        transitionDuration: v.optional(v.number()), // ms
      }),
    ),
    slideWidth: v.number(), // default 1920
    slideHeight: v.number(), // default 1080
    coverThumbnail: v.optional(v.id("_storage")),
    createdBy: v.id("users"),
    updatedAt: v.number(),
    isArchived: v.boolean(),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_createdBy", ["createdBy"])
    .index("by_isArchived", ["isArchived"])
    .index("by_updatedAt", ["updatedAt"]),

  presentationTemplates: defineTable({
    name: v.string(),
    category: v.string(), // "pitch-deck"|"report"|"proposal"|"blank"
    slides: v.array(
      v.object({
        id: v.string(),
        canvasJson: v.string(),
        order: v.number(),
      }),
    ),
    slideWidth: v.number(),
    slideHeight: v.number(),
    thumbnail: v.optional(v.id("_storage")),
    isSystem: v.boolean(), // true = shipped with app
  }).index("by_category", ["category"]),

  aiSettings: defineTable({
    key: v.literal("default"),
    provider: v.literal("deepseek"),
    baseUrl: v.string(),
    defaultModel: v.union(
      v.literal("deepseek-v4-flash"),
      v.literal("deepseek-v4-pro"),
    ),
    encryptedApiKey: v.optional(v.string()),
    apiKeyPreview: v.optional(v.string()),
    apiKeyRotatedAt: v.optional(v.number()),
    temperature: v.number(),
    maxOutputTokens: v.number(),
    dailyUserMessageLimit: v.number(),
    monthlyUserTokenLimit: v.number(),
    enabledScopes: v.array(v.string()),
    enabledSkills: v.array(v.string()),
    isEnabled: v.boolean(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  }).index("by_key", ["key"]),

  aiChatThreads: defineTable({
    userId: v.id("users"),
    title: v.optional(v.string()),
    threadSummary: v.optional(v.string()),
    activeScopes: v.optional(v.array(v.string())),
    activeEntities: v.optional(v.array(v.string())),
    lastIntent: v.optional(v.string()),
    lastToolResults: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId_and_updatedAt", ["userId", "updatedAt"]),

  aiChatMessages: defineTable({
    threadId: v.id("aiChatThreads"),
    userId: v.id("users"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system"),
    ),
    content: v.string(),
    model: v.optional(v.string()),
    provider: v.optional(v.string()),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    totalTokens: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_threadId_and_createdAt", ["threadId", "createdAt"])
    .index("by_userId_and_createdAt", ["userId", "createdAt"]),

  aiUsageEvents: defineTable({
    userId: v.id("users"),
    provider: v.string(),
    model: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    status: v.union(
      v.literal("success"),
      v.literal("error"),
      v.literal("blocked"),
    ),
    createdAt: v.number(),
  }).index("by_userId_and_createdAt", ["userId", "createdAt"]),

  aiSettingsAuditEvents: defineTable({
    adminUserId: v.id("users"),
    action: v.string(),
    safeDetails: v.string(),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  aiKnowledgeDocuments: defineTable({
    title: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    fileSize: v.number(),
    storageId: v.id("_storage"),
    status: v.union(
      v.literal("pending"),
      v.literal("ready"),
      v.literal("failed"),
    ),
    chunkCount: v.number(),
    extractedCharCount: v.number(),
    uploadedBy: v.id("users"),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_status", ["status"])
    .index("by_uploadedBy", ["uploadedBy"]),

  aiKnowledgeChunks: defineTable({
    documentId: v.id("aiKnowledgeDocuments"),
    chunkIndex: v.number(),
    title: v.string(),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_documentId", ["documentId"])
    .index("by_documentId_and_chunkIndex", ["documentId", "chunkIndex"]),

  aiDbEmbeddings: defineTable({
    table: v.union(
      v.literal("networkMembers"),
      v.literal("memberAssets"),
      v.literal("financialAccounts"),
      v.literal("financialTransactions"),
      v.literal("academyLessons"),
      v.literal("aiKnowledgeChunks"),
    ),
    sourceId: v.string(),
    profileId: v.optional(v.id("mobileProfiles")),
    ownerUserId: v.optional(v.id("users")),
    title: v.string(),
    content: v.string(),
    embeddingModel: v.string(),
    embeddingDimension: v.number(),
    embedding: v.array(v.number()),
    checksum: v.string(),
    updatedAt: v.number(),
  })
    .index("by_table_and_sourceId", ["table", "sourceId"])
    .index("by_profileId_and_table", ["profileId", "table"])
    .index("by_ownerUserId_and_table", ["ownerUserId", "table"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1024,
      filterFields: ["table", "profileId", "ownerUserId"],
    }),
});
