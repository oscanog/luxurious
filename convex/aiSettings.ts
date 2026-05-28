import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  QueryCtx,
  MutationCtx,
} from "./_generated/server";
import { Id } from "./_generated/dataModel";

const DEFAULT_SETTINGS = {
  key: "default" as const,
  provider: "deepseek" as const,
  baseUrl: "https://api.deepseek.com",
  defaultModel: "deepseek-v4-flash" as const,
  temperature: 0.7,
  maxOutputTokens: 1200,
  dailyUserMessageLimit: 40,
  monthlyUserTokenLimit: 250000,
  enabledScopes: ["network", "finance", "academy", "support"],
  enabledSkills: ["general_chat", "workspace_help", "semantic_lookup"],
  isEnabled: true,
};

const modelValidator = v.union(
  v.literal("deepseek-v4-flash"),
  v.literal("deepseek-v4-pro"),
);

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  const user = await ctx.db.get("users", userId);
  if (user?.email !== "admin@luxurious.trade" && user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return userId;
}

async function readSettings(ctx: QueryCtx | MutationCtx) {
  return await ctx.db
    .query("aiSettings")
    .withIndex("by_key", (q) => q.eq("key", "default"))
    .unique();
}

function publicSettings(settings: Awaited<ReturnType<typeof readSettings>>) {
  return {
    ...DEFAULT_SETTINGS,
    encryptedApiKey: undefined,
    hasApiKey: Boolean(settings?.encryptedApiKey),
    apiKeyPreview: settings?.apiKeyPreview ?? null,
    apiKeyRotatedAt: settings?.apiKeyRotatedAt ?? null,
    provider: settings?.provider ?? DEFAULT_SETTINGS.provider,
    baseUrl: settings?.baseUrl ?? DEFAULT_SETTINGS.baseUrl,
    defaultModel: settings?.defaultModel ?? DEFAULT_SETTINGS.defaultModel,
    temperature: settings?.temperature ?? DEFAULT_SETTINGS.temperature,
    maxOutputTokens: settings?.maxOutputTokens ?? DEFAULT_SETTINGS.maxOutputTokens,
    dailyUserMessageLimit:
      settings?.dailyUserMessageLimit ?? DEFAULT_SETTINGS.dailyUserMessageLimit,
    monthlyUserTokenLimit:
      settings?.monthlyUserTokenLimit ?? DEFAULT_SETTINGS.monthlyUserTokenLimit,
    enabledScopes: settings?.enabledScopes ?? DEFAULT_SETTINGS.enabledScopes,
    enabledSkills: settings?.enabledSkills ?? DEFAULT_SETTINGS.enabledSkills,
    isEnabled: settings?.isEnabled ?? DEFAULT_SETTINGS.isEnabled,
    updatedAt: settings?.updatedAt ?? null,
    updatedBy: settings?.updatedBy ?? null,
  };
}

export const getPublicSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await readSettings(ctx);
    return publicSettings(settings);
  },
});

export const getAdminSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const settings = await readSettings(ctx);
    return publicSettings(settings);
  },
});

export const getThreadMessages = query({
  args: {
    threadId: v.id("aiChatThreads"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const thread = await ctx.db.get("aiChatThreads", args.threadId);
    if (!thread || thread.userId !== userId) {
      throw new Error("Thread not found");
    }

    const messages = await ctx.db
      .query("aiChatMessages")
      .withIndex("by_threadId_and_createdAt", (q) => q.eq("threadId", args.threadId))
      .order("desc")
      .take(Math.min(Math.max(args.limit ?? 40, 1), 80));

    return messages.reverse().map((message) => ({
      id: message._id,
      role: message.role,
      content: message.content,
      model: message.model ?? null,
      provider: message.provider ?? null,
      error: message.error ?? null,
      createdAt: message.createdAt,
    }));
  },
});

export const listAuditEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("aiSettingsAuditEvents")
      .withIndex("by_createdAt")
      .order("desc")
      .take(Math.min(Math.max(args.limit ?? 12, 1), 50));
  },
});

