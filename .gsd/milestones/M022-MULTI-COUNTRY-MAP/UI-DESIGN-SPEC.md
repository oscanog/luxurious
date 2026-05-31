# UI Design Specification: Multi-Country Map

## Overview
The Multi-Country Map integrates a seamless, dynamic geospatial view of the organization. It uses standard OpenStreetMap tiles to retain geographical accuracy while overlaying a rich, custom-styled interface that respects the Luxurious application's light/dark mode themes.

## Map Base
- **Tile Layer**: Standard OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`).
- **Container Background**:
  - Dark Mode: `#0f172a` (Slate 900)
  - Light Mode: `#f1f5f9` (Slate 100)
- **Controls**: Native zoom controls are disabled in favor of scroll/pinch-to-zoom and the custom quick-fit segmented control.

## Quick-Fit Bounds Control
Located at the top right (`absolute top-4 right-4`), this control allows rapid toggling between key global regions.
- **Container**: Pill-shaped with rounded edges (`rounded-[18px]`), utilizing the theme's standard card background and border tokens (`bg-[hsl(var(--card))]`, `border-[hsl(var(--border))]`) with a subtle shadow (`shadow-lg`).
- **Buttons (PH, CA, World)**:
  - **Inactive**: Subtle text colors matching the foreground, with a muted hover effect (`hover:bg-[hsl(var(--muted))]`).
  - **Active**: Vivid primary color background (`bg-[hsl(var(--primary))]`), white text, floating shadow (`shadow-md`), and a subtle pop-out scale effect (`scale-105`).
  - **Icons**: Emojis (🇵🇭, 🇨🇦, 🌍) paired with text labels for high accessibility and instant visual recognition.

## Individual Member Markers (Pins)
Individual markers are entirely custom HTML/CSS built via `L.divIcon` to simulate a physical map pin with an avatar.
- **Name Label**: A small white rectangular badge with black bold text sitting above the pin avatar.
- **Avatar Circle**: A perfectly round container displaying either the member's uploaded image or their initials (white bold text).
- **Colors by Status/Role**:
  - **Viewer/Invited**: Gold (`#FFD700` in dark mode, `hsl(43 96% 48%)` in light mode).
  - **Joined**: Deep Blue (`#273B7A` in dark mode, `hsl(221 83% 53%)` in light mode).
  - **Pending**: Slate Gray (`#4B5563` in dark mode).
  - **To-Invite**: Dark Gray (`#374151` in dark mode).
- **Structure**: The avatar circle sits on a vertical stem connecting to a semi-transparent black oval (`rgba(0,0,0,0.4)`) acting as the drop shadow/anchor point on the map.
- **Interaction**: The marker scales up by `1.3x` and elevates in `z-index` when clicked/selected.

## Clustering Behavior (Zoomed-Out Counts)
When the map is zoomed out, nearby markers are merged into a single cluster to prevent overlapping and visual clutter. This is powered by `react-leaflet-cluster`.
- **Design**: A circular badge displaying the aggregate count of members in that geographical cluster.
- **Styling**:
  - **Background**: Deep Blue (`#273B7A` / `hsl(221 83% 53%)`) to match active members.
  - **Border**: A distinct 3px solid white border to guarantee visibility against the map terrain.
  - **Shadow**: Prominent drop shadow (`0 4px 6px rgba(0,0,0,0.5)`).
- **Dynamic Sizing based on Count**:
  - *Count < 10*: 36px diameter, 14px font.
  - *Count < 50*: 42px diameter, 16px font.
  - *Count ≥ 50*: 48px diameter, 16px font.
- **Interaction**: Hovering scales the cluster up (`scale(1.1)`). Clicking the cluster automatically zooms the map bounds into that specific region, fracturing the cluster back into individual pins.

## Hover Tooltips & Click Popups
- **Tooltip (Hover)**: Appears above the marker showing Name, Role, Joined downlines (blue text), Prospect downlines (gold text), Days Joined, and Latest Asset (gold text).
- **Popup (Click)**: A richer, styled card (`min-w-[160px]`) displaying the exact same statistics but with elegant dividers, uppercase tracking headers, and a highlighted box for the Latest Asset utilizing a transparent gold background (`bg-[hsl(43_96%_48%/0.1)]`).

## Canada City Labels
A custom overlay implemented to solve OpenStreetMap's tendency to hide Canadian cities at global zoom levels.
- **Design**: Pure text markers (no background) for the top 10 Canadian cities.
- **Styling**:
  - Text color adapts to theme (`#94a3b8` in dark, `#64748b` in light).
  - Heavy 1px text-shadow (black in dark mode, white in light mode) acting as a stroke outline to ensure absolute readability across varying landmass colors.
  - Font is bold, 13px, sans-serif.
- **Behavior**: These labels automatically unmount when the zoom level reaches `6` or higher, allowing OSM's native, highly-detailed map labels to take over seamlessly.
