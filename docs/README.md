# Luxurious — Project Documentation

> **Version:** 0.1.0 — Phase 1 (Frontend Dummy UI)
> **Stack:** React + Vite + Convex + Convex Auth + Tailwind CSS v4 + `@xyflow/react`

---

## 📖 What is Luxurious?

**Luxurious** is a management system for a crypto trading group. It allows an admin to manage members organized in an **upline/downline** hierarchy — visualized as an interactive organizational chart.

### Core Concepts

- **Upline**: A member who introduced or sponsors another member.
- **Downline**: Members under an upline. Can be multi-level deep.
- **Admin**: The sole system operator. Manages all members, invitations, and credentials.
- **Member**: A non-admin trading group participant. Cannot self-register.

---

## 📄 Documentation Index

| File | Description |
| :--- | :--- |
| [`design-system.md`](./design-system.md) | Color palette, typography, component styling tokens |
| [`page-tracker.md`](./page-tracker.md) | All pages & features with implementation status |

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development (Convex + Vite)
npm run dev
```

---

## 🗂️ Project Structure

```
luxurious/
├── convex/                     Convex backend functions
│   ├── auth.config.ts          JWT/JWKS auth config
│   ├── auth.ts                 Convex Auth providers
│   ├── http.ts                 Auth HTTP endpoints
│   ├── schema.ts               Database schema (Phase 2)
│   └── myFunctions.ts          Sample functions (template)
├── docs/                       Project documentation
│   ├── README.md               ← You are here
│   ├── design-system.md        Design tokens & theming
│   └── page-tracker.md         Feature & page progress tracker
├── src/                        React frontend
│   ├── components/             Reusable UI components
│   ├── pages/                  Page-level components
│   ├── data/                   Dummy data seeds
│   ├── lib/                    Utilities
│   ├── App.tsx                 Root routing
│   ├── index.css               Global styles + CSS variables
│   └── main.tsx                App entry (ConvexAuthProvider)
├── public/                     Static assets
├── .env.local                  Environment variables (gitignored)
└── package.json
```

---

## 🔐 Authentication Rules

| Rule | Detail |
| :--- | :--- |
| No public sign-up | Members cannot register themselves |
| No new admin sign-up | New admin accounts are not self-created |
| Admin provides credentials | Admin creates/invites members manually |
| Single initial admin | One root admin account bootstrapped at setup |
| Future: Gmail verification | Gmail app_password for admin email notifications |
| Provider | Convex Auth — Password provider |
| Keys | `JWKS` + `JWT_PRIVATE_KEY` set in Convex dashboard env vars |

---

## 🌐 Pages Overview

| Route | Page | Access |
| :--- | :--- | :--- |
| `/` | Login | Public |
| `/org-chart` | Interactive Org Chart | Admin only |
| `/members` | Members List | Admin only |
| `/invitations` | Manage Invitations | Admin only |
| `/settings` | Admin Settings | Admin only |

---

## 🎨 Design Highlights

- **Brand Colors:** Primary Blue + **Gold Secondary** (replacing violet from reference project)
- **Dark Mode:** Full dark mode support via CSS custom properties
- **Org Chart:** ClickUp-inspired `@xyflow/react` canvas with custom member card nodes
- **Typography:** Geist / Inter font stack with precise tracking and weight scale
- **Gold Usage:** Top-tier member cards, rank badges, premium CTAs

---

## 📦 Key Dependencies

| Package | Purpose |
| :--- | :--- |
| `convex` | Backend-as-a-service, real-time DB |
| `@convex-dev/auth` | Authentication (Password provider) |
| `@convex-dev/agent` | AI agent capabilities (future use) |
| `@xyflow/react` | Org chart canvas (to install) |
| `lucide-react` | Icon library (to install) |
| `react-hot-toast` | Toast notifications (to install) |
| `tailwindcss` v4 | Utility-first CSS |

---

*Last updated: 2026-04-30 | Phase 1 — Dummy Frontend*