export const updateSettings = mutation({
  args: {
    defaultModel: modelValidator,
    temperature: v.number(),
    maxOutputTokens: v.number(),
    dailyUserMessageLimit: v.number(),
    monthlyUserTokenLimit: v.number(),
    enabledScopes: v.array(v.string()),
    enabledSkills: v.array(v.string()),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const adminUserId = await requireAdmin(ctx);
    const now = Date.now();
    const settings = await readSettings(ctx);
    const patch = {
      provider: DEFAULT_SETTINGS.provider,
      baseUrl: DEFAULT_SETTINGS.baseUrl,
      defaultModel: args.defaultModel,
      temperature: args.temperature,
      maxOutputTokens: args.maxOutputTokens,
      dailyUserMessageLimit: args.dailyUserMessageLimit,
      monthlyUserTokenLimit: args.monthlyUserTokenLimit,
      enabledScopes: args.enabledScopes,
      enabledSkills: args.enabledSkills,
      isEnabled: args.isEnabled,
      updatedAt: now,
      updatedBy: adminUserId,
    };

    if (settings) {
      await ctx.db.patch("aiSettings", settings._id, patch);
    } else {
      await ctx.db.insert("aiSettings", {
        key: "default",
        ...patch,
      });
    }

    await ctx.db.insert("aiSettingsAuditEvents", {
      adminUserId,
      action: "settings.update",
      safeDetails: JSON.stringify({
        defaultModel: args.defaultModel,
        isEnabled: args.isEnabled,
        enabledScopes: args.enabledScopes,
        enabledSkills: args.enabledSkills,
      }),
      createdAt: now,
    });
  },
});

export const getSettingsForAction = internalQuery({
  args: {},
  handler: async (ctx) => {
    const settings = await readSettings(ctx);
    return {
      ...DEFAULT_SETTINGS,
      encryptedApiKey: settings?.encryptedApiKey ?? null,
      apiKeyPreview: settings?.apiKeyPreview ?? null,
      apiKeyRotatedAt: settings?.apiKeyRotatedAt ?? null,
      provider: settings?.provider ?? DEFAULT_SETTINGS.provider,
      baseUrl: settings?.baseUrl ?? DEFAULT_SETTINGS.baseUrl,
      defaultModel: settings?.defaultModel ?? DEFAULT_SETTINGS.defaultModel,
      temperature: settings?.temperature ?? DEFAULT_SETTINGS.temperature,
      maxOutputTokens: settings?.maxOutputTokens ?? DEFAULT_SETTINGS.maxOutputTokens,
      dailyUserMessageLimit:
        settings?.dailyUserMessageLimit ?? DEFAULT_SETTINGS.dailyUserMessageLimit,
      monthlyUserTokenLimit:
        settings?.monthlyUserTokenLimit ?? DEFAULT_SETTINGS.monthlyUserTokenLimit,
      enabledScopes: settings?.enabledScopes ?? DEFAULT_SETTINGS.enabledScopes,
      enabledSkills: settings?.enabledSkills ?? DEFAULT_SETTINGS.enabledSkills,
      isEnabled: settings?.isEnabled ?? DEFAULT_SETTINGS.isEnabled,
    };
  },
});

