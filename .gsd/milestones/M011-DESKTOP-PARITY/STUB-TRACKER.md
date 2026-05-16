# M011 Desktop Org Chart — Stub & Feature Tracker

**Milestone:** M011-DESKTOP-PARITY  
**Status:** 🟡 In Progress  
**Last Updated:** 2026-05-16

> **For the PM:** This document is the single source of truth for every stub, placeholder, or non-functional element in the Desktop Org Chart feature. Each item has a priority, owner area, verification checklist, and status. Nothing ships until all ✅ checked.

---

## 🔴 Critical Stubs (Breaks UX)

### STUB-01 — Toolbar: Filters button (no-op)
| | |
|---|---|
| **File** | `src/pages/dashboard/OrgChartPage.tsx` L334 |
| **Problem** | `SlidersHorizontal` button has no `onClick` handler. Clicks are silent no-ops. |
| **Expected** | Opens a popover/drawer with status filter chips: All / Joined / Invited / Pending / To-Invite. Filters the visible nodes in the ReactFlow canvas. |
| **Status** | 🔴 STUB |

**QA Steps:**
- [ ] Click Filters icon → a filter panel opens
- [ ] Select "Pending" → only pending nodes visible on canvas
- [ ] Clear filter → all nodes restored
- [ ] Filter state persists if user pans or zooms

---

### STUB-02 — Toolbar: Statistics button (no-op)
| | |
|---|---|
| **File** | `src/pages/dashboard/OrgChartPage.tsx` L340 |
| **Problem** | `ChartColumn` button has no `onClick` handler. |
| **Expected** | Opens a slide-in stats summary panel (or modal) showing: Total joined, invited, pending, to-invite counts — sourced from `api.network.getDashboard`. |
| **Status** | 🔴 STUB |

**QA Steps:**
- [ ] Click Statistics → panel opens with live counts
- [ ] Counts match the Dashboard home page stats cards
- [ ] Panel closes on outside click or pressing Escape

---

### STUB-03 — Toolbar: Minimap toggle (no-op)
| | |
|---|---|
| **File** | `src/pages/dashboard/OrgChartPage.tsx` L346 |
| **Problem** | `Map` icon button has no `onClick` handler. The `<MiniMap />` component from `@xyflow/react` is already imported but not mounted. |
| **Expected** | Toggle button mounts/unmounts the ReactFlow `<MiniMap />` overlay in the bottom-right corner of the canvas. |
| **Status** | 🔴 STUB |

**QA Steps:**
- [ ] Click Map → minimap appears on canvas (bottom-right)
- [ ] Click Map again → minimap hidden
- [ ] Minimap responds correctly to node panning
- [ ] Dark mode: minimap uses correct `--card` background colors

---

### STUB-04 — Toolbar: Info button (no-op)
| | |
|---|---|
| **File** | `src/pages/dashboard/OrgChartPage.tsx` L352 |
| **Problem** | `Info` button has no `onClick` handler. No legend exists. |
| **Expected** | Opens a small floating legend overlay explaining: node border color = selection, gold `+` = add member, `−` = remove, green border = active, "FULL" badge = max 6 children. |
| **Status** | 🔴 STUB |

**QA Steps:**
- [ ] Click Info → legend overlay appears
- [ ] Legend explains all visual elements accurately
- [ ] Overlay dismisses on click-outside or Escape

---

### STUB-05 — MemberInspector: Change Email uses `window.prompt()`
| | |
|---|---|
| **File** | `src/components/org-chart/MemberInspector.tsx` L57 |
| **Problem** | `handleChangeEmail` calls `window.prompt(...)` — a native browser dialog. This is jarring, has no validation, no loading state in the dialog, and is incompatible with the app's light/dark themes. |
| **Expected** | A dedicated styled modal dialog with an email input field, inline validation, and confirm/cancel buttons. Must use the centralized `ConfirmDialog` system (see DRY Dialog section). |
| **Status** | 🔴 STUB |

**QA Steps:**
- [ ] Click "Change Email" → a styled modal opens (not browser prompt)
- [ ] Empty email → inline error "Email is required"
- [ ] Same email as current → inline error "Email is unchanged"
- [ ] Invalid format → inline error "Invalid email format"
- [ ] Valid → loading spinner → success credential dialog
- [ ] Dark mode: modal renders correctly

---

