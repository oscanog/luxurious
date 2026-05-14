# Milestone M009: Trading Signals

**Status:** `[in-progress]`
**Start Date:** 2026-05-14
**Objective:** Build premium trading signal command center. Admin creates/manages signals, schedules, milestones. Users consume signals filtered by tier, track performance, unlock progression.

**Spec:** `TECHNICAL-SPEC.md`

## Success Criteria

1. [ ] Admin can CRUD signals with multi-TP targets, tier assignment, and analyst notes.
2. [ ] Admin can manage weekly signal schedules by trading session (London/NY/Asia).
3. [ ] Admin can define milestone tiers (Free → Silver → Gold) with requirements.
4. [ ] Users see live signals filtered by their tier with copy-to-clipboard.
5. [ ] Users see "Signal of the Week" (Featured) hero card.
6. [ ] Users see schedule timeline with countdown to next session.
7. [ ] Users see milestone progression and how to unlock more signals.
8. [ ] Stats grid shows Win Rate, Active Count, Monthly Pips for both roles.
9. [ ] Page handles light/dark mode correctly.
10. [ ] Route `/trading-signals` wired in sidebar under Network.

---

## Roadmap

### Slice S01: Backend Foundation
**Status:** `[completed]`
- [x] T01: Define `tradingSignals` schema (multi-TP, tier, featured, notes, result).
- [x] T02: Define `signalSchedules` schema (session, timezone, isActive).
- [x] T03: Define `signalMilestones` schema (tier progression, requirements).
- [x] T04: Add `/trading-signals` to sidebar nav + `NavPath` type + `PATH_LABELS`.

### Slice S02: Admin CRUD Mutations
**Status:** `[not-started]`
- [ ] T01: `signals.create` — validate entry/tp/sl, compute riskReward, set status=pending.
- [ ] T02: `signals.update` — partial update, admin-only guard.
- [ ] T03: `signals.updateStatus` — mark TP hit / SL hit / Cancel, set `result` + `closedAt`.
- [ ] T04: `signals.toggleFeatured` — unset previous featured, set new.
- [ ] T05: `schedules.create` / `schedules.update` / `schedules.toggleActive`.
- [ ] T06: `milestones.create` / `milestones.update`.

### Slice S03: Queries
**Status:** `[not-started]`
- [ ] T01: `signals.listActive` — filter by status=active, respect tier for non-admin.
- [ ] T02: `signals.listHistory` — past signals with result, paginated.
- [ ] T03: `signals.getStats` — compute win rate, monthly pips, active count.
- [ ] T04: `signals.getFeatured` — current featured signal.
- [ ] T05: `schedules.list` — active schedules sorted by dayOfWeek + time.
- [ ] T06: `milestones.list` — sorted by sortOrder.

### Slice S04: Admin Page — Stats + Signal Management
**Status:** `[not-started]`
- [ ] T01: Create `TradingSignalsPage.tsx` with admin/user role detection.
- [ ] T02: Admin Stats Grid — 4 metric cards (Win Rate, Active, Monthly Pips, Featured).
- [ ] T03: Inline Signal Creation Form — symbol input, entry/tp1/tp2/tp3/sl numerics, strategy select, tier radio, notes textarea.
- [ ] T04: Active Signals Table — sortable columns, row actions (Hit TP, Hit SL, Cancel, Edit).
- [ ] T05: Signal History Table — filterable by status/date/symbol, color-coded result column.

### Slice S05: Admin Page — Schedules + Milestones
**Status:** `[not-started]`
- [ ] T01: Schedule Manager — day-of-week card grid, session badges, add/edit/toggle.
- [ ] T02: Milestone Editor — ordered cards showing tier progression path, add/edit.
- [ ] T03: Wire route in `App.tsx`.

### Slice S06: User Page — Live Signals + Featured
**Status:** `[not-started]`
- [ ] T01: Featured Signal Hero Card — full-width, large BUY/SELL badge, copy buttons.
- [ ] T02: Live Signal Cards Grid — color-coded (green=BUY, red=SELL), pulsing LIVE pill, copy entry/tp/sl.
- [ ] T03: My Stats Grid — Win Rate, Signals Followed, Current Tier.
- [ ] T04: Tier-based filtering — hide signals above user tier, show upgrade prompt.

### Slice S07: User Page — Schedule + Milestones
**Status:** `[not-started]`
- [ ] T01: Schedule Timeline — vertical timeline, countdown to next session, session labels.
- [ ] T02: Milestone Progress Cards — vertical stepper, current tier highlighted, next tier requirements.
- [ ] T03: Signal History compact table — past signals user followed.

### Slice S08: Polish + Mobile Parity Docs
**Status:** `[not-started]`
- [ ] T01: Light/dark mode audit for all signal components.
- [ ] T02: Update `PARITY-GUIDE.md` with signal page specs for mobile.
- [ ] T03: Final build + typecheck verification.
- [ ] T04: Git commit.
