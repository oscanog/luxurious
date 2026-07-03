# M025: Multi-Team Encapsulation

**Status:** `[completed]`\
**Created:** 2026-07-03\
**Last Updated:** 2026-07-03\
**Owner:** Luxurious Desktop / Convex Backend

## Objective

Introduce a **team (tenant)** concept so the platform can host multiple independent
network trees. Users enter a "server-like address" (team slug) on the homepage to
join a team. Each team has its own master upline, network hierarchy, and scoped data.

Current state: all data is global, scoped only by `profileId`/`userId`.
Target state: `Team → Master Upline → Downlines`, with team-scoped isolation.

## Decisions

- Team identifier is a **slug** (lowercase, hyphens): e.g. `luxxurious-team`.
- On homepage, unauthenticated or teamless users see a **join modal** to enter team slug.
- Super admins (`adminLevel: 2`) can view all teams' data.
- Admins (`adminLevel: 1`) and master uplines see only their own joined team.
- Regular members see only their joined team.
- Personal finance data (accounts, budgets, debts, installments) stays **per-profile**, not team-scoped.
- Network data (`networkMembers`, `memberAssets`, `invitations`) becomes **team-scoped**.
- Existing data is migrated into a single default team. No data loss.
- A user can belong to multiple teams but views one at a time (active team).
- Super Admins have a dedicated UI to create a new team (slug, name) and explicitly create/invite the master upline user with a set login account.

## Phase 1: Data Model

- [x] Add `teams` table to schema:
  - `name`, `slug`, `description`, `createdBy`, `masterUplineId`, `isDefault`
  - Index: `by_slug`, `by_isDefault`
- [x] Add `teamMemberships` table to schema:
  - `teamId`, `userId`, `role` (super_admin | admin | member), `joinedAt`
  - Indexes: `by_userId`, `by_teamId_and_userId`, `by_teamId_and_role`
- [x] Add `teamId: v.optional(v.id("teams"))` to `networkMembers`
  - Index: `by_teamId`
- [x] Add `activeTeamId: v.optional(v.id("teams"))` to `users` table
- [x] Run `npx convex dev` to validate schema push

## Phase 2: Backend — Team CRUD & Join

- [x] Create `convex/teams.ts`:
  - `createTeam` mutation (super_admin only) — creates team with slug, name, and initializes master upline account login.
  - `getTeamBySlug` query — public lookup for join flow
  - `joinTeam` mutation — validates slug, creates membership
  - `getMyTeams` query — returns user's team list
  - `getActiveTeam` query — returns current active team
  - `setActiveTeam` mutation — switches active team context
- [x] Write migration mutation `migrateToDefaultTeam`:
  - Creates default team (slug: `luxxurious-team`, master upline: Marko Nogoy)
  - Creates `teamMemberships` for all existing users
  - Stamps `teamId` on all existing `networkMembers`

## Phase 3: Backend — Access Control

- [x] Add `requireTeamMembership(ctx, teamId)` to `orgAccess.ts`
- [x] Update `canManageMember` / `canAddUnderParent` — team membership check
- [x] Super admins (Level 2) bypass team restrictions
- [x] Update `mobile.ts` `status` query — include `activeTeamId`, `teams[]`
- [x] Update `mobile.ts` `bootstrap` — auto-join default team if no memberships
- [x] Update `network.ts` queries (`getDashboard`, `getOrgTree`, tree builders):
  - Derive `teamId` from active team
  - Filter `networkMembers` by `teamId`
- [x] Update `inviteMember` — stamp `teamId` on new members
- [x] Update `mobileHelpers.ts` `listUnifiedNetworkMembers` — team-aware

## Phase 4: Frontend — Team Join Modal

- [x] Create `TeamJoinModal.tsx`:
  - Input field for server address (team slug)
  - Backend validation → show team name + join button
  - Premium glassmorphism design, dark mode compatible
- [x] Create `TeamContext.tsx` — React context for `activeTeamId`, `teams[]`
- [x] Update `App.tsx`:
  - After auth + bootstrap, check team memberships
  - No teams → show `TeamJoinModal`
  - Has teams → show dashboard with active team context
- [x] Update `DashboardHomePage` — show active team name in hero
- [x] Create Super Admin UI for Team Creation:
  - Form for team name, team slug (server address).
  - Form fields for new Master Upline account (email, initial password, name).
  - Triggers `createTeam` to handle both team generation and user account creation.

## Phase 5: Validation

- [x] `npx tsc --noEmit` passes
- [x] `npx convex dev` pushes schema cleanly
- [x] Manual test: new user sees join modal, enters slug, joins team
- [x] Manual test: dashboard shows team-scoped network data
- [x] Manual test: super admin can view all teams and create a new team + master upline.
- [x] Manual test: migration wraps existing data into default team
- [x] Existing org chart and member CRUD still works

## Acceptance Criteria

- Every network tree is scoped to a team.
- Users see a team join modal before accessing dashboard.
- Team slug acts as the "server address" identifier.
- Super admins can view all teams; admins/members see only their joined team.
- Existing data is seamlessly migrated into a default team with no loss.
- Personal finance data remains per-profile, unaffected by team scoping.
- Mobile API payloads include team context for future parity.
