# Issue: Live Context Not Returning Bonchat ID / Truncating Members

**Status:** `[fixed]`  
**Fixed:** 2026-05-28

## Symptom

User asked: *"What is the Bonchat ID of Melvin Nogoy?"*

AI responded: *"no field called Bonchat ID appears in the network data"* — even though `networkMembers` record has `bonchatId: "u027123"`.

User asked: *"list me all active joined members"* — AI only showed 8 of 17+ joined members.

## Root Causes

### Bug 1: Missing `bonchatId` field in context output

`aiContext.ts` line 58 only included `bonchatUsername` but NOT `bonchatId`. The schema has BOTH:

```
bonchatId: v.optional(v.string()),       // ← was missing from context
bonchatUsername: v.optional(v.string()),  // ← was included
```

So the AI never saw the ID field in its prompt.

### Bug 2: Overview truncated to 15 members

```typescript
// OLD — only first 15, no detail fields
...members.slice(0, 15).map((m) => `- ${m.name} (${m.roleTitle}, ${m.status})`)
```

When no `searchTerm` was detected (e.g. "list all joined members"), overview path ran and cut off at 15 members with zero bonchat/yepbit info.

### Bug 3: Scope detection missed "bonchat" keyword

Original `SCOPE_KEYWORDS.network` didn't include `"bonchat"` or `"yepbit"`, so messages mentioning those terms bypassed live data entirely.

## Fixes Applied

1. **`aiContext.ts`** — Added `bonchatId`, `bonchatUsername`, `yepbitId`, `yepbitUsername` to both search and overview output paths. Removed `slice(0, 15)` limit.
2. **`aiAgent.ts`** — Added `"bonchat"`, `"yepbit"`, `"user"` to network scope keywords.
3. **`aiAgent.ts`** — Added fallback: if `extractSearchTerm()` finds a name, force `network` scope even if no keywords match.

## Verification

Test these 3 questions after deploy:

1. **"What is the Bonchat ID of Melvin Nogoy?"** → should return `u027123`
2. **"List all active joined members"** → should show all 17+ members with IDs
3. **"What is the Bonchat ID of Layka Marinay?"** → should find if member exists in your profile's network
