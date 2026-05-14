# Frontend Module Implementation Tracker

Tracking static, unfinished, and placeholder modules in the Luxurious Dashboard to prioritize GSD milestones.

## 🔴 Static / Placeholder (Unfinished)
- None. (Core Desktop Parity Achieved)

## 🟡 Partial / Dummy Data
These pages have UI but rely on local mock data instead of full Convex integration for certain features.

| Module | File | Static Parts | Goal |
| :--- | :--- | :--- | :--- |
| **Academy** | `AcademyPage.tsx` | Seed data required | Full CMS parity |

## 🟢 Fully Dynamic (Integrated)
These modules are fully connected to Convex and feature interactive desktop-native UX.

- **Dashboard Home**: Full profile/stat integration.
- **Org Chart**: Full hierarchy CRUD with interactive tools.
- **Members**: Interactive table with real-time filters.
- **Activity Feed**: Infinite scroll with backend feed aggregation.
- **Finance (All)**: Accounts, Cashflow, Currency, History, Statistics, Budgets, Debt, Installments.
- **Profile**: Full identity management with password re-auth and consolidated system settings.
- **Invitations**: Full link management, revoke, and resend tracking.
- **Calendar**: Agenda view synced with planning events.
- **Learn to Trade**: Live Binance feed + persistent trade history + sim wallet.
- **Receipt Scanner**: Dynamic upload + scan tracking.
- **Shopping List**: Full CRUD with priority levels.
- **Support Center**: Ticketing system with live status.

---

## 🛠️ Global TODOs (Meticulous Scan)
- [x] **Feedback System**: Implement global toast/notification for all successful table/form actions.
- [x] **Settings Refactor**: Consolidate `SettingsPage.tsx` into `ProfilePage.tsx` or link them properly.
- [x] **Search Consistency**: Ensure all table views have the same search/filter UX as the `MembersPage`.
- [x] **Backend Refresh**: Add "Pull to refresh" or manual refresh triggers for financial metrics.