### STUB-06 — OrgCardNode: Handles invisible
| | |
|---|---|
| **File** | `src/components/org-chart/OrgCardNode.tsx` L130-L131 |
| **Problem** | Both `Handle` components have `!opacity-0`. They are invisible but still functionally present. This prevents users from visually understanding connection points. In the mobile app, gold connector lines anchor visibly to edges of cards. |
| **Expected** | Gold connector line attachment points should be visually expressed (even subtly), OR the edge styles should visually communicate the connection without explicit handle dots. |
| **Status** | 🔴 STUB |

**QA Steps:**
- [ ] Edges (gold lines) connect visually and cleanly to card top/bottom
- [ ] No orphaned floating handles visible on the canvas
- [ ] On selection, edge highlight is visible

---

## 🟠 High Priority Stubs (Degrades UX)

### STUB-07 — MemberInspector: Confirmation dialogs use `confirm()`
| | |
|---|---|
| **Files** | `MemberInspector.tsx` L42, L76 / `OrgCardNode.tsx` L39, L77 |
| **Problem** | Destructive actions (Reset Password, Delete Member, Remove from Hierarchy) all use native `window.confirm()`. This is unstyled, blocks the UI thread, and cannot be themed. |
| **Expected** | All destructive actions must use the centralized `ConfirmDialog` component (see DRY Dialog section below). |
| **Status** | 🟠 HIGH |

**QA Steps:**
- [ ] Delete Member → styled dialog with red accent, member name, warning copy
- [ ] Remove from Hierarchy → styled dialog with context (member name)
- [ ] Reset Password → styled confirmation with "user will be logged out" warning
- [ ] Cancel dismisses cleanly with no mutation fired
- [ ] Dark/Light mode renders correctly

---

### STUB-08 — AddMemberStepper: No Email Send button on success
| | |
|---|---|
| **File** | `src/components/org-chart/AddMemberStepper.tsx` L271-L296 |
| **Problem** | The success screen shows credentials with a copy button but has no "Send via Email" action. The mobile flutter version includes an email dispatch button to send credentials to the new member via the system Gmail. The `Send` icon is imported but not connected. |
| **Expected** | A "Send via Gmail" button that calls `api.email.sendEmail` with the new member's credentials. Must show loading + success/error feedback. |
| **Status** | 🟠 HIGH |

**QA Steps:**
- [ ] Success screen shows "Send via Email" button
- [ ] Clicking it sends email and shows success toast
- [ ] On failure, shows error toast with retry
- [ ] Button has loading spinner while sending

---

### STUB-09 — MemberInspector: No Email Send button on credentials dialog
| | |
|---|---|
| **File** | `src/components/org-chart/MemberInspector.tsx` L211-L248 |
| **Problem** | After password reset / email change, the credentials dialog only shows Copy buttons. Missing the "Send via Email" button present in the mobile app. |
| **Expected** | Same as STUB-08 — a styled "Email Credentials" button dispatching to `api.email.sendEmail`. |
| **Status** | 🟠 HIGH |

**QA Steps:**
- [ ] Credentials dialog has "Send via Email" button
- [ ] Sends email + confirms with toast
- [ ] Works for both password reset and email change events

---

### STUB-10 — OrgCardNode: Hard-coded dark colors (Light mode broken)
| | |
|---|---|
| **File** | `src/components/org-chart/OrgCardNode.tsx` L116-L119, L147, L167, L179 |
| **Problem** | The card uses raw hex colors (`#1A2235`, `#273B7A`, `#8B9BB4`, `#111827`, `#FFD700`) that are hard-coded to the dark theme palette. In light mode, the card will appear dark navy against a white canvas — completely broken. |
| **Expected** | All card colors must use CSS custom properties or compute their values using a `useTheme` hook / `data-theme` attribute conditionals so they switch correctly between light and dark mode. |
| **Status** | 🟠 HIGH |

**QA Steps:**
- [ ] Toggle to Light mode → org card is legible (not dark navy on white)
- [ ] Gold accents remain vibrant in both modes
- [ ] Toggle back to Dark mode → unchanged from current design
- [ ] Text passes WCAG AA contrast in both modes

---

