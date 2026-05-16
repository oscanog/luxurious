# Milestone M010: Mobile Feature Parity

**Status:** `[complete]`
**Start Date:** 2026-05-16
**Completion Date:** 2026-05-16
**Objective:** Bring the desktop web application to full feature parity with the latest Android app advancements (Mobile milestones M011, M013, M014, and recent security implementations). This ensures a seamless, unified experience for users switching between mobile and desktop environments.

## Phase 1: Dashboard & UI Polish (Syncing M011)
- [x] T01: Add dual real-time clocks (PH/Canada) to the Desktop Dashboard Header.
- [x] T02: Implement the animated Pulse Chip for Joined/Invited/Pending network stats.
- [x] T03: Build the interactive Network Explorer module with 4 tabs (Joined, Invited, Pending, To Invite).
- [x] T04: Add infinite scroll / pagination using Convex queries for large lists.
- [x] T05: Implement inline quick-copy mechanisms for User IDs and usernames.

## Phase 2: Advanced Org Chart Studio (Syncing M013)
- [x] T06: Upgrade the desktop Org Chart to a full "Studio" canvas (pan, zoom, fit-to-screen, center-on-node).
- [x] T07: Build a persistent top command bar for search, branch collapse/expand toggles, and view orientation.
- [x] T08: Implement grid backdrops and a Minimap / Overview panel for large network navigation.
- [x] T09: Add dynamic status filters (Projection vs Real Hierarchy view modes).
- [x] T10: Enforce visual capacity indicators (e.g., Red "FULL 6/6" badge) for nodes with max direct downlines.

## Phase 3: Org Chart Onboarding & Stepper (Syncing M014)
- [x] T11: Implement the conditional `(+)` Add Member button with strict backend limit checks (max 6 direct children).
- [x] T12: Replace standard forms with a multi-step modal "Stepper" for adding New Members vs Prospects.
- [x] T13: Implement Smart Paste and auto-calculation logic (e.g., deriving age from a Birthday picker).
- [x] T14: Introduce local auto-save drafts for incomplete onboarding flows to prevent data loss.
- [x] T15: Surface inline validation marks (e.g., email format, phone requirements) during the onboarding steps.

## Phase 4: Admin Security Management (Syncing Post-Mortem Updates)
- [x] T16: Create a distinct "Security" section within the desktop member inspector panel.
- [x] T17: Move the "Delete Member" operation to the Security section, utilizing prominent destructive UI styling (red accents).
- [x] T18: Implement "Change Password" and "Change Email" modals triggering the new backend administrative mutations.
- [x] T19: Build the `Credentials Delivery Dialog` upon successful security resets to display the generated Email/Password.
- [x] T20: Add "Copy Credentials" and "Email Credentials" dispatch buttons (integrating with `email:sendEmail`) within the success dialog.

## Success Criteria
1. **Visual Parity**: The desktop Org Chart visually mirrors the Android AutoCAD-like Studio, complete with minimaps and zoom controls.
2. **Functional Parity**: Admins can complete the identical onboarding stepper and execute all security actions (password resets, credential emails) natively on the web dashboard.
3. **Constraint Parity**: The 6-downline limit is rigidly enforced both server-side (already done) and visually represented in the desktop UI, matching mobile.
4. **Code Quality**: All web components follow the established React/Convex patterns, with zero TypeScript or linting errors.
