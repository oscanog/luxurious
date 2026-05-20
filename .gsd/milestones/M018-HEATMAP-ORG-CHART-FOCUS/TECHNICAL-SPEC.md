# Technical Spec: Heatmap Org Chart Focus (Desktop & Backend)

## Architecture Overview
The feature adds global network statistics to the existing React desktop application (under `/org-chart`) and provides HTTP API endpoints for the Flutter mobile application. The core logic relies on a new Convex query aggregating the `networkMembers` table.

## 1. Convex Backend Query
- **File**: `convex/networkMembers.ts`
- **Method**: `getHeatmapStats`
- **Logic**: Aggregates `joinedAt` and `investmentStartedAt` fields from `networkMembers` by Date (format: YYYY-MM-DD), returning `joinsByDate` and `investmentsByDate` records alongside a list of raw member data.

## 2. HTTP Bridge Exposure
- **File**: `convex/http.ts`
- **Route**: `POST /mobile/query`
- **Mapping**: The query string `networkMembers:getHeatmapStats` triggers `api.networkMembers.getHeatmapStats`.

## 3. Desktop React Sidebar
- **Component**: `MemberSidebar.tsx`
- **Width**: Increased to `w-[450px]` for spacious rendering of charts.
- **Library**: `react-calendar-heatmap` (or equivalent) will map the returned `joinsByDate` and `investmentsByDate` to a visually appealing, themed interactive grid.
