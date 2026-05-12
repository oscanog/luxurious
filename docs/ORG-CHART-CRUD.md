# Org Chart CRUD Specification

## Overview
Enable administrators and users to manage the organizational hierarchy directly from the interactive chart.

## Requirements
- **Root Focus**: The chart must always center on the authenticated user by default.
- **Dynamic Pivot**: Clicking any avatar card pivots the chart to center on that user.
- **Breadcrumbs**: Maintain a dynamic breadcrumb trail showing the path from the original root (current user) to the current pivot.
- **Member Sidebar**: Collapsible right sidebar to list available members. Differentiates "Broken" (previously connected) vs "Unused" members.
- **Connection Dialog**: A verification step that allows selecting a specific manager from the current visible canvas nodes.
- **Reconnect Handle**: Interactive top-center handle on cards to quickly restore the `lastUplineId` connection.
- **Connection Severing**: Initial phase requires clearing all existing relationships to start fresh.
- **Member Management**:
  - Add Member: Select an existing user to become a direct report.
  - Remove Member: Sever the link between a member and their manager.
  - Move Member: Drag-and-drop to change reporting line.

## UI/UX Best Practices
Based on modern standards:
- **Action Menus**: Context-sensitive menus on nodes for "Add Report" or "Remove".
- **Confirmation**: Required for removal to avoid accidental hierarchy breaks.
- **Visual Feedback**: Highlight parent-child links during hover or drag.
- **Search**: Fast member lookup within the "Add" flow.

## Technical Implementation
- **Data Model**: `users` table with a `parentId` or `managerId` field.
- **Visualization**: `@xyflow/react` (React Flow).
- **State**: Convex queries for live hierarchy updates.

## Phase 1: The Great Reset
1. Execute `users:clearAllConnections` mutation.
2. Update frontend to respect the current user as the "Sun" (center) of the system.