export const saveEncryptedKey = internalMutation({
  args: {
    adminUserId: v.id("users"),
    encryptedApiKey: v.string(),
    apiKeyPreview: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get("users", args.adminUserId);
    if (admin?.email !== "admin@luxurious.trade" && admin?.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const settings = await readSettings(ctx);
    const patch = {
      provider: DEFAULT_SETTINGS.provider,
      baseUrl: DEFAULT_SETTINGS.baseUrl,
      defaultModel: settings?.defaultModel ?? DEFAULT_SETTINGS.defaultModel,
      encryptedApiKey: args.encryptedApiKey,
      apiKeyPreview: args.apiKeyPreview,
      apiKeyRotatedAt: now,
      temperature: settings?.temperature ?? DEFAULT_SETTINGS.temperature,
      maxOutputTokens: settings?.maxOutputTokens ?? DEFAULT_SETTINGS.maxOutputTokens,
      dailyUserMessageLimit:
        settings?.dailyUserMessageLimit ?? DEFAULT_SETTINGS.dailyUserMessageLimit,
      monthlyUserTokenLimit:
        settings?.monthlyUserTokenLimit ?? DEFAULT_SETTINGS.monthlyUserTokenLimit,
      enabledScopes: settings?.enabledScopes ?? DEFAULT_SETTINGS.enabledScopes,
      enabledSkills: settings?.enabledSkills ?? DEFAULT_SETTINGS.enabledSkills,
      isEnabled: settings?.isEnabled ?? DEFAULT_SETTINGS.isEnabled,
      updatedAt: now,
      updatedBy: args.adminUserId,
    };

    if (settings) {
      await ctx.db.patch("aiSettings", settings._id, patch);
    } else {
      await ctx.db.insert("aiSettings", {
        key: "default",
        ...patch,
      });
    }

    await ctx.db.insert("aiSettingsAuditEvents", {
      adminUserId: args.adminUserId,
      action: "settings.key.rotate",
      safeDetails: JSON.stringify({ apiKeyPreview: args.apiKeyPreview }),
      createdAt: now,
    });
  },
});

export const getRecentMessages = internalQuery({
  args: {
    userId: v.id("users"),
    threadId: v.id("aiChatThreads"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get("aiChatThreads", args.threadId);
    if (!thread || thread.userId !== args.userId) {
      throw new Error("Thread not found");
    }

    const messages = await ctx.db
      .query("aiChatMessages")
      .withIndex("by_threadId_and_createdAt", (q) => q.eq("threadId", args.threadId))
      .order("desc")
      .take(Math.min(Math.max(args.limit ?? 20, 1), 40));

    return messages.reverse().map((message) => ({
      role: message.role,
      content: message.content,
    }));
  },
});

export const getThreadMemory = internalQuery({
  args: {
    userId: v.id("users"),
    threadId: v.id("aiChatThreads"),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get("aiChatThreads", args.threadId);
    if (!thread || thread.userId !== args.userId) {
      throw new Error("Thread not found");
    }
    return {
      threadSummary: thread.threadSummary ?? "",
      activeScopes: thread.activeScopes ?? [],
      activeEntities: thread.activeEntities ?? [],
      lastIntent: thread.lastIntent ?? "",
      lastToolResults: thread.lastToolResults ?? "",
    };
  },
});

export const createUserMessage = internalMutation({
  args: {
    userId: v.id("users"),
    threadId: v.optional(v.id("aiChatThreads")),
    content: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"aiChatThreads">> => {
    const now = Date.now();
    let threadId = args.threadId;

    if (threadId) {
      const thread = await ctx.db.get("aiChatThreads", threadId);
      if (!thread || thread.userId !== args.userId) {
        throw new Error("Thread not found");
      }
      await ctx.db.patch("aiChatThreads", threadId, { updatedAt: now });
    } else {
      threadId = await ctx.db.insert("aiChatThreads", {
        userId: args.userId,
        title: args.content.slice(0, 64),
        threadSummary: "",
        activeScopes: [],
        activeEntities: [],
        lastIntent: "",
        lastToolResults: "",
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.insert("aiChatMessages", {
      threadId,
      userId: args.userId,
      role: "user",
      content: args.content,
      createdAt: now,
    });

    return threadId;
  },
});

export const saveAssistantMessage = internalMutation({
  args: {
    userId: v.id("users"),
    threadId: v.id("aiChatThreads"),
    content: v.string(),
    model: v.string(),
    provider: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    totalTokens: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("aiChatMessages", {
      threadId: args.threadId,
      userId: args.userId,
      role: "assistant",
      content: args.content,
      model: args.model,
      provider: args.provider,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      totalTokens: args.totalTokens,
      createdAt: now,
    });
    await ctx.db.patch("aiChatThreads", args.threadId, { updatedAt: now });
    await ctx.db.insert("aiUsageEvents", {
      userId: args.userId,
      provider: args.provider,
      model: args.model,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      status: "success",
      createdAt: now,
    });
  },
});

export const updateThreadMemory = internalMutation({
  args: {
    userId: v.id("users"),
    threadId: v.id("aiChatThreads"),
    activeScopes: v.array(v.string()),
    activeEntities: v.array(v.string()),
    lastIntent: v.string(),
    lastToolResults: v.string(),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get("aiChatThreads", args.threadId);
    if (!thread || thread.userId !== args.userId) {
      throw new Error("Thread not found");
    }

    const summaryParts = [];
    if (args.lastIntent) summaryParts.push(`Current intent: ${args.lastIntent}`);
    if (args.activeEntities.length > 0) {
      summaryParts.push(`Active entities: ${args.activeEntities.join(", ")}`);
    }
    if (args.activeScopes.length > 0) {
      summaryParts.push(`Active scopes: ${args.activeScopes.join(", ")}`);
    }

    await ctx.db.patch("aiChatThreads", args.threadId, {
      threadSummary: summaryParts.join(". "),
      activeScopes: args.activeScopes.slice(0, 8),
      activeEntities: args.activeEntities.slice(0, 12),
      lastIntent: args.lastIntent,
      lastToolResults: args.lastToolResults.slice(0, 2000),
      updatedAt: Date.now(),
    });
  },
});

export const getUsageWindow = internalQuery({
  args: {
    userId: v.id("users"),
    since: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("aiUsageEvents")
      .withIndex("by_userId_and_createdAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(Math.min(Math.max(args.limit ?? 1000, 1), 2000));

    return events
      .filter((event) => event.createdAt >= args.since)
      .reduce(
        (summary, event) => ({
          messageCount:
            summary.messageCount + (event.status === "success" ? 1 : 0),
          tokenCount:
            summary.tokenCount + event.inputTokens + event.outputTokens,
        }),
        { messageCount: 0, tokenCount: 0 },
      );
  },
});

export const saveBlockedUsage = internalMutation({
  args: {
    userId: v.id("users"),
    provider: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("aiUsageEvents", {
      userId: args.userId,
      provider: args.provider,
      model: args.model,
      inputTokens: 0,
      outputTokens: 0,
      status: "blocked",
      createdAt: Date.now(),
    });
  },
});
