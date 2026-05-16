# M011-DESKTOP-PARITY: Technical Specification

## Context
Following the completion of the Android mobile org chart implementation (M011/M013), a massive visual and UX disparity existed between the luxurious, high-contrast mobile app and the utilitarian, data-heavy desktop web dashboard. Stakeholders mandated immediate action to bring the desktop implementation up to parity, citing missing controls (Minimap, Info) and confusing UX patterns (using a "Reload" icon to recenter the canvas).

## Architecture & Refactor Strategy

### 1. The `OrgCardNode` Refactor (`src/components/org-chart/OrgCardNode.tsx`)
The previous node component was entirely stripped and rewritten to match the Flutter design system:
- **Typing Correction:** Addressed a severe XYFlow type misconfiguration (`NodeProps<OrgCardNode>`) by explicitly declaring `export type OrgCardNodeType = Node<OrgCardData, "org-card">` and passing it to the generic `NodeProps<OrgCardNodeType>`.
- **Legacy Property Exclusions:** Removed dependencies on hard-coded legacy arrays like `RANK_COLORS` and the manual `StatusDot` component. The card now utilizes isolated CSS properties matching the mobile spec (e.g., `#1A2235` background, `#FFD700` luxurious gold highlights).
- **Consolidated Props:** Merged three separate stat chips (`dline`, `invited`, `pending`) into two highly legible, structured zones: inline direct children count and a dedicated, rounded block for total downlines.

### 2. The Floating Toolbar (`src/pages/dashboard/OrgChartPage.tsx`)
The `OrgChartPage` toolbar was completely overhauled.
- **Removed Dependencies:** Obsolete lucide icons (`RotateCcw`, `LayoutTemplate`, `Filter`) were purged.
- **Floating Container Abstraction:** The header-attached toolbar was replaced by a floating-pill design pattern (`bg-[#1A2235]` with soft glowing drop shadows).
- **Separation of Concerns:** 
  - The left pill houses view configurations: `SlidersHorizontal` (Filters), `ChartColumn` (Stats), `Map` (Minimap), and `Info`.
  - The right, structurally separate squircle button houses the `Network` icon as the unambiguous "Fit View / Reset" action.

### 3. Navigation Clean-up (`src/components/layout/AdminLayout.tsx`)
The top navbar (`AdminLayout`) was decluttered to maximize canvas space for the org chart:
- **Grid Layout Reversion:** Removed the `xl:grid xl:grid-cols-[...]` configuration that forced a center column alignment.
- **Flex Justification:** Maintained standard `flex justify-between` to anchor the brand title to the left and push the User Dropdown and Notification Bell fully to the right.
- **Removed Components:** Unmounted `HeaderClocks` and `NetworkPulseChip` as they added unnecessary cognitive load.

## Future Considerations
- **Minimap Integration:** The new toolbar `Map` icon currently acts as a placeholder visual matching the mobile app. It should be wired to dynamically mount/unmount the XYFlow `<MiniMap />` component.
- **Responsive Constraints:** The new 240px wide `OrgCardNode` performs beautifully on desktop and tablet breakpoints. Mobile web views may require dynamic scaling or a CSS `transform: scale(0.85)` if horizontal canvas real estate is critically low.
