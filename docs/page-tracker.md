# Page & Feature Tracker — Luxurious

> Track all pages, their implementation status, and associated tasks.
> Statuses: `🔲 Planned` · `🚧 In Progress` · `✅ Done` · `🔒 Blocked`

---

## 📋 Legend

| Symbol | Meaning |
| :--- | :--- |
| 🔲 | Not started |
| 🚧 | In progress |
| ✅ | Completed |
| 🔒 | Blocked (dependency/decision needed) |
| 🎯 | Phase 1 priority |
| 💰 | Requires backend / Convex |
| 🔐 | Requires auth |

---

## Phase 1 — Frontend Dummy UI

### 🔐 Authentication

| Page / Component | Status | Notes |
| :--- | :--- | :--- |
| **Login Page** (`/`) | 🔲 🎯 | Email + Password form only. No sign-up link. |
| Sign-out button | 🔲 | Header component, shown when authenticated |
| Auth guard wrapper | 🔲 | Redirects unauthenticated users to `/` login |

---

### 🏠 Dashboard — Admin Shell

| Page / Component | Status | Notes |
| :--- | :--- | :--- |
| **Admin Layout** (Sidebar + Header) | 🔲 🎯 | Left sidebar, top header with user info |
| Sidebar navigation | 🔲 🎯 | Links: Org Chart, Members, Invitations, Settings |
| Sidebar branding card | 🔲 | Blue bg, white dot pattern, "Luxurious" logo |
| Top header | 🔲 | App name, current user avatar, dark mode toggle |
| Mobile responsive shell | 🔲 | Collapsible sidebar, hamburger menu |

---

### 🌐 Org Chart (`/org-chart`)

| Page / Component | Status | Notes |
| :--- | :--- | :--- |
| **Org Chart Page** | 🔲 🎯 | Full page ReactFlow canvas |
| ReactFlow canvas setup | 🔲 🎯 | Pan, Zoom, Background grid |
| Member Card Node (`orgCard`) | 🔲 🎯 | Name, Rank, Stats (dummy data) |
| Root/Master node | 🔲 🎯 | Admin node — gold border + glow |
| Upline nodes (L1) | 🔲 🎯 | Blue border |
| Downline nodes (L2+) | 🔲 🎯 | Muted border |
| Edge connectors (upline→downline) | 🔲 🎯 | Smooth step edges |
| Toolbar (Select / Pan / Zoom In/Out) | 🔲 | Top toolbar like ClickUp whiteboard |
| Mini-map | 🔲 | Optional — ReactFlow built-in |
| Fit-to-view button | 🔲 | Reset viewport |
| Node click → Detail panel | 🔲 | Right side panel with member details |
| Dummy data seed (10–15 members) | 🔲 🎯 | Hardcoded tree structure |

---

### 👥 Members (`/members`)

| Page / Component | Status | Notes |
| :--- | :--- | :--- |
| **Members List Page** | 🔲 | Table/grid view of all members |
| Member table (Name, Rank, Upline, Status) | 🔲 | Sortable columns |
| Member status badges | 🔲 | Active / Inactive / Pending |
| Search & filter bar | 🔲 | Filter by rank or status |
| Member detail drawer/modal | 🔲 | Click a row → side panel |
| Dummy data (matches org chart seed) | 🔲 | Same 10–15 member dataset |

---

### 📨 Invitations (`/invitations`)

| Page / Component | Status | Notes |
| :--- | :--- | :--- |
| **Invitations Page** | 🔲 | Admin-only view |
| Invite Member modal (Email input) | 🔲 | Input email → generates dummy invite link |
| Pending invitations list | 🔲 | Show sent/pending/accepted invitations |
| Copy invite link button | 🔲 | Copy to clipboard action |
| Revoke invitation button | 🔲 | Remove pending invite |
| ⚠️ Backend: actual email sending | 🔒 💰 | Future — Gmail app_password integration |

---

### ⚙️ Settings (`/settings`)

