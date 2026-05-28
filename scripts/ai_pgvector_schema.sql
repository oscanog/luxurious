CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS ai_knowledge_chunks;

CREATE TABLE ai_knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_id text NOT NULL,
  scope text NOT NULL,
  title text,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(1024) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_knowledge_chunks_scope_idx
  ON ai_knowledge_chunks (scope);

CREATE INDEX IF NOT EXISTS ai_knowledge_chunks_embedding_hnsw_idx
  ON ai_knowledge_chunks
  USING hnsw (embedding vector_cosine_ops);
