# M011 Desktop Org Chart - Stub and Feature Tracker

**Milestone:** `M011-DESKTOP-PARITY`  
**Status:** `complete`  
**Last Updated:** `2026-05-16`

## Final Summary
All tracked M011 desktop org chart gaps were closed.

Most important late fix:

- Desktop minimap now works correctly.
- React Flow controls now render correctly.
- Root cause and learnings are documented in [MINIMAP-BUG-POST-MORTEM.md](./MINIMAP-BUG-POST-MORTEM.md).

## Critical Items

| ID | Area | Final Status | Notes |
|---|---|---|---|
| STUB-01 | Filters toolbar button | DONE | Status filter popover wired and functional |
| STUB-02 | Statistics toolbar button | DONE | Live stats panel wired from dashboard data |
| STUB-03 | Minimap toolbar button | DONE | CSS import, XYFlow sync, panel placement, and minimap contrast fixed |
| STUB-04 | Info toolbar button | DONE | Legend overlay implemented |
| STUB-05 | Inspector email change prompt | DONE | Native prompt replaced with themed dialog |
| STUB-06 | Org card handle visibility / edge clarity | DONE | Edge attachment visuals cleaned up |

## High Priority Items

| ID | Area | Final Status | Notes |
|---|---|---|---|
| STUB-07 | Destructive confirm dialogs | DONE | Centralized confirm dialog used |
| STUB-08 | Stepper send credentials email | DONE | Email action wired |
| STUB-09 | Inspector credentials email | DONE | Email action wired |
| STUB-10 | Light mode org card colors | DONE | Theme-safe styling restored |
| STUB-11 | Search focus / viewport behavior | DONE | Search now centers matching node |

## Medium and Polish Items

| ID | Area | Final Status | Notes |
|---|---|---|---|
| STUB-12 | Inspector network stats completeness | DONE | Stats grid completed |
| STUB-13 | Birthday age calculation | DONE | Auto-calculated age shown |
| STUB-14 | Stepper validation | DONE | Required field validation added |
| STUB-15 | Remove hierarchy reconnect mode | DONE | Mode choice exposed in UI |
| STUB-16 | Rank label quality | DONE | Better rank/title mapping |
| STUB-17 | Selected edge animation | DONE | Connected edges highlight correctly |

## Minimap-Specific Learnings

1. React Flow CSS must stay imported in `src/main.tsx`, not through Tailwind CSS import chain.
2. In `@xyflow/react` v12, parent-to-local node sync must preserve existing internal node state.
3. "Rendered but off-screen" still counts as broken. Panel placement matters on desktop.
4. Minimap colors need contrast or it reads like missing UI.
5. Fit/measurement timing matters with custom nodes; `useNodesInitialized()` is safer.

## Verification Notes

- `npm run build` passed after final minimap fix.
- File-level lint for `src/pages/dashboard/OrgChartPage.tsx` passed after final minimap fix.
- User-confirmed desktop minimap behavior is working.

## Ship Checklist

- [x] Toolbar buttons functional
- [x] Minimap toggle functional
- [x] React Flow controls visible
- [x] Search viewport behavior improved
- [x] Light and dark themes supported
- [x] Dialog cleanup completed
- [x] Build passes
