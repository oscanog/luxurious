# Technical Spec: AI Agent Infrastructure

## Implementation Status

- Convex AI settings, encrypted key rotation action, chat action, usage tracking, and audit tables are implemented.
- Floating AI chat badge and admin AI settings page are implemented.
- `AI_SETTINGS_MASTER_KEY` is set on the production Convex deployment.
- Convex functions are deployed to production deployment `polished-eagle-138`.
- pgvector bootstrap SQL exists at `scripts/ai_pgvector_schema.sql`.
- Remaining backend gap: managed Postgres is not provisioned, but pgvector retrieval is wired into `convex/aiAgent.ts` behind env-gated embedding configuration.
- Neon is the default managed Postgres driver path through `@neondatabase/serverless`.
- Required retrieval env vars are `AI_POSTGRES_URL`, `AI_EMBEDDING_BASE_URL`, `AI_EMBEDDING_API_KEY`, and `AI_EMBEDDING_MODEL`.
- `AI_POSTGRES_URL` is set on the production Convex deployment; `scripts/ai_pgvector_schema.sql` has been applied to Neon with `vector(1024)` for Jina embeddings.
- `AI_EMBEDDING_BASE_URL`, `AI_EMBEDDING_API_KEY`, and `AI_EMBEDDING_MODEL` are set on production Convex.
- Initial repo Markdown knowledge chunks are indexed into pgvector with `scripts/index_ai_knowledge.mjs`.
- Remaining operations gap: leaked DeepSeek key must be revoked, then a new key must be saved through `/admin/ai-settings`.

## Architecture

Luxurious keeps Convex as the application source of truth and adds Postgres + pgvector as an AI retrieval store. This avoids migrating current app data while creating a durable vector layer for future AI features.

| Layer | Responsibility |
| :--- | :--- |
| Convex | Users, auth, admin gates, AI settings metadata, chat threads, usage logs, audit logs |
| Postgres + pgvector | Knowledge chunks, embeddings, semantic search, source references |
| DeepSeek API | Chat generation through DeepSeek V4 models |
| React | Floating chat badge, chat panel, admin AI settings UI |

## Data Model

### Convex Tables

Add schema entries in `convex/schema.ts`.

- `aiSettings`: singleton-like provider configuration.
  - `provider`: `"deepseek"`
  - `baseUrl`: `"https://api.deepseek.com"`
  - `defaultModel`: `"deepseek-v4-flash"` or `"deepseek-v4-pro"`
  - `encryptedApiKey`: encrypted string, never returned to clients
  - `apiKeyPreview`: masked suffix only, such as `****db19`
  - `apiKeyRotatedAt`: timestamp
  - `temperature`: number
  - `maxOutputTokens`: number
  - `dailyUserMessageLimit`: number
  - `monthlyUserTokenLimit`: number
  - `enabledScopes`: array of scope keys
  - `enabledSkills`: array of skill keys
  - `isEnabled`: boolean
  - `updatedAt`: timestamp
  - `updatedBy`: admin user id

- `aiChatThreads`: per-user chat containers.
  - `userId`: Convex user id
  - `title`: optional string
  - `createdAt`: timestamp
  - `updatedAt`: timestamp

- `aiChatMessages`: persisted chat messages.
  - `threadId`: `aiChatThreads` id
  - `userId`: Convex user id
  - `role`: `"user" | "assistant" | "system"`
  - `content`: string
  - `model`: optional string
  - `provider`: optional string
  - `usage`: optional object with token counts
  - `error`: optional safe error text
  - `createdAt`: timestamp

- `aiUsageEvents`: bounded audit and quota events.
  - `userId`: Convex user id
  - `provider`: string
  - `model`: string
  - `inputTokens`: number
  - `outputTokens`: number
  - `status`: `"success" | "error" | "blocked"`
  - `createdAt`: timestamp

- `aiSettingsAuditEvents`: admin settings changes.
  - `adminUserId`: Convex user id
  - `action`: string
  - `safeDetails`: object without secrets
  - `createdAt`: timestamp

### Postgres Tables

Postgres stores AI retrieval data only.

```sql
CREATE EXTENSION IF NOT EXISTS vector;

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

CREATE INDEX ai_knowledge_chunks_scope_idx
  ON ai_knowledge_chunks (scope);

CREATE INDEX ai_knowledge_chunks_embedding_hnsw_idx
  ON ai_knowledge_chunks
  USING hnsw (embedding vector_cosine_ops);
```

