"use node";

type EmbeddingResponse = {
  data?: Array<{ embedding?: number[] }>;
};

export async function embedQuery(text: string) {
  const baseUrl = process.env.AI_EMBEDDING_BASE_URL;
  const apiKey = process.env.AI_EMBEDDING_API_KEY;
  const model = process.env.AI_EMBEDDING_MODEL;

  if (!baseUrl || !apiKey || !model) {
    return null;
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: text,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as EmbeddingResponse;
  const embedding = payload.data?.[0]?.embedding;
  return Array.isArray(embedding) && embedding.length > 0 ? embedding : null;
}
