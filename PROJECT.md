# Luxurious

**Desktop companion to Luxurious Mobile. Convex + React.**

Real-time member workspace. Same mental model across phone and desktop.

## Vision

Users trained on mobile should land on desktop and feel zero confusion.
Desktop gets more room and power, not different product logic.

## Product Direction

- **Parity First**: Mobile app at `C:\projects\luxurious-mobile\app` drives page names, sidebar groups, badge behavior, and signed-in flow.
- **Network First**: Dashboard home, org summary, members, feed, and promotions outrank finance/admin in default UX.
- **Theme Duality**: Light and dark both first-class. No desktop-only dark bias.
- **Desktop Strength**: Org chart canvas, dense tables, and admin tooling stay, but live under same IA users know from mobile.

## Core Surfaces

- **Dashboard Home**: Mobile-first top bar, `Build the network.` headline, owl hero, 2x2 stats, org summary, direct members.
- **Network**: Org Chart, Members, Activity Feed.
- **Support**: Promotions, Academy, support utilities.
- **Profile**: Identity, rank, avatar, password workflow.
- **Admin**: Role-gated advanced tools.

## Tech

- **Backend**: Convex (DB, functions, auth)
- **Frontend**: React 19, Vite 8
- **Styling**: Tailwind CSS 4
- **Flow**: @xyflow/react
- **Icons**: Lucide