### STUB-11 — Search: Hides nodes but does not center/focus matches
| | |
|---|---|
| **File** | `src/pages/dashboard/OrgChartPage.tsx` L272 |
| **Problem** | Search currently uses `hidden: true` on non-matching nodes. This keeps the viewport static. If the matching node is off-screen, the user has no visual cue and must manually pan. |
| **Expected** | After a debounced search hit, `fitView` should animate to frame all visible (matching) nodes. |
| **Status** | 🟠 HIGH |

**QA Steps:**
- [ ] Type a name in search → canvas auto-fits to show matching nodes
- [ ] Clear search → canvas restores to previous state or re-fits all
- [ ] No janky jumps — smooth `fitView` animation (duration ~400ms)

---

## 🟡 Medium Priority Stubs (Missing Features)

### STUB-12 — MemberInspector: Network Stats — Missing direct children count
| | |
|---|---|
| **File** | `src/components/org-chart/MemberInspector.tsx` L159-L168 |
| **Problem** | Stats grid shows only "Total" downlines and "Invited" count. The mobile inspector shows: Direct Children, Total Downlines, Invited, Pending as a 4-cell grid. |
| **Expected** | Add "Direct" and "Pending" cells to the grid. Values sourced from `member.directChildrenCount` and `member.pendingCount`. |
| **Status** | 🟡 MEDIUM |

**QA Steps:**
- [ ] Inspector stats shows 4 cells: Direct / Total / Invited / Pending
- [ ] All values are live from backend
- [ ] Zero states show `0` not blank

---

### STUB-13 — AddMemberStepper: Birthday age auto-calculation
| | |
|---|---|
| **File** | `src/components/org-chart/AddMemberStepper.tsx` L218-L222 |
| **Problem** | Birthday date picker exists but does not auto-calculate and display the member's age in real-time, as the mobile stepper does. |
| **Expected** | After selecting birthday, display calculated age inline below the date picker (e.g., "Age: 34 years"). |
| **Status** | 🟡 MEDIUM |

**QA Steps:**
- [ ] Select birthday → "Age: XX years" appears below
- [ ] Invalid/future date → "Invalid date" or no age shown
- [ ] Age updates in real-time on date change

---

### STUB-14 — AddMemberStepper: No validation before Next
| | |
|---|---|
| **File** | `src/components/org-chart/AddMemberStepper.tsx` L72-L76 |
| **Problem** | `handleNext` advances steps unconditionally. No field validation — First Name can be blank, email can be invalid format. |
| **Expected** | Each step validates required fields before advancing. Show inline error messages under failing fields. |
| **Status** | 🟡 MEDIUM |

**QA Steps:**
- [ ] Step 2 (Identity): Can't advance without First Name and Last Name
- [ ] Step 3 (Contact): Full Member requires a valid email; Prospect email optional but validated if entered
- [ ] Error messages are styled consistently (red text, red input border)
- [ ] Errors clear on field correction

---

### STUB-15 — Context Menu: Remove from Hierarchy — No reconnect mode selector
| | |
|---|---|
| **File** | `src/components/org-chart/OrgCardNode.tsx` L76-L84 |
| **Problem** | "Remove from Hierarchy" always calls `reassignMemberParent` with `newParentMemberId: null`. This disconnects the node. But the backend `deleteMember` supports two modes: `reconnect` (reattaches children to grandparent) and `cascade`. The UI never exposes this choice. |
| **Expected** | The removal confirmation dialog should present a choice: "Disconnect only" vs "Disconnect and reconnect children to grandparent". |
| **Status** | 🟡 MEDIUM |

**QA Steps:**
- [ ] Remove dialog shows mode selector (radio/toggle)
- [ ] "Disconnect only" leaves children orphaned (disconnected)
- [ ] "Reconnect children" reattaches them to grandparent
- [ ] Both modes confirm correctly with the styled dialog

---

## 🟢 Low Priority / Polish

### STUB-16 — OrgCardNode: Rank label replaced with static "Member"
| | |
|---|---|
| **File** | `convex/network.ts` L177 |
| **Problem** | `buildTree` hard-codes `rank: "Member"` for all nodes. The `networkMembers` schema likely has a `roleTitle` field with richer data. |
| **Expected** | Map `roleTitle` to a rank tier (Master/Diamond/Gold/Silver/Bronze) or simply display `roleTitle` as the subtitle. |
| **Status** | 🟢 LOW |

---

