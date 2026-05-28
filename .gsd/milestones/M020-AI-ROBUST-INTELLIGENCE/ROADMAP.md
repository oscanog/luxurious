# M020: AI Robust Intelligence & Memory Architecture

**Status:** `[planned]`
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

- [ ] Create a new table `aiDbEmbeddings` to map Convex documents to vector embeddings.
- [ ] Write a Convex cron job or migration script to backfill embeddings for:
  - `networkMembers` (Names, roles, Bonchat IDs).
  - `memberAssets` (Asset logs).
  - `financialAccounts` / `financialTransactions`.
  - `academyLessons`.
- [ ] Implement reactive mutations: whenever a member or asset is added/updated, update its vector embedding automatically.

## Phase 2: Agent Tool Calling (Replacing Static Context Gathering)

Move away from dumping massive text blocks into the system prompt. Instead, use LLM Tool Calling (Function Calling).

- [ ] Refactor `aiAgent.ts` to expose Convex tools to DeepSeek (e.g., `searchNetwork`, `getLatestAsset`, `getFinanceHistory`).
- [ ] When user asks "si maylyn ba magkano latest?", the LLM realizes it needs Maylyn's data and calls `searchNetwork(name: "maylyn")` and `getLatestAsset(memberId: ...)`.
- [ ] Integrate `@convex-dev/agent` patterns for durable tool execution and thread management.

## Phase 3: Persistent Conversation Memory

Give the agent the ability to remember context across the thread without re-querying the database every time.

- [ ] Update `aiChatMessages` or use `@convex-dev/agent` thread state to maintain conversation history with retrieved facts.
- [ ] Implement a Mem0-style summarization step: periodically summarize the thread's active entities (e.g., "User is currently asking about asset logs for Florence and Maylyn") and store it in a `threadSummary` field.

## Phase 4: Desktop UX Upgrades

- [ ] Update `AiChatBadge.tsx` to handle streaming tool-call indicators (e.g., show "Searching for Maylyn..." when the LLM triggers a tool).
- [ ] Improve the typewriter effect to handle complex Markdown tables and charts if the agent returns them.

## Acceptance Criteria

- [ ] "si maylyn ba magkano latest?" successfully returns Maylyn's asset data right after asking about Florence, without needing to repeat the word "asset".
- [ ] All major DB tables (`networkMembers`, `memberAssets`) are vectorized and semantically searchable.
- [ ] `aiAgent.ts` uses DeepSeek tool calling instead of static string concatenation for context.
- [ ] Reference repo `@convex-dev/agent` concepts are successfully integrated into the Luxurious backend.