| Page / Component | Status | Notes |
| :--- | :--- | :--- |
| **Settings Page** | 🔲 | Admin profile & system settings |
| Admin Profile section | 🔲 | Display name, email (read-only dummy) |
| Change Password (UI only) | 🔲 | Form with current/new/confirm fields |
| Theme toggle (Light/Dark) | 🔲 | System-wide dark mode |
| ⚠️ Backend: password change | 🔒 💰 | Future phase |

---

## Phase 2 — Backend Integration (Future)

| Feature | Status | Notes |
| :--- | :--- | :--- |
| Convex schema: `members` table | 🔲 💰 | With upline/downline foreign keys |
| Convex schema: `invitations` table | 🔲 💰 | Token, email, status, expiry |
| Initial admin bootstrap | 🔲 💰 🔐 | Script or Convex dashboard seed |
| Auth: Password sign-in (live) | 🔲 💰 🔐 | JWKS + JWT_PRIVATE_KEY configured |
| Auth: Admin-only access control | 🔲 💰 🔐 | `ctx.auth.getUserIdentity()` checks |
| Invite flow: generate token | 🔲 💰 | Convex mutation creates invite record |
| Invite flow: email via Gmail | 🔲 💰 | `nodemailer` / Gmail app_password |
| Admin gives credentials to member | 🔲 💰 🔐 | Admin sets password for invitee |
| Org chart: live data | 🔲 💰 | Replace dummy seed with Convex query |
| Members list: live data | 🔲 💰 | Replace dummy array with useQuery |

---

## 📁 File Structure Plan

```
src/
├── components/
│   ├── auth/
│   │   └── SignInForm.tsx           🔲
│   ├── dashboard/
│   │   ├── AdminLayout.tsx          🔲
│   │   ├── Sidebar.tsx              🔲
│   │   └── TopHeader.tsx            🔲
│   ├── org-chart/
│   │   ├── OrgChartWorkspace.tsx    🔲
│   │   ├── OrgCardNode.tsx          🔲
│   │   └── orgChartData.ts          🔲  (dummy data seed)
│   ├── members/
│   │   ├── MembersTable.tsx         🔲
│   │   └── MemberDetailPanel.tsx    🔲
│   ├── invitations/
│   │   ├── InvitationsPage.tsx      🔲
│   │   └── InviteModal.tsx          🔲
│   └── ui/
│       ├── Badge.tsx                🔲
│       ├── Button.tsx               🔲
│       ├── Card.tsx                 🔲
│       ├── Input.tsx                🔲
│       └── Modal.tsx                🔲
├── pages/
│   ├── LoginPage.tsx                🔲
│   ├── OrgChartPage.tsx             🔲
│   ├── MembersPage.tsx              🔲
│   ├── InvitationsPage.tsx          🔲
│   └── SettingsPage.tsx             🔲
├── data/
│   └── dummyMembers.ts              🔲  (shared dummy dataset)
├── lib/
│   └── utils.ts                     🔲
├── App.tsx                          🚧  (Convex Auth template — needs update)
├── index.css                        🔲  (Design system CSS vars)
└── main.tsx                         ✅  (ConvexAuthProvider wired)
```

---

## 🗓️ Phase 1 Checklist — Quick Reference

- [x] Install `@xyflow/react`, `lucide-react`, `react-hot-toast`
- [x] Apply design system CSS variables (`index.css`)
- [x] Tailwind config: register HSL color tokens + gold secondary
- [x] Login Page — no sign-up, clean gold accent CTA
- [x] Admin Layout shell — Sidebar + Header
- [x] Dummy members dataset (`src/data/dummyMembers.ts`)
- [x] Org Chart canvas — ReactFlow with dummy tree
- [x] Member Card nodes — Name, Rank, gold highlight for root
- [x] Members list page — table with dummy data
- [x] Invite modal UI — email input + copy link (no backend yet)
- [x] Settings page skeleton — profile read-only view

---

*Last updated: 2026-04-30 | Phase 1 — Dummy Frontend*
