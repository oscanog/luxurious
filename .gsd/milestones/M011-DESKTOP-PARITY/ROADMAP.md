# Milestone M011: Desktop Feature & Visual Parity

**Status:** `[in-progress]`
**Start Date:** 2026-05-16
**Completion Date:** TBD
**Stub Tracker:** See [STUB-TRACKER.md](./STUB-TRACKER.md) for granular issue tracking.

## Phase 1: Visual Parity ✅ Complete
- [x] T01: Refactor `OrgCardNode` to deep navy `#1A2235` + luxurious gold `#FFD700` per Flutter spec.
- [x] T02: Implement circular avatar container with Lucide `User` icon (gold), replacing text initials.
- [x] T03: Status pill badge — gold checkmark + uppercase status label (e.g., `JOINED`).
- [x] T04: Inline "children" count + dedicated "total downline" dark container row.
- [x] T05: Floating gold `+` FAB anchored to card bottom edge (glowing shadow).
- [x] T06: `−` detach icon on card top-right (replaces hidden hover Trash icon).

## Phase 2: Navbar & Controls ✅ Complete
- [x] T07: Remove `HeaderClocks` and `NetworkPulseChip` from `AdminLayout` navbar.
- [x] T08: Push user profile dropdown + notification bell to far-right (`justify-between`).
- [x] T09: Replace confusing `RotateCcw` (Reload icon) with distinct gold `Network` Fit View button.
- [x] T10: Floating pill toolbar with `SlidersHorizontal`, `ChartColumn`, `Map`, `Info` icons.

## Phase 3: Toolbar Wiring 🔴 Outstanding
- [ ] T11: Wire Filters button → status filter popover (All / Joined / Invited / Pending / To-Invite).
- [ ] T12: Wire Statistics button → live stats summary panel from `api.network.getDashboard`.
- [ ] T13: Wire Map button → toggle mount/unmount `<MiniMap />` component on canvas.
- [ ] T14: Wire Info button → floating legend overlay explaining card visuals.
- [ ] T15: Search auto-fit — after search match, `fitView` to frame visible nodes.

## Phase 4: DRY Dialog System 🔴 Outstanding
- [ ] T16: Create `src/components/ui/ConfirmDialog.tsx` — themed, light/dark-safe, replaces all `window.confirm()` calls.
- [ ] T17: Create `src/components/ui/InputDialog.tsx` — replaces `window.prompt()` for email change.
- [ ] T18: Create `src/components/ui/CredentialsDialog.tsx` — replaces duplicate inline credential sections in Stepper + Inspector.
- [ ] T19: Wire "Send via Email" button in `CredentialsDialog` → `api.email.sendEmail`.

## Phase 5: Light/Dark Mode & Polish 🟠 Outstanding
- [ ] T20: Replace hard-coded hex colors in `OrgCardNode` with CSS custom property equivalents for light mode support.
- [ ] T21: Validate and fix `AddMemberStepper` step validation (required fields, email format).
- [ ] T22: Birthday auto-calculates age display below date picker.
- [ ] T23: Animated edges on selected node (highlight parent/child connections in gold).
- [ ] T24: Remove from Hierarchy dialog — expose reconnect vs. cascade mode choice.

## Success Criteria
1. **Visual Parity**: Desktop org cards are indistinguishable in design from the Android Flutter app.
2. **Functional Toolbar**: All 4 toolbar buttons have working, fully implemented handlers.
3. **DRY Dialogs**: Zero `window.confirm()` or `window.prompt()` calls remain. All dialogs are themed and light/dark safe.
4. **Light Mode**: Entire org chart renders correctly in light mode (no dark-only hex values).
5. **Credentials Delivery**: "Send via Email" works from both Stepper and Inspector.
6. **Code Quality**: `npm run build` → zero errors.