Embedding dimensions must match the chosen embedding model. Jina `jina-embeddings-v3` uses 1024 dimensions by default. If the embedding provider changes dimensions, create a new embedding column/table or migration path instead of mixing dimensions.

## Backend Behavior

### Admin Settings

- `convex/aiSettings.ts` exposes admin-only safe reads and mutations.
- All admin checks happen server-side using the existing admin pattern from `convex/admin.ts`.
- Queries return only safe metadata: provider, base URL, selected model, key presence, masked suffix, limits, scopes, and skills.
- Mutations that accept API keys encrypt before storage and write audit events.
- Plaintext keys never appear in query return values, client state, logs, mobile HTTP route responses, or error messages.

### Encryption

- Use `AI_SETTINGS_MASTER_KEY` as a server-only environment variable.
- Require key length/format validation before accepting encrypted-key mutations.
- Use authenticated encryption such as AES-256-GCM.
- Store ciphertext, IV, and auth tag together in `encryptedApiKey`.
- If `AI_SETTINGS_MASTER_KEY` is missing, key save and model-call actions fail closed with a safe admin-visible error.

### DeepSeek Agent

- `convex/aiAgent.ts` owns chat actions.
- Model calls run from Convex actions, not React.
- Default provider config:
  - base URL: `https://api.deepseek.com`
  - default model: `deepseek-v4-flash`
  - premium model: `deepseek-v4-pro`
- Deprecated aliases are rejected:
  - `deepseek-chat`
  - `deepseek-reasoner`
- Before every model call:
  - authenticate user
  - ensure AI is enabled
  - apply per-user limits
  - load safe settings
  - decrypt API key server-side
  - retrieve bounded pgvector context if current scope allows it
- After every model call:
  - persist assistant message
  - persist usage event
  - persist safe provider metadata
  - never persist API key or raw authorization headers

## pgvector Retrieval

- Keep retrieval query bounded with a hard `LIMIT`.
- Use scope filters before semantic ordering where possible.
- Use cosine distance for first implementation.
- Return source metadata and content snippets only.
- Agent prompt should include no more than the configured maximum number of chunks.
- If Postgres is unavailable, chat still works without retrieval unless admin marks retrieval as required.

Recommended query shape:

```sql
SELECT id, source_type, source_id, scope, title, content, metadata,
       1 - (embedding <=> $1::vector) AS similarity
FROM ai_knowledge_chunks
WHERE scope = ANY($2::text[])
ORDER BY embedding <=> $1::vector
LIMIT $3;
```

## Frontend Integration

### Floating Chat

- Add `src/components/ai/AiChatBadge.tsx`.
- Add `src/components/ai/AiChatPanel.tsx`.
- Mount inside `src/components/layout/AdminLayout.tsx`, next to the authenticated shell so login and download pages do not show AI.
- Badge position: fixed bottom-right.
- Panel states:
  - collapsed badge
  - open empty state
  - message list
  - pending response
  - quota blocked
  - missing configuration
  - provider error

### Admin UI

- Add `src/pages/admin/AiSettingsPage.tsx`.
- Add `/admin/ai-settings` route in `src/App.tsx`.
- Add AI Settings nav entry in `src/components/layout/AdminLayout.tsx`.
- Add Admin Portal management link.
- Page sections:
  - Provider and base URL
  - Model default and premium option
  - API key status and rotation form
  - Skills and scopes
  - Usage limits
  - Recent audit events

## Security Rules

- Never place DeepSeek keys in `VITE_*` variables.
- Never pass API keys to React.
- Never expose API keys through Convex queries.
- Never add AI settings endpoints to unauthenticated public HTTP routes.
- Avoid logging provider request payloads if they could contain user-sensitive content.
- Use safe errors for provider failures and detailed logs only when they exclude secrets.

## Validation

- Run `npm run lint`.
- Confirm non-admin route access is blocked in UI and server functions.
- Confirm non-admin direct Convex mutation attempts fail.
- Confirm encrypted key save stores no plaintext.
- Confirm key rotation updates masked suffix and audit event.
- Confirm chat works with `deepseek-v4-flash`.
- Confirm admin model switch to `deepseek-v4-pro` affects subsequent calls.
- Confirm missing or revoked key produces safe error.
- Confirm pgvector query returns bounded results.

## Implementation Notes

- The leaked DeepSeek API key must be revoked before real validation.
- Add provider SDK dependencies only during implementation, not in this milestone document.
- If choosing Vercel AI SDK, prefer the DeepSeek provider package or an OpenAI-compatible provider configured server-side only.
- If choosing direct fetch, keep request construction in one server helper to simplify provider swapping later.
