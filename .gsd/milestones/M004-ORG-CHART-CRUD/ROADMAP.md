# Milestone M004: Org Chart CRUD
**Status:** `[planning]`
**Start Date:** 2026-05-11
**Objective:** Implement full management of organization hierarchy with modern UI/UX.

## Success Criteria
1. [ ] Script/Mutation to sever all existing member connections.
2. [ ] Center org chart on currently logged-in user.
3. [ ] Modern "Add/Remove" member interface (context menus or drag-and-drop).
4. [ ] Real-time updates via Convex.

## Roadmap

### Slice S01: Reset & Pivot
**Status:** `[complete]`
- [x] T01: Create mutation to clear all `parent` or `manager` fields from users.
- [x] T02: Update `OrgChartPage` to use current user as root node.
- [x] T03: Filter/Handle orphaned nodes in visualization.
- [x] T04: Pivot focus on card click with breadcrumb navigation.

### Slice S02: Interactive CRUD
**Status:** `[in-progress]`
- [ ] T01: Implement contextual action menu on `OrgCardNode`.
- [ ] T02: Add member selection modal for "Add Report" flow.
- [x] T03: Implement "Remove Member" logic (detach from parent).
- [x] T04: Collapsible right sidebar for quick member selection/assignment.
- [x] T05: Connection verification dialog with dynamic manager selection and auto-zoom.

### Slice S03: UX Polish
**Status:** `[planning]`
- [ ] T01: Drag-and-drop re-parenting (React Flow integration).
- [ ] T02: Visual feedback for successful updates.
- [ ] T03: Confirmation dialogs for destructive actions.
