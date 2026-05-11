# Milestone M003: Admin Infrastructure
**Status:** `[planning]`
**Start Date:** 2026-05-11
**Objective:** Build internal tools to manage the platform, content, and users.

## Success Criteria
1. [ ] Admin-only dashboard route.
2. [ ] CRUD UI for Academy Levels and Lessons.
3. [ ] Global trade monitor (view all open positions).
4. [ ] User management (reset balance, view progress).

## Roadmap

### Slice S01: Admin Shell & Auth
**Status:** `[complete]`
- [x] T01: Identify "Admin" role in Convex (via `admin:isAdmin` query).
- [x] T02: Create AdminLayout secondary view and nav item.
- [x] T03: Protect admin routes in `AdminPortal` and `AdminLayout`.

### Slice S02: Academy Manager
**Status:** `[complete]`
- [x] T01: Table view for all Levels in `AcademyManager`.
- [x] T02: Editor for Lesson content with Markdown preview.
- [x] T03: Upsert logic (mutation) for levels and lessons.

### Slice S03: Platform Insights
**Status:** `[complete]`
- [x] T01: Aggregate trade statistics in `AdminPortal`.
- [x] T02: User Directory (`UserManager`) with balance reset and admin toggle.
- [x] T03: Global trade ticker (`TradeMonitor`) for all users.
