"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";

function decodePdfLiteral(raw: string) {
  let output = "";
  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    if (char !== "\\") {
      output += char;
      continue;
    }
    index += 1;
    const escaped = raw[index];
    if (escaped === "n") output += "\n";
    else if (escaped === "r") output += "\r";
    else if (escaped === "t") output += "\t";
    else if (escaped === "b") output += "\b";
    else if (escaped === "f") output += "\f";
    else if (escaped === "(" || escaped === ")" || escaped === "\\")
      output += escaped;
    else output += escaped ?? "";
  }
  return output;
}

function decodeHexText(raw: string) {
  const hex = raw.replace(/\s+/g, "");
  if (hex.length < 4 || hex.length % 2 !== 0) {
    return "";
  }
  const bytes: number[] = [];
  for (let index = 0; index < hex.length; index += 2) {
    bytes.push(Number.parseInt(hex.slice(index, index + 2), 16));
  }
  const buffer = Buffer.from(bytes);
  const hasUtf16 = bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff;
  return hasUtf16
    ? buffer.swap16().toString("utf16le").slice(1)
    : buffer.toString("utf8");
}

function normalizeText(text: string) {
  return text
    .split(String.fromCharCode(0))
    .join("")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractTextFromPdf(buffer: Buffer) {
  const pdf = buffer.toString("latin1");
  const sections = pdf.match(/BT[\s\S]*?ET/g) ?? [pdf];
  const textParts: string[] = [];

  for (const section of sections) {
    for (const match of section.matchAll(/\((?:\\.|[^\\)])*\)/g)) {
      textParts.push(decodePdfLiteral(match[0].slice(1, -1)));
    }
    for (const match of section.matchAll(/<([0-9A-Fa-f\s]{8,})>/g)) {
      const decoded = decodeHexText(match[1]);
      if (decoded) {
        textParts.push(decoded);
      }
    }
  }

  return normalizeText(textParts.join(" "));
}

function chunkText(text: string) {
  const maxChunkLength = 2800;
  const chunks: string[] = [];
  const paragraphs = text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  let current = "";

  for (const paragraph of paragraphs.length > 0 ? paragraphs : [text]) {
    if (current.length + paragraph.length + 2 <= maxChunkLength) {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
      continue;
    }
    if (current) {
      chunks.push(current);
    }
    current = paragraph;
    while (current.length > maxChunkLength) {
      chunks.push(current.slice(0, maxChunkLength));
      current = current.slice(maxChunkLength);
    }
  }

  if (current) {
    chunks.push(current);
  }
  return chunks.slice(0, 40);
}

export const ingestUploadedPdf = action({
  args: {
    title: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    fileSize: v.number(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    await ctx.runQuery(internal.aiKnowledge.requireAdminForAction, { userId });

    if (!args.fileName.toLowerCase().endsWith(".pdf")) {
      throw new Error("Only PDF files are supported.");
    }

    const documentId: Id<"aiKnowledgeDocuments"> = await ctx.runMutation(
      internal.aiKnowledge.createPendingDocument,
      {
        title: args.title.trim() || args.fileName.replace(/\.pdf$/i, ""),
        fileName: args.fileName,
        mimeType: args.mimeType || "application/pdf",
        fileSize: args.fileSize,
        storageId: args.storageId,
        uploadedBy: userId,
      },
    );

    try {
      const blob = await ctx.storage.get(args.storageId);
      if (!blob) {
        throw new Error("Uploaded PDF not found in storage.");
      }

      const buffer = Buffer.from(await blob.arrayBuffer());
      const extractedText = extractTextFromPdf(buffer);
      if (extractedText.length < 40) {
        throw new Error(
          "Could not extract enough text from PDF. Use text-based PDFs, not scanned image PDFs.",
        );
      }

      const chunks = chunkText(extractedText);
      await ctx.runMutation(internal.aiKnowledge.completeDocumentIngestion, {
        documentId,
        chunks,
        extractedCharCount: extractedText.length,
      });

      return { success: true, documentId, chunkCount: chunks.length };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "PDF ingestion failed.";
      await ctx.runMutation(internal.aiKnowledge.failDocumentIngestion, {
        documentId,
        error: message,
      });
      throw error;
    }
  },
});
