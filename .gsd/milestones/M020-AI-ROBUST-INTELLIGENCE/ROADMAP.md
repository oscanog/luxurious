# M020: AI Robust Intelligence & Memory Architecture

**Status:** `[in_progress]`
**Created:** 2026-05-28
**Owner:** Backend / Desktop

> **⚠️ AGENT INSTRUCTION: CAVEMAN MODE ON**
> For the developer picking up this milestone: You MUST activate Caveman Mode (`@caveman`). Talk like caveman. Few word. Big brain. Drop articles. Use fragments. Technical accuracy 100%. Why use many token when few do trick?

## Objective

Current AI agent (M019) is "dumb" across turns. It loses context (e.g., asking for latest asset of X, then asking "how about Y" fails because the workspace data for Y wasn't pulled via keyword). Keyword-based scope detection is too fragile.

To make the system robust and smarter over time, we will migrate to a stateful, memory-aware architecture using industry best practices from 2025/2026 trending RAG frameworks, specifically leveraging Convex's native `@convex-dev/agent` patterns and full database vectorization (tokenization).

Focus is **Desktop First**. Mobile will be updated later.

## Reference Architecture

We cloned the official Convex Agent framework for reference:
`C:\projects\convex\luxurious\reference\convex-agent`

This reference demonstrates:
- Persistent threads.
- Hybrid search (Vector + Text).
- RAG tool calling.

Additionally, our architecture is inspired by trending 2026 concepts like **Mem0** (personalized memory layers) and **LlamaIndex/Haystack** (production RAG pipelines).

## The Problem (Why current AI fails)

User asks: "how much is asset logs of florence nogoy"
AI: Florence Nogoy's total logged org chart assets amount to USD 3,082.57.

User asks: "i mean the latest asset only"
AI: Florence Nogoy's latest org chart asset is USD 2,078.57 (logged on 2026-05-25).

User asks: "si maylyn ba magkano latest?" (How much is Maylyn's latest?)
AI: I don’t have the latest asset data for Maylyn in this chat...

**Why?**
1. Each message is processed independently for DB context in `aiContext.ts`.
2. The third message ("si maylyn...") doesn't trigger the "asset" or "org chart" keywords strongly enough, or the context injection replaces Florence's data entirely but fails to grab Maylyn's because cross-turn entity resolution didn't happen.
3. The LLM prompt context window is completely overwritten per request, erasing the "we are talking about asset logs" state.

## Phase 1: Database Tokenization (Vector Search for Everything)

Instead of relying on fragile regex and hardcoded keywords (`detectScopes`, `extractSearchTerm`), we need to tokenize (embed) all meaningful existing database records in Convex so the chat can use semantic search to reliably find data.

- [x] Create a new table `aiDbEmbeddings` to map Convex documents to vector embeddings.
- [x] Write a Convex cron job or migration script to backfill embeddings for:
  - `networkMembers` (Names, roles, Bonchat IDs).
  - `memberAssets` (Asset logs).
  - `financialAccounts` / `financialTransactions`.
  - `academyLessons`.
- [x] Implement reactive mutations: whenever a member or asset is added/updated, update its vector embedding automatically.

## Phase 2: Agent Tool Calling (Replacing Static Context Gathering)

Move away from dumping massive text blocks into the system prompt. Instead, use LLM Tool Calling (Function Calling).

- [x] Refactor `aiAgent.ts` to expose Convex tools to DeepSeek (e.g., `searchNetwork`, `getLatestAsset`, `getFinanceHistory`).
- [x] When user asks "si maylyn ba magkano latest?", the LLM realizes it needs Maylyn's data and calls `searchNetwork(name: "maylyn")` and `getLatestAsset(memberId: ...)`.
- [x] Integrate `@convex-dev/agent` patterns for durable tool execution and thread management.

## Phase 3: Persistent Conversation Memory

Give the agent the ability to remember context across the thread without re-querying the database every time.

- [x] Update `aiChatMessages` or use `@convex-dev/agent` thread state to maintain conversation history with retrieved facts.
- [x] Implement a Mem0-style summarization step: periodically summarize the thread's active entities (e.g., "User is currently asking about asset logs for Florence and Maylyn") and store it in a `threadSummary` field.

## Implementation Notes (2026-05-28)

- Added `aiDbEmbeddings` Convex vector table (1536 dimensions) and hourly `crons.ts` backfill.
- Added embedding worker in `aiDbEmbeddingActions.ts` and source materializers in `aiDbEmbeddings.ts`.
- Added DeepSeek/OpenAI-compatible tool loop in `aiAgent.ts` with `searchNetwork`, `getLatestAsset`, `semanticSearch`, and `getFinanceHistory`.
- Added thread memory fields on `aiChatThreads`: `threadSummary`, `activeScopes`, `activeEntities`, `lastIntent`, `lastToolResults`.
- Added reactive embedding schedules for primary desktop/member/asset/finance/academy mutation paths.
- Added desktop chat tool/search status chips, structured error panel, and lightweight Markdown rendering for lists, code, links, quotes, and tables.
- Added `scripts/qa-ai-agent.mjs` for deployed fresh-thread QA with authenticated admin/member accounts.
- Fixed follow-up intent guard so prompts like "admin-only" do not get misrouted as asset latest-only requests.
- Updated member network visibility to use canonical linked-account downlines from the org tree, not only members created inside the signed-in user's own profile.
- Updated non-admin org chart scope to include direct-upline context above the signed-in member, with `allowAdd: false` so uplines such as Maylyn are visible but read-only.
- Fixed linked viewer card latest asset mapping by resolving assets across member id, user id, email, and normalized name.
- Note: existing records need `aiDbEmbeddingActions.backfillBatch` to run with `AI_EMBEDDING_*` env configured. Embedding model must return 1536-dimensional vectors.

## Phase 4: Desktop UX Upgrades

- [x] Update `AiChatBadge.tsx` to handle tool/search indicators and show completed activity chips from backend tool metadata.
- [x] Improve the typewriter effect to handle Markdown lists, code, links, quotes, and tables without raw text dumps.
- [x] Improve AI request errors with a structured panel, provider/status details, and retry affordance.

## Phase 5: Access Scope QA

- [x] Admin fresh-thread QA: Florence asset total/latest and Maylyn follow-up resolve from live data.
- [x] Non-admin empty-scope QA: Layka account cannot see admin users or out-of-scope records.
- [x] Non-admin linked-downline QA: member accounts use canonical `networkMembers.userId` roots so downlines connected by an admin/upline are visible to the signed-in member.
- [x] Non-admin direct-upline QA: Florence account sees Maylyn as direct upline and Maylyn payload has `member.allowAdd: false`.
- [x] Linked viewer latest-asset QA: Florence canvas card receives latest asset `USD 2078.57`, matching inspector asset logs and AI answers.

## Acceptance Criteria

- [x] "si maylyn ba magkano latest?" successfully returns Maylyn's asset data right after asking about Florence, without needing to repeat the word "asset".
- [x] All major DB tables (`networkMembers`, `memberAssets`) are vectorized and semantically searchable.
- [x] `aiAgent.ts` uses DeepSeek tool calling instead of static string concatenation for context.
- [x] Reference repo `@convex-dev/agent` concepts are successfully integrated into the Luxurious backend.
