# Milestone M012: Social Feed Posting

**Status:** `in_progress`  
**Start Date:** `2026-05-16`  
**Objective:** Ship first working Luxurious social posting slice with feed, composer, post detail, author page, and Convex schema/API foundation.  
**Technical Spec:** [TECHNICAL-SPEC.md](./TECHNICAL-SPEC.md)

## Outcome
M012 changed from docs-first to implementation-in-progress milestone.

Current shipped slice:

- authenticated `/social-feed` route
- `/social-feed/new` draft composer with autosave
- `/social-feed/post/:postId` detail + flat comments
- `/social-feed/user/:userId` author listing
- Convex schema tables for posts, media, likes, saves, comments, hashtags
- storage-backed upload + attach flow
- publish, like, save, comment, discard draft mutations

Still open in M012:

- async media processing/transcode pipeline
- cursor pagination
- drag reorder
- moderation console / archive flows
- mobile polish and parity pass

## Roadmap

### Phase 1: UX Vision and Reference Alignment
- [x] T01 Define product intent: Instagram interaction model, Luxurious visual language
- [x] T02 Freeze scope to feed posts v1 only
- [x] T03 Define route map and surface ownership versus existing `ActivityFeedPage`
- [x] T04 Define mobile-first and desktop-adaptive behavior

### Phase 2: Feed Information Architecture
- [x] T05 Define home feed layout and post card anatomy
- [x] T06 Define post detail screen and comment thread behavior
- [x] T07 Define author profile entry points and author-post listing surface
- [x] T08 Define empty, loading, error, moderation, and processing states

### Phase 3: Composer and Draft Flow
- [x] T09 Define create-post entry points
- [x] T10 Define media selection, ordering, remove, and preview flow
- [x] T11 Define caption, privacy, and metadata editing UX
- [x] T12 Define autosave, resume-draft, discard-draft, and publish lifecycle

### Phase 4: Backend Schema and API Design
- [x] T13 Define storage-backed media asset model
- [x] T14 Define `socialPosts` lifecycle and visibility model
- [x] T15 Define post media, likes, comments, saves, and denormalized counters
- [ ] T16 Define query/mutation surface and pagination strategy

### Phase 5: Moderation, Privacy, and Performance Rules
- [x] T17 Define authenticated public/private audience semantics
- [x] T18 Define author/admin moderation and soft-delete policy
- [x] T19 Define upload constraints, processing states, and publish validation
- [ ] T20 Define feed query performance rules and index requirements

### Phase 6: Desktop and Mobile Follow-Through
- [ ] T21 Break future implementation into desktop/mobile parity slices
- [x] T22 Identify nav, route, and shell integration points
- [x] T23 Define migration path from current notification-style activity feed
- [ ] T24 Define verification checklist for later engineering milestone

## Success Criteria

- [x] `TECHNICAL-SPEC.md` is implementation-ready with no unresolved product decisions
- [x] Feed, composer, draft, privacy, and engagement flows are defined screen-by-screen
- [x] Dark and light visual behavior is aligned to current `src/index.css` tokens
- [x] Backend tables, indexes, storage usage, and Convex functions are fully specified
- [x] Public/private visibility rules are explicit and testable
- [x] Non-goals and rollout boundaries are explicit

## Notes

- First live implementation uses raw uploaded media as delivery asset.
- `processingStatus` exists in schema, but async transcode/poster pipeline not wired yet.
- Feed, author listing, and saved scope are bounded queries today. Cursor pagination next.
