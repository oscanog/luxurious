# Milestone M004: Org Chart CRUD
**Status:** `[complete]`
**Start Date:** 2026-05-11
**Objective:** Implement full management of organization hierarchy with modern UI/UX.

## Success Criteria
1. [x] Script/Mutation to sever all existing member connections.
2. [x] Center org chart on currently logged-in user.
3. [x] Modern "Add/Remove" member interface (context menus).
4. [x] Real-time updates via Convex.

## Roadmap

### Slice S01: Reset & Pivot
**Status:** `[complete]`
- [x] T01: Create mutation to clear all `parent` or `manager` fields from users.
- [x] T02: Update `OrgChartPage` to use current user as root node.
- [x] T03: Filter/Handle orphaned nodes in visualization.
- [x] T04: Pivot focus on card click with breadcrumb navigation.

### Slice S02: Interactive CRUD
**Status:** `[complete]`
- [x] T01: Implement contextual action menu on `OrgCardNode`.
- [x] T02: Add member selection modal for "Add Report" flow.
- [x] T03: Implement "Remove Member" logic (detach from parent).
- [x] T04: Collapsible right sidebar for quick member selection/assignment.
- [x] T05: Connection verification dialog with dynamic manager selection and auto-zoom.

### Slice S03: UX Polish
**Status:** `[complete]`
- [x] T01: Drag-and-drop re-parenting (React Flow integration).
- [x] T02: Reconnect Handle: One-click restore of broken connections.
- [x] T03: Connection Tracking: Differentiate "Broken" vs "Unused" members.
- [x] T04: Visual feedback for successful updates.
- [x] T05: Confirmation dialogs for destructive actions.
