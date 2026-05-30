"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";
import zlib from "zlib";

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

async function extractTextFromPdf(buffer: Buffer) {
  const pdf = buffer.toString("binary");
  const textParts: string[] = [];

  let currentIndex = 0;
  while (true) {
    const streamStart = pdf.indexOf("stream", currentIndex);
    if (streamStart === -1) break;
    
    // Find the end of "stream\n" or "stream\r\n"
    let dataStart = streamStart + 6;
    if (pdf[dataStart] === "\r") dataStart++;
    if (pdf[dataStart] === "\n") dataStart++;

    const streamEnd = pdf.indexOf("endstream", dataStart);
    if (streamEnd === -1) break;

    // Optimize: only parse FlateDecode streams that are NOT images/XObjects
    const dictStart = pdf.lastIndexOf("<<", streamStart);
    if (dictStart !== -1 && dictStart < streamStart) {
      const dict = pdf.slice(dictStart, streamStart);
      const isFlate = dict.includes("FlateDecode") || dict.includes("Flate");
      const isImage = dict.includes("Image") || dict.includes("XObject");
      if (!isFlate || isImage) {
        currentIndex = streamEnd + 9;
        continue;
      }
    }
    
    const compressedData = pdf.slice(dataStart, streamEnd).replace(/[\r\n]+$/, "");
    
    try {
      const compressed = Buffer.from(compressedData, "binary");
      const decompressed = zlib.unzipSync(compressed).toString("binary");
      
      let btIndex = 0;
      let hasBT = false;
      while (true) {
        const btStart = decompressed.indexOf("BT", btIndex);
        if (btStart === -1) break;
        const etEnd = decompressed.indexOf("ET", btStart);
        if (etEnd === -1) break;
        
        hasBT = true;
        const section = decompressed.slice(btStart, etEnd);
        for (const strMatch of section.matchAll(/\((?:\\.|[^\\)])*\)/g)) {
          textParts.push(decodePdfLiteral(strMatch[0].slice(1, -1)));
        }
        for (const strMatch of section.matchAll(/<([0-9A-Fa-f\s]{8,})>/g)) {
          const decoded = decodeHexText(strMatch[1]);
          if (decoded) textParts.push(decoded);
        }
        btIndex = etEnd + 2;
      }

      if (!hasBT) {
        for (const strMatch of decompressed.matchAll(/\((?:\\.|[^\\)])*\)/g)) {
          textParts.push(decodePdfLiteral(strMatch[0].slice(1, -1)));
        }
        for (const strMatch of decompressed.matchAll(/<([0-9A-Fa-f\s]{8,})>/g)) {
          const decoded = decodeHexText(strMatch[1]);
          if (decoded) textParts.push(decoded);
        }
      }
    } catch {
      // Ignored - probably corrupt or not a text stream
    }
    
    currentIndex = streamEnd + 9;
  }

  // Parse uncompressed text sections using high-performance indexOf loop
  let btIndex = 0;
  while (true) {
    const btStart = pdf.indexOf("BT", btIndex);
    if (btStart === -1) break;
    const etEnd = pdf.indexOf("ET", btStart);
    if (etEnd === -1) break;
    
    const section = pdf.slice(btStart, etEnd);
    for (const matchMatch of section.matchAll(/\((?:\\.|[^\\)])*\)/g)) {
      textParts.push(decodePdfLiteral(matchMatch[0].slice(1, -1)));
    }
    for (const matchMatch of section.matchAll(/<([0-9A-Fa-f\s]{8,})>/g)) {
      const decoded = decodeHexText(matchMatch[1]);
      if (decoded) textParts.push(decoded);
    }
    btIndex = etEnd + 2;
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
    extractedText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    await ctx.runQuery(internal.aiKnowledge.requireAdminForAction, { userId });

    const isPdf = args.fileName.toLowerCase().endsWith(".pdf");
    const isTxt = args.fileName.toLowerCase().endsWith(".txt");
    if (!isPdf && !isTxt) {
      throw new Error("Only PDF and TXT files are supported.");
    }

    const documentId: Id<"aiKnowledgeDocuments"> = await ctx.runMutation(
      internal.aiKnowledge.createPendingDocument,
      {
        title: args.title.trim() || args.fileName.replace(/\.(pdf|txt)$/i, ""),
        fileName: args.fileName,
        mimeType: args.mimeType || (isPdf ? "application/pdf" : "text/plain"),
        fileSize: args.fileSize,
        storageId: args.storageId,
        uploadedBy: userId,
      },
    );

    try {
      let extractedText = args.extractedText ?? "";

      // Use client-extracted text if available, fall back to server-side
      if (extractedText.length < 40) {
        const blob = await ctx.storage.get(args.storageId);
        if (!blob) {
          throw new Error("Uploaded PDF not found in storage.");
        }
        const buffer = Buffer.from(await blob.arrayBuffer());
        extractedText = await extractTextFromPdf(buffer);
      }

      if (extractedText.length < 10) {
        throw new Error(
          "Could not extract enough text. The document is too short or empty.",
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
