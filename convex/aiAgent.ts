"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { decryptSecret } from "./aiCrypto";
import { embedQuery } from "./aiEmbeddings";
import { formatKnowledgeContext, searchKnowledgeChunks } from "./aiPgvector";

type ChatRole = "system" | "user" | "assistant";

type DeepSeekMessage = {
  role: ChatRole;
  content: string;
};

type DeepSeekUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function readTextResponse(payload: unknown) {
  const root = asRecord(payload);
  const choices = Array.isArray(root.choices) ? root.choices : [];
  const firstChoice = asRecord(choices[0]);
  const message = asRecord(firstChoice.message);
  const content = message.content;

  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error("DeepSeek returned an empty response.");
  }

  const usageRecord = asRecord(root.usage);
  const usage: DeepSeekUsage = {
    prompt_tokens:
      typeof usageRecord.prompt_tokens === "number" ? usageRecord.prompt_tokens : 0,
    completion_tokens:
      typeof usageRecord.completion_tokens === "number"
        ? usageRecord.completion_tokens
        : 0,
    total_tokens:
      typeof usageRecord.total_tokens === "number" ? usageRecord.total_tokens : 0,
  };

  return { content, usage };
}

function toDeepSeekMessages(messages: DeepSeekMessage[]) {
  const knowledgeContext = messages.find((message) => message.role === "system")?.content;
  return [
    {
      role: "system" as const,
      content: [
        [
          "You are Luxurious AI, a concise workspace assistant for the Luxurious trading workspace.",
          "Help with dashboard, network, finance, academy, trading signals, presentations, and support tasks.",
          "The project tracks milestones M001 through M019. Current active milestone: M019 (AI Agent Infrastructure).",
          "Completed milestones include: M001 Polish, M002 Trading Sim, M003 Admin, M004 Org Chart, M005 Mobile API,",
          "M006 Parity, M007 Deep-Link, M008 Light Mode, M009 Signals, M010 Mobile Parity, M011 Desktop Parity,",
          "M012 Social, M013 APK, M014 Presentations, M018 Analytics.",
          "Available workspace modules: Network Org Chart, Trading Simulator, Trading Signals, Academy, Finance Tracker,",
          "Social Feed, Presentation Studio, Admin Portal, AI Settings.",
          "When WORKSPACE DATA sections are provided below, use them to answer with real live details.",
          "If pgvector retrieval context is also provided, combine both sources for the best answer.",
          "Do not claim access to secrets or private data unless provided in the chat.",
        ].join(" "),
        knowledgeContext ? `Use this bounded retrieval context when relevant:\n${knowledgeContext}` : "",
      ].filter(Boolean).join("\n\n"),
    },
    ...messages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .map((message) => ({
        role: message.role,
        content: message.content,
      })),
  ];
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function startOfMonth() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

const SCOPE_KEYWORDS: Record<string, string[]> = {
  network: ["member", "network", "downline", "upline", "org", "team", "recruit", "direct", "joined", "bonchat", "yepbit", "user", "asset", "investment", "details"],
  trading: ["trade", "signal", "portfolio", "position", "entry", "stop loss"],
  finance: ["finance", "account", "transaction", "budget", "balance", "money", "debt", "installment"],
  academy: ["academy", "lesson", "course", "learn", "progress", "level"],
  social: ["social", "post", "feed", "hashtag"],
  support: ["ticket", "support", "issue", "priority"],
  admin: ["admin", "user count", "system", "apk", "release"],
  presentations: ["presentation", "slide", "deck", "studio"],
  calendar: ["event", "calendar", "schedule", "upcoming"],
  shopping: ["shopping", "grocery", "item list"],
};

function detectScopes(message: string): string[] {
  const lower = message.toLowerCase();
  const scopes: string[] = [];
  for (const [scope, keywords] of Object.entries(SCOPE_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      scopes.push(scope);
    }
  }
  return scopes;
}

function extractSearchTerm(message: string): string | undefined {
  // Quoted names
  const quoted = message.match(/["\u201c\u201d]([^"\u201c\u201d]+)["\u201c\u201d]/u);
  if (quoted) return quoted[1].trim();

  // "details of NAME", "about NAME", "who is NAME"
  const patterns = [
    /details?\s+(?:of|about|for)\s+(.+?)(?:\s*[[(,.]|$)/i,
    /(?:who is|find|search|look up|info on)\s+(.+?)(?:\s*[[(,.]|$)/i,
    /(?:about|regarding)\s+(.+?)(?:\s*[[(,.]|$)/i,
  ];
  for (const p of patterns) {
    const m = message.match(p);
    if (m && m[1].trim().length > 1) return m[1].trim();
  }
  return undefined;
}

export const sendMessage = action({
  args: {
    threadId: v.optional(v.id("aiChatThreads")),
    message: v.string(),
  },
  handler: async (ctx, args): Promise<{
    threadId: Id<"aiChatThreads">;
    content: string;
    model: string;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const message = args.message.trim();
    if (message.length === 0) {
      throw new Error("Message is required.");
    }
    if (message.length > 4000) {
      throw new Error("Message is too long.");
    }

    const settings = await ctx.runQuery(internal.aiSettings.getSettingsForAction, {});
    if (!settings.isEnabled) {
      throw new Error("AI assistant is disabled by admin.");
    }
    if (!settings.encryptedApiKey) {
      throw new Error("AI assistant is missing DeepSeek API key.");
    }

    const dailyUsage = await ctx.runQuery(internal.aiSettings.getUsageWindow, {
      userId,
      since: startOfToday(),
      limit: settings.dailyUserMessageLimit + 20,
    });
    if (dailyUsage.messageCount >= settings.dailyUserMessageLimit) {
      await ctx.runMutation(internal.aiSettings.saveBlockedUsage, {
        userId,
        provider: settings.provider,
        model: settings.defaultModel,
      });
      throw new Error("Daily AI message limit reached.");
    }

    const monthlyUsage = await ctx.runQuery(internal.aiSettings.getUsageWindow, {
      userId,
      since: startOfMonth(),
      limit: 2000,
    });
    if (monthlyUsage.tokenCount >= settings.monthlyUserTokenLimit) {
      await ctx.runMutation(internal.aiSettings.saveBlockedUsage, {
        userId,
        provider: settings.provider,
        model: settings.defaultModel,
      });
      throw new Error("Monthly AI token limit reached.");
    }

    const threadId: Id<"aiChatThreads"> = await ctx.runMutation(
      internal.aiSettings.createUserMessage,
      {
        userId,
        threadId: args.threadId,
        content: message,
      },
    );

    const recentMessages: DeepSeekMessage[] = await ctx.runQuery(
      internal.aiSettings.getRecentMessages,
      {
        userId,
        threadId,
        limit: 18,
      },
    );

    const embedding = settings.enabledSkills.includes("semantic_lookup")
      ? await embedQuery(message)
      : null;
    const chunks = embedding
      ? await searchKnowledgeChunks({
        embedding,
        scopes: settings.enabledScopes,
        limit: 5,
      })
      : [];
    const knowledgeContext = formatKnowledgeContext(chunks);

    // Live workspace context
    const detectedScopes = detectScopes(message);
    const searchTerm = extractSearchTerm(message);
    
    // Force network scope if a name/search term was found but no keywords matched
    if (searchTerm && !detectedScopes.includes("network")) {
      detectedScopes.push("network");
    }

    const workspaceContext: string = detectedScopes.length > 0
      ? await ctx.runQuery(internal.aiContext.gatherContext, {
          userId,
          scopes: detectedScopes,
          searchTerm,
        })
      : "";

    const systemContextParts = [knowledgeContext, workspaceContext].filter(Boolean);
    const deepSeekMessages: DeepSeekMessage[] = systemContextParts.length > 0
      ? [{ role: "system", content: systemContextParts.join("\n\n") }, ...recentMessages]
      : recentMessages;

    const apiKey = decryptSecret(settings.encryptedApiKey);
    const response = await fetch(`${settings.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: settings.defaultModel,
        messages: toDeepSeekMessages(deepSeekMessages),
        temperature: settings.temperature,
        max_tokens: settings.maxOutputTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek request failed (${response.status}).`);
    }

    const result = readTextResponse(await response.json());
    await ctx.runMutation(internal.aiSettings.saveAssistantMessage, {
      userId,
      threadId,
      content: result.content,
      model: settings.defaultModel,
      provider: settings.provider,
      inputTokens: result.usage.prompt_tokens ?? 0,
      outputTokens: result.usage.completion_tokens ?? 0,
      totalTokens: result.usage.total_tokens ?? 0,
    });

    return {
      threadId,
      content: result.content,
      model: settings.defaultModel,
    };
  },
});
