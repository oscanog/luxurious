# M019: AI Agent Infrastructure

**Status:** `[active]`\
**Created:** 2026-05-28\
**Last Updated:** 2026-05-28\
**Owner:** Luxurious Desktop + Convex

## Objective

Build the first production AI layer for Luxurious: a floating AI chat badge, a
DeepSeek V4-backed agent, encrypted admin-managed AI settings, and a hybrid
Postgres + pgvector knowledge store for future retrieval and automation
features.

## Scope

- Add authenticated desktop AI chat entry point as a floating bottom-right
  badge.
- Use DeepSeek V4 as the default AI provider, with `deepseek-v4-flash` as the
  default model and `deepseek-v4-pro` as the premium reasoning option.
- Add admin settings to manage provider configuration, model defaults, encrypted
  API key rotation, skills, usage limits, and feature scope.
- Keep Convex as the source of truth for app data, auth, chat threads, settings,
  and audit logs.
- Add Postgres with `pgvector` only for embeddings, semantic retrieval, and AI
  reference data.

## Phase 1: Hybrid Vector Store

- [x] Choose a managed Postgres provider that supports the `pgvector` extension.
- [x] Provision Postgres environment variables for local, preview, and
      production deployments.
- [x] Enable `CREATE EXTENSION IF NOT EXISTS vector;` on the AI database.
- [x] Create AI knowledge chunk tables with source metadata, scope fields,
      timestamps, and embedding vectors.
- [x] Add HNSW cosine index for semantic search.
- [x] Add bounded semantic search query path that always returns limited
      results.
- [x] Add pgvector bootstrap SQL in `scripts/ai_pgvector_schema.sql`.
- [x] Choose Neon as default managed Postgres driver path via
      `@neondatabase/serverless`.
- [x] Apply pgvector schema to Neon with Jina-compatible `vector(1024)`
      embeddings.
- [x] Add `scripts/index_ai_knowledge.mjs` to index repo Markdown into pgvector.
- [x] Index initial repo Markdown knowledge chunks into pgvector.

## Phase 2: Admin AI Settings

- [x] Add Convex schema for AI provider settings, model defaults, skills,
      limits, scopes, and audit records.
- [x] Add server-side encryption helpers using `AI_SETTINGS_MASTER_KEY`.
- [x] Store DeepSeek API keys encrypted at rest; never return plaintext through
      queries.
- [x] Add admin-only mutations for key save, key rotation, model selection,
      limit changes, skill toggles, and scope changes.
- [x] Add admin-only queries that expose safe metadata only, such as provider
      name, model, key presence, and last rotation time.
- [x] Set `AI_SETTINGS_MASTER_KEY` on production Convex deployment.

## Phase 3: DeepSeek V4 Agent

- [x] Add Convex action for AI chat message submission.
- [x] Use DeepSeek base URL `https://api.deepseek.com`.
- [x] Default to `deepseek-v4-flash`; allow admin-selected `deepseek-v4-pro`.
- [x] Reject deprecated aliases `deepseek-chat` and `deepseek-reasoner` through
      schema/model validator.
- [x] Apply configured usage limits before model calls.
- [x] Retrieve bounded pgvector context when enabled by scope and embedding env
      is configured.
- [x] Persist chat messages, provider metadata, and usage counts without logging
      API keys.

## Phase 4: Floating Chat UI

- [x] Add `src/components/ai/AiChatBadge.tsx`.
- [x] Implement chat panel inside the floating badge component.
- [x] Mount the badge in `src/components/layout/AdminLayout.tsx` so it appears
      on authenticated workspace routes only.
- [x] Support open, close, composing, typewriter response, empty, and error
      states.
- [x] Keep panel responsive and clear of existing header, sidebar, and modal
      z-index layers.

## Phase 5: Admin Settings UI

- [x] Add `/admin/ai-settings` route in `src/App.tsx`.
- [x] Add admin nav item in `src/components/layout/AdminLayout.tsx`.
- [x] Add Admin Portal management card linking to AI settings.
- [x] Build settings page for provider, model, encrypted key rotation, skills,
      limits, and scopes.
- [x] Show current key status without exposing the key value.
- [x] Show recent AI settings audit events.

## Phase 6: Deployment and Validation

- [x] Run `npx convex codegen`.
- [x] Run `npx tsc --noEmit`.
- [x] Run targeted ESLint on touched implementation files.
- [x] Deploy Convex functions to production deployment `polished-eagle-138`.
- [x] Redeploy after wiring pgvector retrieval scaffold.
- [x] Run full `npm run lint` — AI-touched files pass; 295 errors remain in
      pre-existing non-AI files.
- [x] Save a newly rotated DeepSeek key through `/admin/ai-settings`.
- [ ] Validate live chat response with the new key.
- [x] Set `AI_POSTGRES_URL` on production Convex deployment.
- [x] Run `scripts/ai_pgvector_schema.sql` against Neon Postgres.
- [x] Set `AI_EMBEDDING_BASE_URL`, `AI_EMBEDDING_API_KEY`, and
      `AI_EMBEDDING_MODEL`.
- [x] Index initial knowledge corpus with Jina embeddings.

## Phase 7: Live Database Context

- [x] Create `convex/aiContext.ts` to query live workspace data based on
      requested scopes.
- [x] Implement `gatherContext` internal query to safely fetch bounded data for
      AI prompt injection.
- [x] Add keyword-based scope routing in `aiAgent.ts` (e.g., detecting "member"
      or "network").
- [x] Support `searchTerm` extraction for specific entity lookups (e.g.,
      specific user names).
- [x] Inject gathered live data into DeepSeek system prompt.

## Acceptance Criteria

- [~] `npm run lint` passes — AI files clean; 295 pre-existing errors in other
  files.
- [x] Non-admin users cannot access AI settings route or AI settings mutations —
      `requireAdmin()` guards all admin queries/mutations.
- [x] Admin can save and rotate a DeepSeek key without plaintext reaching React.
- [x] Authenticated users can open the floating chat badge and receive a
      DeepSeek V4 response.
- [x] Default model is `deepseek-v4-flash` — hardcoded in `DEFAULT_SETTINGS` and
      schema.
- [x] Admin can switch configured model to `deepseek-v4-pro`.
- [x] pgvector semantic search returns bounded results and never scans unbounded
      data into the agent prompt.
- [x] Leaked or missing API key results in a safe user-facing error —
      `aiAgent.ts:114-116` throws; chat badge shows inline error banner.
- [x] AI agent can retrieve and answer questions using live Convex database
      records via keyword routing.

## Notes

- Postgres provider is intentionally not fixed in this milestone; any managed
  Postgres with `pgvector` support is acceptable.
- Convex built-in vector search remains a fallback option, but this milestone
  targets pgvector because future AI features need portable Postgres vector
  references.
