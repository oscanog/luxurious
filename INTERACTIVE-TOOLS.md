# Interactive Org Chart Tools

Desktop org chart power tools for managing network hierarchy.

## Tools Inventory

### 1. Member Sidebar Panel
- **Trigger**: Toggle button on right edge of canvas
- **Purpose**: Browse all users not yet visible on the org chart
- **Features**: Search by name/email, drag-to-canvas, quick-connect button
- **Status Tags**: `Unused` (never connected), `Broken` (previously connected then removed)

### 2. Connection Dialog
- **Trigger**: Click `+` on a sidebar member, or drag member onto canvas
- **Purpose**: Assign a user to a manager (set `uplineId`)
- **Flow**: Select member → pick target manager from visible canvas → Confirm
- **Backend**: Calls `users:setUpline` mutation

### 3. Remove from Hierarchy
- **Trigger**: Trash icon on org card rank band (hover to reveal), or **Right-Click Context Menu**.
- **Purpose**: Detach a member from their current manager
- **Flow**: Click trash or right-click -> "Remove from Hierarchy" → Confirm prompt → member moves to sidebar as `Broken`
- **Backend**: Calls `users:removeUpline` mutation, stores `lastUplineId`

### 4. Quick Reconnect
- **Trigger**: Bounce-animated link icon above disconnected card, click top handle, or **Right-Click Context Menu**.
- **Purpose**: One-click reconnect to previous manager after removal
- **Condition**: Only visible when `lastUplineId` exists and `uplineId` is null
- **Backend**: Calls `users:setUpline` with stored `lastUplineId`

### 5. Node Selection & Focus
- **Trigger**: Click any org card node
- **Purpose**: Highlight selected member with scaled card and glow border
- **Visual**: Selected node scales to 1.05x, ring glow matches rank color

### 6. Pan & Zoom
- **Trigger**: Mouse drag (pan), pinch/scroll (zoom)
- **Bounds**: minZoom 0.2, maxZoom 1.15
- **Auto-fit**: On initial load with 500ms animation, 0.28 padding

### 7. Canvas Context Menu
- **Trigger**: Right-click on blank space in the canvas
- **Purpose**: Quick access to global org chart tools
- **Tools**:
  - **Reset View**: Re-centers and fits the entire org tree into view using `fitView`.
  - **Open/Close Member Sidebar**: Toggles the right-side member assignment panel.

## Auth Guard

- Invalid/expired tokens redirect to login page automatically
- No flash of authenticated content before redirect
- Convex `useConvexAuth()` drives the guard state
