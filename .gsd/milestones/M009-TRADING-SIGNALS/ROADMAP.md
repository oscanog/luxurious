# Milestone M009: Trading Signals

**Status:** `[completed]`
**Start Date:** 2026-05-14
**Objective:** Build premium trading signal center with focus on **Schedule Visibility**. Downlines must see exactly when signals drop (e.g., 3pm, 8pm) to maximize participation.

**Spec:** `TECHNICAL-SPEC.md`

## Success Criteria

1. [x] Admin can CRUD signals with multi-TP targets, tier assignment, and analyst notes.
2. [x] Admin can manage weekly signal schedules by trading session (London/NY/Asia).
3. [x] Admin can define milestone tiers (Free → Silver → Gold) with requirements.
4. [x] Users see live signals filtered by their tier with copy-to-clipboard.
5. [x] Users see "Signal of the Week" (Featured) hero card.
6. [x] Users see schedule timeline with countdown to next session.
7. [x] Users see milestone progression and how to unlock more signals.
8. [x] Stats grid shows Win Rate, Active Count, Monthly Pips for both roles.
9. [x] Page handles light/dark mode correctly.
10. [x] Route `/trading-signals` wired in sidebar under Network.

---

## Roadmap

### Slice S01: Backend Foundation
**Status:** `[completed]`
- [x] T01: Define `tradingSignals` schema (multi-TP, tier, featured, notes, result).
- [x] T02: Define `signalSchedules` schema (session, timezone, isActive).
- [x] T03: Define `signalMilestones` schema (tier progression, requirements).
- [x] T04: Add `/trading-signals` to sidebar nav + `NavPath` type + `PATH_LABELS`.

### Slice S02: Admin CRUD Mutations
**Status:** `[completed]`
- [x] T01: `signals.create` — validate entry/tp/sl, compute riskReward, set status=pending.
- [x] T02: `signals.update` — partial update, admin-only guard.
- [x] T03: `signals.updateStatus` — mark TP hit / SL hit / Cancel, set `result` + `closedAt`.
- [x] T04: `signals.toggleFeatured` — unset previous featured, set new.
- [x] T05: `schedules.create` / `schedules.update` / `schedules.toggleActive`.
- [x] T06: `milestones.create` / `milestones.update`.

### Slice S03: Queries
**Status:** `[completed]`
- [x] T01: `signals.listActive` — filter by status=active, respect tier for non-admin.
- [x] T02: `signals.listHistory` — past signals with result, paginated.
- [x] T03: `signals.getStats` — compute win rate, monthly pips, active count.
- [x] T04: `signals.getFeatured` — current featured signal.
- [x] T05: `schedules.list` — active schedules sorted by dayOfWeek + time.
- [x] T06: `milestones.list` — sorted by sortOrder.

### Slice S04: Admin Page — Stats + Signal Management
**Status:** `[completed]`
- [x] T01: Create `TradingSignalsPage.tsx` with admin/user role detection.
- [x] T02: Admin Stats Grid — 4 metric cards (Win Rate, Active, Monthly Pips, Featured).
- [x] T03: Inline Signal Creation Form — symbol input, entry/tp1/tp2/tp3/sl numerics, strategy select, tier radio, notes textarea.
- [x] T04: Active Signals Table — sortable columns, row actions (Hit TP, Hit SL, Cancel, Edit).
- [x] T05: Signal History Table — filterable by status/date/symbol, color-coded result column.

### Slice S05: Admin Page — Schedules + Milestones
**Status:** `[completed]`
- [x] T01: Schedule Manager — day-of-week card grid, session badges, add/edit/toggle.
- [x] T02: Milestone Editor — ordered cards showing tier progression path, add/edit.
- [x] T03: Wire route in `App.tsx`.

### Slice S06: User Page — Live Signals + Featured
**Status:** `[completed]`
- [x] T01: Featured Signal Hero Card — full-width, large BUY/SELL badge, copy buttons.
- [x] T02: Live Signal Cards Grid — color-coded (green=BUY, red=SELL), pulsing LIVE pill, copy entry/tp/sl.
- [x] T03: My Stats Grid — Win Rate, Signals Followed, Current Tier.
- [x] T04: Tier-based filtering — hide signals above user tier, show upgrade prompt.

### Slice S07: User Page — Schedule + Milestones
**Status:** `[completed]`
- [x] T01: Schedule Timeline — vertical timeline, countdown to next session, session labels.
- [x] T02: Milestone Progress Cards — vertical stepper, current tier highlighted, next tier requirements.
- [x] T03: Signal History compact table — past signals user followed.

### Slice S08: Polish + Mobile Parity Docs
**Status:** `[completed]`
- [x] T01: Light/dark mode audit for all signal components.
- [x] T02: Update `PARITY-GUIDE.md` with signal page specs for mobile.
- [x] T03: Final build + typecheck verification.
- [x] T04: Git commit.
