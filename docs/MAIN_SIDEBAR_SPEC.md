# Desktop Main Sidebar Architecture & UI Specification

This document details the UI/UX design specifications for the primary global navigation sidebar in the Desktop application. This sidebar serves as the main structural navigation for the entire Luxurious platform.

## 1. Layout & Positioning
*   **Location:** Fixed to the left side of the viewport.
*   **Width:** Fixed at approximately `240px` to `260px` (standard desktop sidebar width).
*   **Background:** Solid white (`#FFFFFF`) in light mode.
*   **Border:** A subtle 1px solid border on the right side (`1px solid var(--border-color)`) to separate it from the main content area.

## 2. Categorization & Hierarchy
The sidebar is broken into distinct functional groupings.

### Group Headings
*   **Examples:** `NETWORK`, `FINANCE`
*   **Typography:** 
    *   Small font size (e.g., `11px` or `12px`).
    *   `font-weight: 700` (Bold) or `800` (Extra Bold).
    *   `text-transform: uppercase`.
    *   `letter-spacing: 0.1em` or `1px`.
*   **Color:** A muted slate/grey tone to sit back in the visual hierarchy.
*   **Spacing:** Generous top margin to clearly separate groupings from the previous section.

## 3. Navigation Items (The Links)
Each navigation link is represented as a single horizontal row containing an icon and a label.

### Default State (Unselected)
*   **Layout:** Flexbox row, `align-items: center`.
*   **Spacing:** Padding around `10px` to `12px` vertically, `16px` horizontally.
*   **Iconography:** 
    *   Line-art / Outline style icons (e.g., Lucide React or Heroicons).
    *   Size: `20px` or `24px`.
    *   Color: Dark slate blue (matching the text).
*   **Typography:**
    *   Font size: `14px` or `15px`.
    *   Font weight: `500` (Medium) or `400` (Regular).
    *   Color: Dark slate blue.
*   **Hover State:** Should have a subtle background color shift (e.g., very light grey or very faint blue) with rounded corners.

### Active State (Selected)
When a user is currently viewing a route (e.g., `Home`), the sidebar item must distinctively highlight.
*   **Background:** A solid, vibrant primary blue (e.g., `--primary-blue`).
*   **Shape:** Fully rounded corners forming a "pill" shape (`border-radius: 9999px` or `24px`).
*   **Shadow:** A soft, diffused drop-shadow using the primary blue color with lowered opacity to give the active item a subtle "glow" or elevation effect.
*   **Text & Icon Color:** Both the icon and text color invert to pure white (`#FFFFFF`) for maximum contrast.
*   **Font Weight:** The label text font-weight typically jumps to `600` (Semi-bold) to signify active state.

## 4. Accordion / Nested Navigation
Certain top-level items act as folders rather than direct links (e.g., `Banking & Assets`).
*   **Indicator:** Must include a small chevron icon (`ChevronDown`) aligned to the far right of the row.
*   **Interaction:** Clicking the row toggles the expanded/collapsed state of child items.
*   **Child Styling:** Nested items should appear directly below with increased left-padding (`padding-left`) to create a visual indentation (tree-view effect).

## 5. Sidebar Contents (Based on Reference)

**NETWORK**
*   Home (Icon: Home)
*   Org Chart (Icon: Organization / Hierarchy chart)
*   Members (Icon: Users)
*   Social Feed (Icon: Clapperboard / Media)
*   Activity Feed (Icon: Bell)
*   Trading Signals (Icon: Lightning bolt)

**FINANCE**
*   Banking & Assets (Icon: Bank / Classical building) -> *Collapsible*
