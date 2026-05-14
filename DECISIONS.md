# Decisions

Architectural and design decisions for Luxurious.

## 2026-05-11: Core Tech Stack Selection

- **Convex for Backend**: Chosen for its developer experience, real-time by default nature, and seamless integration with React.
- **Tailwind CSS 4**: Used for styling to ensure a modern, maintainable, and highly customizable UI.
- **React Flow (@xyflow/react)**: Selected for the Org Chart to handle complex node-based visualizations with ease.
- **Convex Auth**: Standardized on the official Convex Auth package for security and simplicity.

## 2026-05-11: GSD Integration

- **GSD 2**: Adopting GSD 2 as the primary autonomous agent framework for project management and execution.
- **Unique Milestone IDs**: Enabled to allow for distributed collaboration and clean history.

## 2026-05-14: Desktop Follows Mobile Product Model

- **Mobile Is Source of Truth**: Desktop parity work follows `C:\projects\luxurious-mobile\app` for page order, shell language, and user expectations.
- **Network-First Landing**: Desktop home shifts from org-chart-first to dashboard-first so returning mobile users do not hit different product logic.
- **Dual Theme Requirement**: Light mode and dark mode both required for parity. No dark-only desktop shortcuts.
- **Desktop Adds Capacity, Not Drift**: Org chart power tools and admin routes stay, but they plug into mobile-aligned navigation instead of defining it.

## 2026-05-14: Dashboard Visual Lock

- **Owl Stays**: Desktop home reuses mobile owl art from `logo/views-of-logo-character/front-left.png`. Hero cannot drop mascot.
- **No Desktop-Only Hero FX**: Home hero and sidebar branding remove radial-gradient experiments. Use mobile-aligned solid/linear surfaces.
- **Font Scale Follows Mobile**: Home headline, hero copy, stat cards, and section headers map back to mobile sizes before desktop expansion.
