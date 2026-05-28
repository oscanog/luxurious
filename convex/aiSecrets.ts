"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { encryptSecret } from "./aiCrypto";

function previewKey(apiKey: string) {
  return `****${apiKey.slice(-4)}`;
}

export const saveDeepSeekKey = action({
  args: { apiKey: v.string() },
  handler: async (ctx, args) => {
    const adminUserId = await getAuthUserId(ctx);
    if (!adminUserId) {
      throw new Error("Not authenticated");
    }

    const trimmed = args.apiKey.trim();
    if (!trimmed.startsWith("sk-") || trimmed.length < 24) {
      throw new Error("Invalid DeepSeek API key.");
    }

    await ctx.runMutation(internal.aiSettings.saveEncryptedKey, {
      adminUserId,
      encryptedApiKey: encryptSecret(trimmed),
      apiKeyPreview: previewKey(trimmed),
    });

    return { apiKeyPreview: previewKey(trimmed) };
  },
});
