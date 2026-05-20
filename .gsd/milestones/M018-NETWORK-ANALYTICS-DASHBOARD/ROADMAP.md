# M018: Network Analytics Dashboard (Desktop & Backend)

## Objective
Implement a comprehensive, interactive network analytics overview on the desktop Org Chart side panel (and provide APIs for mobile). The side panel will display multiple data visualizations (Heatmap, Donut Charts, Bar Graphs) tracking network growth, member status distribution, and asset logs.

## Phases

### Phase 1: Backend Aggregation (Convex)
- [x] Create `networkMembers.getAnalyticsStats` (formerly `getHeatmapStats`) query to aggregate `joinedAt` and `investmentStartedAt`.
- [ ] Extend query to aggregate Member Status (Joined, Pending, Invited).
- [ ] Extend query to aggregate Role Distribution (Senior Stakeholder, Member, Prospect).
- [ ] Extend query to calculate Total Network Assets from `memberAssets`.
- [x] Expose the query via `http.ts` in the `/mobile/query` POST route for Flutter mobile access.

### Phase 2: Desktop React UI (Org Chart Sidebar)
- [x] Expand `MemberSidebar.tsx` width from `w-80` to `w-[450px]`.
- [x] Implement the UI components for the Heatmap grid mapping using `react-calendar-heatmap`.
- [ ] Implement a Donut Chart for Member Status Distribution (using `recharts` or similar).
- [ ] Implement a Bar Chart for Role Distribution.
- [ ] Implement a Line Chart for Total Asset Growth over time.
- [ ] Implement search, filter, and pagination in the sidebar member list below the charts.

### Phase 3: Theming
- [ ] Ensure all charts scale well and support both dark and light Luxurious modes.
- [ ] Connect member click events to individual stat displays or modals.
