# M018: Heatmap Org Chart Focus (Desktop & Backend)

## Objective
Implement an interactive, global network stats overview on the desktop Org Chart side panel (and provide APIs for the mobile counterpart). The side panel will be widened to accommodate an interactive heatmap tracking network growth and a tabular list of members.

## Phases

### Phase 1: Backend Aggregation (Convex)
- [x] Create `networkMembers.getHeatmapStats` query to aggregate `joinedAt` and `investmentStartedAt` across the entire downline.
- [ ] Expose the query via `http.ts` in the `/mobile/query` POST route for seamless Flutter mobile access.

### Phase 2: Desktop React UI (Org Chart Sidebar)
- [x] Expand `MemberSidebar.tsx` width from `w-80` to `w-[450px]`.
- [ ] Implement the UI components for the Heatmap grid mapping (e.g., using `react-calendar-heatmap` or custom SVG squares).
- [ ] Connect the heatmap components to the new `getHeatmapStats` endpoint.
- [ ] Implement search, filter, and pagination in the sidebar member list.

### Phase 3: Theming
- [ ] Ensure the new wider panel scales well and supports both dark and light modes.
- [ ] Connect member click events to individual stat displays or modals.
