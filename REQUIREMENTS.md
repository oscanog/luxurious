# Requirements
Capability contract.

## 1. Product Parity
- [x] Desktop default flow mirrors mobile shell and page hierarchy.
- [x] Desktop labels stay familiar to mobile users.
- [x] Desktop preserves mobile quick-access paths for Home, Org Chart, Alerts, and Profile.
- [x] Desktop keeps badge semantics for unread notifications and active promotions.

## 2. Auth & Session
- [x] Login/logout (Convex Auth).
- [x] Protected routes (Auth only).
- [ ] Role-based access (RBAC).
- [x] Post-login bootstrap ensures mobile profile-backed data exists for web user.
- [x] Theme preference persists before and after login.
- [x] Auto-redirect to login when token/session is invalid on authenticated pages.

## 3. Dashboard Home
- [x] Network-first signed-in landing page.
- [x] Desktop home top bar, headline, owl hero card, and 2x2 stat grid match mobile hierarchy.
- [ ] Backend health + refresh affordance.
- [x] Hero summary, stats, org summary, and direct members cards.
- [x] Quick links into org chart, feed, and profile.

## 4. Network
- [x] Visualize hierarchy.
- [x] Member sidebar quick assignment.
- [x] Connection dialog from visible canvas.
- [x] Reconnect handle for broken link recovery.
- [ ] Connection tracking support.
- [ ] Drag-drop reorg interactions.
- [ ] Dynamic root focus parity language.
- [x] Members filters aligned with mobile statuses.
- [x] Feed page with mark-all-read behavior.
- [x] Show unconnected users (no upline to Alice) in sidebar for quick onboarding.
- [x] Interactive tool catalog documented in `INTERACTIVE-TOOLS.md`.
- [x] Verification pass: confirm all tools work end-to-end with seed data.

## 5. Profile + Engagement
- [x] Dedicated profile page with identity fields, rank, avatar state, verification state.
- [x] Promotions page with CTA links.
- [x] Notification summary visible in shell.
- [x] Password change flow with re-auth handling.

## 6. UI/UX
- [x] Responsive layout.
- [x] Light mode parity.
- [x] Dark mode.
- [x] Real-time updates.
- [x] Desktop top navbar absorbs home sync controls and keeps user dropdown in-shell.
- [x] Desktop shell brand card uses mobile-aligned solid blue field instead of desktop-only radial gradient treatment.
- [ ] Feedback on actions across new pages.
- [x] Sidebar groups match mobile taxonomy: Network, Finance, Support, Admin, Profile, Settings.
- [x] Finance and planning pages exist for desktop parity routes.
- [ ] Support placeholder utilities expanded beyond parity shells where product requires full behavior.

## Out of Scope
- Public landing page.
- Desktop-only information architecture fork.
- Removing advanced org-chart/admin capabilities that already work.
