# Milestone M011: Desktop Feature and Visual Parity

**Status:** `complete`  
**Start Date:** `2026-05-16`  
**Completion Date:** `2026-05-16`  
**Stub Tracker:** [STUB-TRACKER.md](./STUB-TRACKER.md)

## Outcome
M011 is complete.

Desktop org chart now has:

- visual parity improvements
- working toolbar actions
- working minimap
- working React Flow controls
- themed dialog replacements
- better search viewport behavior
- light and dark mode support

## Delivered Phases

### Phase 1: Visual Parity
- [x] Refactor `OrgCardNode` visual design toward desktop/mobile parity
- [x] Avatar/icon refresh
- [x] Status pill and stats layout refresh
- [x] Card action affordances (`+`, remove, reconnect, full badge)

### Phase 2: Navbar and Controls
- [x] Navbar cleanup
- [x] Dedicated fit-view affordance
- [x] Floating toolbar shell

### Phase 3: Toolbar Wiring
- [x] Filters button
- [x] Statistics button
- [x] Map button / minimap toggle
- [x] Info button
- [x] Search viewport centering

### Phase 4: Dialog System Cleanup
- [x] `ConfirmDialog`
- [x] `InputDialog`
- [x] `CredentialsDialog`
- [x] Email credential actions

### Phase 5: Theme, UX, and Interaction Polish
- [x] Light mode-safe org card styling
- [x] Stepper validation
- [x] Birthday age calculation
- [x] Selected edge animation
- [x] Remove hierarchy mode choice

## Final Minimap Fix Notes

Late-stage minimap bug required extra work after main milestone implementation.

Final fix included:

1. Move XYFlow CSS import to `src/main.tsx`
2. Preserve React Flow internal node state during sync
3. Wait for node initialization before fit/minimap-dependent behavior
4. Reposition desktop overlay panels into visible top corners
5. Restore minimap node contrast by status color

Full write-up:

- [MINIMAP-BUG-POST-MORTEM.md](./MINIMAP-BUG-POST-MORTEM.md)

## Success Criteria

- [x] Desktop org cards match target design closely
- [x] Toolbar actions are functional
- [x] Desktop minimap works
- [x] React Flow controls work
- [x] Dialog UX is themed and centralized
- [x] Light mode works
- [x] Build passes
