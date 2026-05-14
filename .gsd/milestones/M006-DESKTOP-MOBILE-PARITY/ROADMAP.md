# Milestone M006: Desktop Mobile Parity

**Status:** `[active]`
**Start Date:** 2026-05-14
**Objective:** Rebuild desktop information architecture and core UX so mobile users see same pages, sidebar groups, badges, theme behavior, and primary flows when they switch to web.

## Success Criteria

1. [x] Desktop auth and signed-in shell preserve mobile mental model.
2. [x] Desktop landing page becomes network-first dashboard, not org chart.
3. [x] Light mode and dark mode both work across new parity pages and stay persistent.
4. [x] Desktop includes live feed, promotions, and profile flows backed by real Convex data.
5. [x] Sidebar groups, quick actions, and route names stay close enough to mobile that app users are not confused.

## Tracker

| Area | Mobile Source | Desktop Today | Target |
| :--- | :--- | :--- | :--- |
| Auth shell | `login_page.dart` + `luxurious_app.dart` | basic login card, no remembered shell behavior | mobile-like login tone, profile bootstrap, theme persistence |
| Home | `dashboard_page.dart` | none | dashboard route with hero, stats, org summary, members |
| Primary nav | drawer + bottom bar | admin sidebar only | drawer-style grouped sidebar + quick actions |
| Notifications | `activity_feed_page.dart` + badges | none | feed page + unread badges + mark-read flow |
| Promotions | `promotion_page.dart` | none | promotion page + CTA links |
| Profile | `profile_page.dart` | settings only | dedicated profile workflow |
| Theme | toggle on login + drawer, persisted | runtime-only dark toggle | light/dark persisted across login + app |
| Network | org chart + members | strong but separate-first | keep strong desktop tools, re-anchor under dashboard |

## Roadmap

### Slice S01: Shell Parity
**Status:** `[complete]`
- [x] T01: Add desktop dashboard route as default signed-in landing.
- [x] T02: Replace current sidebar taxonomy with mobile-style groups and quick actions.
- [x] T03: Persist theme preference and expose toggle from login + signed-in shell.
- [x] T04: Bootstrap mobile profile data for web users after auth.

### Slice S02: Engagement Pages
**Status:** `[complete]`
- [x] T01: Build desktop `Activity Feed` page from `api.notifications.getFeed`.
- [x] T02: Build desktop `Promotions` page from `api.notifications.listPromotions`.
- [x] T03: Show unread and promotion badges in sidebar and header actions.
- [x] T04: Wire feed open -> `markAllRead`.

### Slice S03: Profile Parity
**Status:** `[complete]`
- [x] T01: Build profile overview using `api.profile.getMe` and `api.profile.getRank`.
- [x] T02: Add editable identity fields and avatar state.
- [x] T03: Add password change flow with forced re-auth expectations.

### Slice S04: Network + Admin Harmonization
**Status:** `[complete]`
- [x] T01: Keep desktop org chart power features but align breadcrumbs, labels, and entry points with mobile.
- [x] T02: Align members filters and summary cards with mobile language.
- [x] T03: Keep admin-only routes available without polluting member-first shell.

### Slice S05: Secondary Surface Backlog
**Status:** `[in-progress]`
- [x] T01: Map finance/support pages needed for parity.
- [x] T02: Decide which mobile mock/support pages stay placeholders on desktop.
- [ ] T03: Document deferred parity gaps after first shipping slice.