### STUB-17 — Canvas: No animated edge style for "selected" parent-child
| | |
|---|---|
| **File** | `src/pages/dashboard/OrgChartPage.tsx` L108 |
| **Problem** | All edges use `animated: false`. When a node is selected, its parent/child edges are not highlighted. Mobile design uses animated gold flows on connected edges. |
| **Expected** | On node selection, compute which edges connect to the selected node and set `animated: true` + brighter stroke for those edges only. |
| **Status** | 🟢 LOW |

---

## ✅ Completed Features (Reference)

| ID | Feature | Status |
|---|---|---|
| DONE-01 | Gold `+` FAB button on card bottom | ✅ Complete |
| DONE-02 | `−` detach button on card top-right | ✅ Complete |
| DONE-03 | Gold `Network` Fit View button (separated) | ✅ Complete |
| DONE-04 | Floating pill toolbar (Filters/Stats/Map/Info icons) | ✅ Visual only — see stubs above |
| DONE-05 | AddMemberStepper multi-step flow | ✅ Complete |
| DONE-06 | Auto-save draft to localStorage | ✅ Complete |
| DONE-07 | Smart paste clipboard | ✅ Complete |
| DONE-08 | MemberInspector Security tab | ✅ Complete |
| DONE-09 | Password reset + credentials dialog | ✅ Complete |
| DONE-10 | Search filter (visibility only) | ✅ Partial — see STUB-11 |
| DONE-11 | 6-downline FULL badge | ✅ Complete |
| DONE-12 | Reconnect button for orphaned nodes | ✅ Complete |

---

## 🏗️ DRY Centralized Dialog System (Planned)

> **Motivation:** Currently, `confirm()`, `prompt()`, and inline credential `<div>` overlays are scattered across 3 files. This produces inconsistent UX, cannot be themed, and duplicates markup. A single centralized dialog system must replace all of them.

### Proposed Components

#### `<ConfirmDialog />`
Props: `title`, `description`, `confirmLabel`, `confirmVariant` (default | danger), `onConfirm`, `onCancel`, `isOpen`

Replaces:
- `window.confirm()` in `MemberInspector.tsx` L42, L76
- `window.confirm()` in `OrgCardNode.tsx` L39, L77

Visual spec:
- Modal overlay: `bg-black/60 backdrop-blur-sm`
- Card: `bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[28px]`
- Danger variant: red confirm button, red icon accent
- Animations: `animate-in fade-in zoom-in-95 duration-200`
- Works correctly in light AND dark mode (all CSS vars, no raw hex)

#### `<InputDialog />`
Props: `title`, `label`, `placeholder`, `defaultValue`, `validate`, `onConfirm`, `onCancel`, `isOpen`

Replaces:
- `window.prompt()` in `MemberInspector.tsx` L57

Visual spec:
- Same modal container as `ConfirmDialog`
- Input uses `rounded-[18px] border border-[hsl(var(--border))]` styling matching the Stepper's `InputGroup`
- Inline error message below input (red, animated in)

#### `<CredentialsDialog />`
Props: `name`, `email`, `password`, `onClose`, `onSendEmail`

Replaces:
- Inline credential `<div>` in `MemberInspector.tsx` L211-L248
- Inline credential section in `AddMemberStepper.tsx` L271-L296

Visual spec:
- Emerald success icon at top
- Two rows: Email | Password — each with Copy button
- "Send via Email" button: ghost-outlined with `Mail` icon, calls `api.email.sendEmail`
- "Dismiss" CTA button in primary color
- Works correctly in light AND dark mode

### File Location Plan
```
src/components/ui/
  ConfirmDialog.tsx   ← new
  InputDialog.tsx     ← new
  CredentialsDialog.tsx ← new (replaces duplicated inline credential blocks)
```

---

## QA Sign-off Checklist

Before marking M011 complete, a full QA pass must verify:

- [ ] All STUB-01 through STUB-06 (Critical) are resolved and passing
- [ ] All STUB-07 through STUB-11 (High) are resolved and passing
- [ ] `ConfirmDialog`, `InputDialog`, `CredentialsDialog` implemented and replacing all stubs
- [ ] Light mode: entire org chart renders legibly (no dark-only hex colors)
- [ ] Dark mode: no regressions from the new card design
- [ ] `npm run build` passes with zero errors
- [ ] No `window.confirm()` or `window.prompt()` calls remain in org chart files
- [ ] All toolbar buttons have functional `onClick` handlers
