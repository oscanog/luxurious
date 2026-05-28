import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

const ROOT = process.cwd();
const MAX_CHARS = 3200;
const OVERLAP_CHARS = 350;
const DEFAULT_FILES = [
  "README.md",
  "PROJECT.md",
  "REQUIREMENTS.md",
  "KNOWLEDGE.md",
  ".gsd/STATE.md",
  ".gsd/milestones/M019-AI-AGENT-INFRASTRUCTURE/ROADMAP.md",
  ".gsd/milestones/M019-AI-AGENT-INFRASTRUCTURE/TECHNICAL-SPEC.md",
];

async function listMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(path.relative(ROOT, fullPath).replaceAll("\\", "/"));
    }
  }
  return files;
}

function chunkText(text) {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) return [];

  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    const hardEnd = Math.min(start + MAX_CHARS, clean.length);
    const softEnd = clean.lastIndexOf("\n\n", hardEnd);
    const end = softEnd > start + 1000 ? softEnd : hardEnd;
    chunks.push(clean.slice(start, end).trim());
    if (end >= clean.length) break;
    start = Math.max(0, end - OVERLAP_CHARS);
  }

  return chunks;
}

function vectorLiteral(embedding) {
  return `[${embedding.map((value) => {
    if (!Number.isFinite(value)) {
      throw new Error("Embedding contains non-finite value.");
    }
    return value;
  }).join(",")}]`;
}

async function embedBatch(inputs) {
  const response = await fetch("https://api.jina.ai/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AI_EMBEDDING_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.AI_EMBEDDING_MODEL || "jina-embeddings-v3",
      task: "retrieval.passage",
      input: inputs,
    }),
  });

  if (!response.ok) {
    throw new Error(`Jina embeddings failed: ${response.status} ${await response.text()}`);
  }

  const payload = await response.json();
  return payload.data.map((item) => item.embedding);
}

async function main() {
  if (!process.env.AI_POSTGRES_URL) throw new Error("AI_POSTGRES_URL is required.");
  if (!process.env.AI_EMBEDDING_API_KEY) throw new Error("AI_EMBEDDING_API_KEY is required.");

  const docsFiles = await listMarkdownFiles(path.join(ROOT, "docs")).catch(() => []);
  const files = [...new Set([...DEFAULT_FILES, ...docsFiles])];
  const records = [];

  for (const file of files) {
    const absolutePath = path.join(ROOT, file);
    const content = await readFile(absolutePath, "utf8").catch(() => null);
    if (!content) continue;
    const chunks = chunkText(content);
    chunks.forEach((chunk, index) => {
      records.push({
        sourceType: "repo_markdown",
        sourceId: `${file}#${index + 1}`,
        scope: file.includes("/M019-") ? "admin" : "support",
        title: file,
        content: chunk,
      });
    });
  }

  const sql = neon(process.env.AI_POSTGRES_URL);
  await sql`DELETE FROM ai_knowledge_chunks WHERE source_type = 'repo_markdown'`;

  for (let index = 0; index < records.length; index += 16) {
    const batch = records.slice(index, index + 16);
    const embeddings = await embedBatch(batch.map((record) => record.content));
    for (let itemIndex = 0; itemIndex < batch.length; itemIndex += 1) {
      const record = batch[itemIndex];
      const embedding = embeddings[itemIndex];
      await sql`
        INSERT INTO ai_knowledge_chunks (
          source_type,
          source_id,
          scope,
          title,
          content,
          metadata,
          embedding
        ) VALUES (
          ${record.sourceType},
          ${record.sourceId},
          ${record.scope},
          ${record.title},
          ${record.content},
          ${JSON.stringify({ indexedBy: "scripts/index_ai_knowledge.mjs" })}::jsonb,
          ${vectorLiteral(embedding)}::vector
        )
      `;
    }
  }

  console.log(`Indexed ${records.length} markdown chunks into pgvector.`);
}

await main();
