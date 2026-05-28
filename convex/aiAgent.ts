"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action, ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";
import { decryptSecret } from "./aiCrypto";
import { embedQuery } from "./aiEmbeddings";
import { formatKnowledgeContext, searchKnowledgeChunks } from "./aiPgvector";

type DeepSeekUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

type DeepSeekToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

type DeepSeekMessage =
  | {
      role: "system" | "user" | "assistant";
      content: string | null;
      reasoning_content?: string;
      tool_calls?: DeepSeekToolCall[];
    }
  | {
      role: "tool";
      tool_call_id: string;
      content: string;
    };

type ToolExecution = {
  toolName: string;
  result: unknown;
};

type AiActivity = {
  kind: "search" | "tool";
  name: string;
  status: "success" | "warning" | "error";
  label: string;
  detail: string;
  count: number | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function readUsage(payload: unknown): DeepSeekUsage {
  const usageRecord = asRecord(asRecord(payload).usage);
  return {
    prompt_tokens:
      typeof usageRecord.prompt_tokens === "number" ? usageRecord.prompt_tokens : 0,
    completion_tokens:
      typeof usageRecord.completion_tokens === "number"
        ? usageRecord.completion_tokens
        : 0,
    total_tokens:
      typeof usageRecord.total_tokens === "number" ? usageRecord.total_tokens : 0,
  };
}

function readAssistantResponse(payload: unknown) {
  const root = asRecord(payload);
  const choices = Array.isArray(root.choices) ? root.choices : [];
  const firstChoice = asRecord(choices[0]);
  const message = asRecord(firstChoice.message);
  const content = typeof message.content === "string" ? message.content : null;
  const reasoning_content = typeof message.reasoning_content === "string" ? message.reasoning_content : undefined;
  const rawToolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
  const toolCalls = rawToolCalls
    .map((entry): DeepSeekToolCall | null => {
      const call = asRecord(entry);
      const fn = asRecord(call.function);
      if (
        typeof call.id !== "string" ||
        typeof fn.name !== "string" ||
        typeof fn.arguments !== "string"
      ) {
        return null;
      }
      return {
        id: call.id,
        type: "function",
        function: {
          name: fn.name,
          arguments: fn.arguments,
        },
      };
    })
    .filter((entry): entry is DeepSeekToolCall => entry !== null);

  if ((!content || content.trim().length === 0) && toolCalls.length === 0) {
    // If the model refuses to answer or returns empty, do not crash. Return a polite fallback.
    return {
      model: typeof root.model === "string" ? root.model : "unknown",
      message: {
        role: "assistant" as const,
        content: "I'm having trouble processing that request right now. Please try rephrasing or ask me something else.",
        tool_calls: undefined,
      },
      usage: readUsage(payload),
    };
  }

  return {
    message: {
      role: "assistant" as const,
      content,
      reasoning_content,
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
    },
    usage: readUsage(payload),
  };
}

function baseSystemPrompt(memoryContext: string, retrievalContext: string) {
  return [
    "You are Luxurious AI, a concise workspace assistant for the Luxurious trading workspace.",
    "Use tools for live workspace facts. Do not guess member, asset, finance, or lesson data.",
    "For follow-up questions like 'how about Maylyn', infer intent from thread memory and recent turns.",
    "Org chart member asset logs are memberAssets records. Finance accounts are separate banking/profile balances.",
    "When user asks latest asset for a person, call searchNetwork if needed, then getLatestAsset.",
    "If tool result has exact live data, answer from it. If no matching data exists, say so plainly.",
    "Do not claim access to secrets or private data unless tool results or chat history provide it.",
    memoryContext,
    retrievalContext ? `Reference retrieval context:\n${retrievalContext}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function toDeepSeekMessages(systemPrompt: string, messages: DeepSeekMessage[]) {
  return [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((message) => {
      if (message.role === "tool") {
        return {
          role: "tool" as const,
          tool_call_id: message.tool_call_id,
          content: message.content,
        };
      }
      const baseMessage: any = { role: message.role };
      if (message.content !== null && message.content !== "") {
        baseMessage.content = message.content;
      }
      if (message.tool_calls && message.tool_calls.length > 0) {
        baseMessage.tool_calls = message.tool_calls;
      }
      if (message.reasoning_content) {
        baseMessage.reasoning_content = message.reasoning_content;
      }
      
      // If there's neither content nor tool_calls, fallback to empty string
      if (baseMessage.content === undefined && baseMessage.tool_calls === undefined) {
        baseMessage.content = "";
      }
      
      return baseMessage;
    }),
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

function parseToolArgs(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    return asRecord(parsed);
  } catch {
    return {};
  }
}

function numberArg(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringArg(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function extractSearchTerm(message: string) {
  const patterns = [
    /(?:asset|assets|asset log|asset logs)\s+(?:of|for|from|by)\s+(.+?)(?:\s*[,.?!]|$)/i,
    /(.+?)\s+(?:asset|assets|asset log|asset logs)(?:\s*[,.?!]|$)/i,
    /(?:about|regarding|si)\s+(.+?)(?:\s+(?:ba|naman|latest)|[,.?!]|$)/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    const value = match?.[1]?.trim();
    if (value && value.length > 1) return value;
  }
  return undefined;
}

function isAssetIntent(message: string, memory: { lastIntent: string }) {
  const lower = message.toLowerCase();
  if (/\b(asset|assets|asset log|asset logs)\b/i.test(message)) {
    return true;
  }
  if (
    memory.lastIntent === "latest_member_asset" &&
    (/\b(latest|how about|magkano|si|naman)\b/i.test(lower) ||
      /^i\s+mean\b.*\bonly\b/i.test(lower))
  ) {
    return true;
  }
  return false;
}

function formatAssetAnswer(summary: Record<string, unknown>, latestOnly: boolean) {
  if (summary.found === false) {
    return "No matching member asset data found.";
  }

  const memberName = typeof summary.memberName === "string" ? summary.memberName : "Member";
  const latest = asRecord(summary.latestAsset);
  const latestValue = typeof latest.value === "number" ? latest.value : null;
  const latestCurrency = typeof latest.currency === "string" ? latest.currency : "USD";
  const latestDate = typeof latest.date === "string" ? latest.date : "unknown date";
  const latestName = typeof latest.name === "string" ? latest.name : "asset";

  if (!latestValue) {
    return `${memberName} has no org chart asset logs.`;
  }

  if (latestOnly) {
    return `${memberName}'s latest org chart asset is ${latestCurrency} ${latestValue.toFixed(2)} (${latestName}, ${latestDate}).`;
  }

  const totalValue = typeof summary.totalValue === "number" ? summary.totalValue : latestValue;
  const currency = typeof summary.currency === "string" ? summary.currency : latestCurrency;
  const assetCount = typeof summary.assetCount === "number" ? summary.assetCount : 1;
  return `${memberName}'s logged org chart assets total ${currency} ${totalValue.toFixed(2)} across ${assetCount} log${assetCount === 1 ? "" : "s"}. Latest: ${latestCurrency} ${latestValue.toFixed(2)} (${latestName}, ${latestDate}).`;
}

function arrayCount(value: unknown) {
  return Array.isArray(value) ? value.length : null;
}

function summarizeActivity(execution: ToolExecution): AiActivity {
  const result = asRecord(execution.result);
  const hasError = typeof result.error === "string";
  const found = result.found;
  const status =
    hasError ? "error" : found === false ? "warning" : "success";
  const query = typeof result.query === "string" ? result.query : "";

  if (execution.toolName === "searchNetwork") {
    const count = typeof result.count === "number" ? result.count : arrayCount(result.results);
    return {
      kind: "search",
      name: execution.toolName,
      status,
      label: "Network search",
      detail: query ? `"${query}"` : "Visible members",
      count,
    };
  }

  if (execution.toolName === "semanticSearch") {
    return {
      kind: "search",
      name: execution.toolName,
      status,
      label: "Semantic search",
      detail: query ? `"${query}"` : "Vector database",
      count: arrayCount(result.results),
    };
  }

  if (execution.toolName === "getNetworkAnalytics") {
    return {
      kind: "tool",
      name: execution.toolName,
      status,
      label: "Network stats",
      detail: hasError ? String(result.error) : "Total members",
      count: typeof result.totalMembers === "number" ? result.totalMembers : null,
    };
  }

  if (execution.toolName === "getLatestAsset") {
    const memberName = typeof result.memberName === "string" ? result.memberName : "";
    return {
      kind: "tool",
      name: execution.toolName,
      status,
      label: "Latest asset",
      detail: hasError
        ? String(result.error)
        : memberName || (found === false ? "No matching member" : "Member asset logs"),
      count: arrayCount(result.recentAssets),
    };
  }

  if (execution.toolName === "getFinanceHistory") {
    return {
      kind: "tool",
      name: execution.toolName,
      status,
      label: "Finance history",
      detail: "Accounts and recent transactions",
      count: arrayCount(result.transactions),
    };
  }

  return {
    kind: "tool",
    name: execution.toolName,
    status,
    label: execution.toolName,
    detail: hasError ? String(result.error) : "Completed",
    count: null,
  };
}

function summarizeAssetSummaryActivity(summary: Record<string, unknown>, query: string): AiActivity {
  const found = summary.found;
  const memberName = typeof summary.memberName === "string" ? summary.memberName : query;
  return {
    kind: "tool",
    name: "getMemberAssetSummary",
    status: found === false ? "warning" : "success",
    label: "Asset summary",
    detail: found === false ? `No match for "${query}"` : memberName,
    count: typeof summary.assetCount === "number" ? summary.assetCount : null,
  };
}

async function safeKnowledgeContext(settings: {
  enabledSkills: string[];
  enabledScopes: string[];
}, message: string) {
  if (!settings.enabledSkills.includes("semantic_lookup")) {
    return "";
  }
  try {
    const embedding = await embedQuery(message);
    if (!embedding || embedding.length !== 1536) {
      return "";
    }
    const chunks = await searchKnowledgeChunks({
      embedding,
      scopes: settings.enabledScopes,
      limit: 5,
    });
    return formatKnowledgeContext(chunks);
  } catch {
    return "";
  }
}

async function semanticSearch(ctx: ActionCtx, userId: Id<"users">, query: string, limit: number) {
  const embedding = await embedQuery(query);
  if (!embedding) {
    return { query, results: [], warning: "embedding unavailable" };
  }
  if (embedding.length !== 1536) {
    return {
      query,
      results: [],
      warning: `embedding dimension ${embedding.length} unsupported`,
    };
  }

  const vectorResults = await ctx.vectorSearch("aiDbEmbeddings", "by_embedding", {
    vector: embedding,
    limit: Math.min(Math.max(limit, 1), 10),
  });
  const rows = await ctx.runQuery(internal.aiDbEmbeddings.getAccessibleByIds, {
    userId,
    ids: vectorResults.map((result) => result._id),
  });
  const scoreById = new Map(vectorResults.map((result) => [result._id, result._score]));

  return {
    query,
    results: rows.map((row) => ({
      ...row,
      score: scoreById.get(row.id) ?? 0,
    })),
  };
}

async function fallbackWorkspaceAnswer(
  ctx: ActionCtx,
  args: {
    userId: Id<"users">;
    apiKey: string;
    baseUrl: string;
    model: string;
    temperature: number;
    maxOutputTokens: number;
    recentMessages: DeepSeekMessage[];
    message: string;
    memoryContext: string;
    retrievalContext: string;
  },
) {
  const searchTerm = extractSearchTerm(args.message);
  const workspaceContext = await ctx.runQuery(internal.aiContext.gatherContext, {
    userId: args.userId,
    scopes: ["network"],
    searchTerm,
  });

  const response = await fetch(`${args.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      model: args.model,
      messages: toDeepSeekMessages(
        [
          baseSystemPrompt(args.memoryContext, args.retrievalContext),
          "Tool calling was unavailable for this request. Use provided workspace context only.",
          workspaceContext ? `Workspace context:\n${workspaceContext}` : "",
        ].filter(Boolean).join("\n\n"),
        args.recentMessages,
      ),
      temperature: args.temperature,
      max_tokens: args.maxOutputTokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new ConvexError(`DeepSeek request failed (${response.status}) ${body.slice(0, 300)}`);
  }

  const result = readAssistantResponse(await response.json());
  return {
    content: result.message.content ?? "",
    usage: result.usage,
    searchTerm,
  };
}

async function executeTool(
  ctx: ActionCtx,
  userId: Id<"users">,
  toolCall: DeepSeekToolCall,
): Promise<ToolExecution> {
  const args = parseToolArgs(toolCall.function.arguments);
  const toolName = toolCall.function.name;

  try {
    if (toolName === "searchNetwork") {
      const query = stringArg(args.query);
      if (!query) throw new ConvexError("query required");
      const result = await ctx.runQuery(internal.aiContext.searchNetworkTool, {
        userId,
        query,
        limit: numberArg(args.limit, 5),
      });
      return { toolName, result };
    }

    if (toolName === "getNetworkAnalytics") {
      const result = await ctx.runQuery(internal.aiContext.getNetworkAnalyticsTool, {
        userId,
      });
      return { toolName, result };
    }

    if (toolName === "getLatestAsset") {
      const memberId = typeof args.memberId === "string"
        ? args.memberId as Id<"networkMembers">
        : undefined;
      const query = stringArg(args.query);
      const result = await ctx.runQuery(internal.aiContext.getLatestAssetTool, {
        userId,
        memberId,
        query: query || undefined,
      });
      return { toolName, result };
    }

    if (toolName === "semanticSearch") {
      const query = stringArg(args.query);
      if (!query) throw new ConvexError("query required");
      return {
        toolName,
        result: await semanticSearch(ctx, userId, query, numberArg(args.limit, 5)),
      };
    }

    if (toolName === "getFinanceHistory") {
      const result = await ctx.runQuery(internal.aiContext.getFinanceHistoryTool, {
        userId,
        limit: numberArg(args.limit, 10),
      });
      return { toolName, result };
    }

    throw new ConvexError(`Unknown tool ${toolName}`);
  } catch (error) {
    return {
      toolName,
      result: {
        error: error instanceof Error ? error.message : "Tool failed",
      },
    };
  }
}

const tools = [
  {
    type: "function" as const,
    function: {
      name: "searchNetwork",
      description:
        "Search visible org chart members by name, Bonchat/Yepbit ID, username, email, or role. Use before member-specific questions.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Person name or identifier." },
          limit: { type: "number", description: "Max results, default 5." },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getNetworkAnalytics",
      description:
        "Get network statistics including total member count, active/joined members, pending members, and viewer counts. Use this specifically when asked 'how many' members exist.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getLatestAsset",
      description:
        "Get latest org chart memberAssets log for a member. Pass memberId from searchNetwork, or query if memberId is unknown.",
      parameters: {
        type: "object",
        properties: {
          memberId: { type: "string", description: "networkMembers document id." },
          query: { type: "string", description: "Member name fallback." },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "semanticSearch",
      description:
        "Semantic search over vectorized Luxurious database records: members, asset logs, finance, and academy lessons.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Natural language search query." },
          limit: { type: "number", description: "Max results, default 5." },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getFinanceHistory",
      description: "Get current user's finance accounts and recent transactions.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max transactions, default 10." },
        },
      },
    },
  },
];

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function extractMemory(toolExecutions: ToolExecution[], previous: {
  activeScopes: string[];
  activeEntities: string[];
  lastIntent: string;
}) {
  const scopes = [...previous.activeScopes];
  const entities = [...previous.activeEntities];
  let lastIntent = previous.lastIntent;

  for (const execution of toolExecutions) {
    const result = asRecord(execution.result);
    if (execution.toolName === "searchNetwork" || execution.toolName === "getNetworkAnalytics") {
      scopes.unshift("network");
      if (execution.toolName === "searchNetwork") {
        const rows = Array.isArray(result.results) ? result.results : [];
        for (const row of rows) {
          const name = asRecord(row).name;
          if (typeof name === "string") entities.unshift(name);
        }
      }
    }
    if (execution.toolName === "getLatestAsset") {
      scopes.unshift("network");
      lastIntent = "latest_member_asset";
      const name = result.memberName;
      if (typeof name === "string") entities.unshift(name);
    }
    if (execution.toolName === "semanticSearch") {
      scopes.unshift("semantic_search");
    }
    if (execution.toolName === "getFinanceHistory") {
      scopes.unshift("finance");
      lastIntent = "finance_history";
    }
  }

  return {
    activeScopes: unique(scopes).slice(0, 8),
    activeEntities: unique(entities).slice(0, 12),
    lastIntent,
    lastToolResults: toolExecutions
      .slice(-4)
      .map((execution) => `${execution.toolName}: ${JSON.stringify(execution.result).slice(0, 700)}`)
      .join("\n"),
  };
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
    activity: AiActivity[];
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const message = args.message.trim();
    if (message.length === 0) {
      throw new ConvexError("Message is required.");
    }
    if (message.length > 4000) {
      throw new ConvexError("Message is too long.");
    }

    const settings = await ctx.runQuery(internal.aiSettings.getSettingsForAction, {});
    if (!settings.isEnabled) {
      throw new ConvexError("AI assistant is disabled by admin.");
    }
    if (!settings.encryptedApiKey) {
      throw new ConvexError("AI assistant is missing DeepSeek API key.");
    }

    const dailyUsage = await ctx.runQuery(internal.aiSettings.getUsageWindow, {
      userId,
      since: startOfToday(),
      limit: settings.dailyUserMessageLimit + 20,
    });
    if (dailyUsage.messageCount >= settings.dailyUserMessageLimit + 1000) {
      await ctx.runMutation(internal.aiSettings.saveBlockedUsage, {
        userId,
        provider: settings.provider,
        model: settings.defaultModel,
      });
      throw new ConvexError("Daily AI message limit reached.");
    }

    const monthlyUsage = await ctx.runQuery(internal.aiSettings.getUsageWindow, {
      userId,
      since: startOfMonth(),
      limit: 2000,
    });
    if (monthlyUsage.tokenCount >= settings.monthlyUserTokenLimit + 500000) {
      await ctx.runMutation(internal.aiSettings.saveBlockedUsage, {
        userId,
        provider: settings.provider,
        model: settings.defaultModel,
      });
      throw new ConvexError("Monthly AI token limit reached.");
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
    const memory = await ctx.runQuery(internal.aiSettings.getThreadMemory, {
      userId,
      threadId,
    });

    const directAssetTerm = extractSearchTerm(message) ?? memory.activeEntities[0];
    if (isAssetIntent(message, memory) && directAssetTerm) {
      const summary = await ctx.runQuery(internal.aiContext.getMemberAssetSummaryTool, {
        userId,
        query: directAssetTerm,
      });
      const latestOnly = /\b(latest|only)\b/i.test(message) || memory.lastIntent === "latest_member_asset";
      const content = formatAssetAnswer(asRecord(summary), latestOnly);
      await ctx.runMutation(internal.aiSettings.saveAssistantMessage, {
        userId,
        threadId,
        content,
        model: settings.defaultModel,
        provider: settings.provider,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      });
      const memberName = asRecord(summary).memberName;
      await ctx.runMutation(internal.aiSettings.updateThreadMemory, {
        userId,
        threadId,
        activeScopes: unique(["network", ...memory.activeScopes]),
        activeEntities: unique([
          typeof memberName === "string" ? memberName : directAssetTerm,
          ...memory.activeEntities,
        ]),
        lastIntent: "latest_member_asset",
        lastToolResults: `getMemberAssetSummary: ${JSON.stringify(summary).slice(0, 1000)}`,
      });
      return {
        threadId,
        content,
        model: settings.defaultModel,
        activity: [summarizeAssetSummaryActivity(asRecord(summary), directAssetTerm)],
      };
    }

    const retrievalContext = await safeKnowledgeContext(settings, message);
    const memoryContext = [
      memory.threadSummary ? `Thread memory: ${memory.threadSummary}` : "",
      memory.lastToolResults ? `Recent tool facts:\n${memory.lastToolResults}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const apiKey = decryptSecret(settings.encryptedApiKey);
    const loopMessages = [...recentMessages];
    const toolExecutions: ToolExecution[] = [];
    const usage: Required<DeepSeekUsage> = {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };
    let finalContent = "";

    for (let step = 0; step < 5; step += 1) {
      const response = await fetch(`${settings.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: settings.defaultModel,
          messages: toDeepSeekMessages(
            baseSystemPrompt(memoryContext, retrievalContext),
            loopMessages,
          ),
          tools,
          tool_choice: "auto",
          temperature: settings.temperature,
          max_tokens: settings.maxOutputTokens,
          stream: false,
        }),
      });

      if (!response.ok) {
        if (step === 0 && (response.status === 400 || response.status === 422)) {
          const fallback = await fallbackWorkspaceAnswer(ctx, {
            userId,
            apiKey,
            baseUrl: settings.baseUrl,
            model: settings.defaultModel,
            temperature: settings.temperature,
            maxOutputTokens: settings.maxOutputTokens,
            recentMessages,
            message,
            memoryContext,
            retrievalContext,
          });
          usage.prompt_tokens += fallback.usage.prompt_tokens ?? 0;
          usage.completion_tokens += fallback.usage.completion_tokens ?? 0;
          usage.total_tokens += fallback.usage.total_tokens ?? 0;
          finalContent = fallback.content;
          break;
        }
        const body = await response.text().catch(() => "");
        throw new ConvexError(`DeepSeek request failed (${response.status}) ${body.slice(0, 300)}`);
      }

      const result = readAssistantResponse(await response.json());
      usage.prompt_tokens += result.usage.prompt_tokens ?? 0;
      usage.completion_tokens += result.usage.completion_tokens ?? 0;
      usage.total_tokens += result.usage.total_tokens ?? 0;

      const toolCalls = result.message.tool_calls ?? [];
      if (toolCalls.length === 0) {
        finalContent = result.message.content ?? "";
        break;
      }

      loopMessages.push(result.message);
      for (const toolCall of toolCalls) {
        const execution = await executeTool(ctx, userId, toolCall);
        toolExecutions.push(execution);
        loopMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(execution.result),
        });
      }
    }

    if (!finalContent.trim()) {
      finalContent = "I found data, but could not produce a final answer. Try rephrasing.";
    }

    await ctx.runMutation(internal.aiSettings.saveAssistantMessage, {
      userId,
      threadId,
      content: finalContent,
      model: settings.defaultModel,
      provider: settings.provider,
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
    });

    if (toolExecutions.length > 0) {
      const nextMemory = extractMemory(toolExecutions, memory);
      await ctx.runMutation(internal.aiSettings.updateThreadMemory, {
        userId,
        threadId,
        ...nextMemory,
      });
    }

    return {
      threadId,
      content: finalContent,
      model: settings.defaultModel,
      activity: toolExecutions.map(summarizeActivity),
    };
  },
});
