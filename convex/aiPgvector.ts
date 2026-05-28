"use node";

import { neon } from "@neondatabase/serverless";

export type KnowledgeChunk = {
  id: string;
  sourceType: string;
  sourceId: string;
  scope: string;
  title: string | null;
  content: string;
  similarity: number;
};

function getDatabaseUrl() {
  return process.env.AI_POSTGRES_URL || process.env.POSTGRES_URL || null;
}

function vectorLiteral(embedding: number[]) {
  if (embedding.length === 0) {
    throw new Error("Embedding vector is required.");
  }

  return `[${embedding.map((value) => {
    if (!Number.isFinite(value)) {
      throw new Error("Embedding vector contains a non-finite value.");
    }
    return value;
  }).join(",")}]`;
}

export async function searchKnowledgeChunks({
  embedding,
  scopes,
  limit,
}: {
  embedding: number[];
  scopes: string[];
  limit: number;
}): Promise<KnowledgeChunk[]> {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl || scopes.length === 0) {
    return [];
  }

  const sql = neon(databaseUrl);
  const rows = await sql`
    SELECT
      id::text,
      source_type,
      source_id,
      scope,
      title,
      content,
      1 - (embedding <=> ${vectorLiteral(embedding)}::vector) AS similarity
    FROM ai_knowledge_chunks
    WHERE scope = ANY(${scopes})
    ORDER BY embedding <=> ${vectorLiteral(embedding)}::vector
    LIMIT ${Math.min(Math.max(limit, 1), 8)}
  `;

  return rows.map((row) => ({
    id: String(row.id),
    sourceType: String(row.source_type),
    sourceId: String(row.source_id),
    scope: String(row.scope),
    title: typeof row.title === "string" ? row.title : null,
    content: String(row.content),
    similarity: Number(row.similarity),
  }));
}

export function formatKnowledgeContext(chunks: KnowledgeChunk[]) {
  if (chunks.length === 0) {
    return "";
  }

  return chunks
    .map((chunk, index) => {
      const title = chunk.title ? ` — ${chunk.title}` : "";
      return `Source ${index + 1} [${chunk.scope}${title}]\n${chunk.content}`;
    })
    .join("\n\n");
}
