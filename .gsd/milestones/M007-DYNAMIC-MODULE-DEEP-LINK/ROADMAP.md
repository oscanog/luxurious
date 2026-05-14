# Milestone M007: Dynamic Module Deep-Link

**Status:** `[active]`
**Start Date:** 2026-05-15
**Objective:** Convert static placeholders and dummy-data modules into fully dynamic, backend-integrated features based on the gaps identified in `STATIC-MODULES-TRACKER.md`.

## Success Criteria

1. [ ] Calendar page syncs with real planning events.
2. [ ] Invitations module writes to and reads from the live `users` table.
3. [ ] Academy module is fully dynamic with CMS parity.
4. [ ] Simulation trade history persists across sessions.
5. [ ] Receipt Scanner and Shopping List have basic CRUD functionality.

## Roadmap

### Slice S01: Social & Data Persistence
**Status:** `[complete]`
- [x] T01: Connect `InvitationsPage` to `api.invitations.list` and `api.invitations.create`.
- [x] T02: Implement `CalendarPage` backend integration with planning schedule.
- [x] T03: Persist simulation trade history in `LearnToTradePage`.

### Slice S02: Operational Utilities
**Status:** `[complete]`
- [x] T01: Implement `ReceiptScannerPage` image upload and basic OCR parsing logic.
- [x] T02: Build `ShoppingListPage` CRUD with category grouping.
- [x] T03: Replace `SupportPlaceholderPage` with a functional help center/ticketing shell.

## Current Progress
- **Slice S01:** 100% (Invitations, Calendar, Trading History)
- **Slice S02:** 100% (Scanner, Shopping, Support)
- **Remaining:** Academy module parity (requires mobile CMS sync).


### Slice S03: Global Refinement
**Status:** `[complete]`
- [x] T01: Implement global toast/notification feedback system for all table/form actions.
- [x] T02: Standardize search/filter UX across all table-based modules.
- [x] T03: Add manual refresh/sync triggers for financial dashboard metrics.

## Final Progress
- **Slice S01:** 100%
- **Slice S02:** 100%
- **Slice S03:** 100%
- **Overall:** 100% (Core Desktop Parity achieved).

