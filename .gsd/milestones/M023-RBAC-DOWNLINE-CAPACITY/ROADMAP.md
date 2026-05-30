# M023: RBAC Downline Capacity Management

**Status:** `[pending]`\
**Created:** 2026-05-30\
**Last Updated:** 2026-05-30\
**Owner:** Luxurious Desktop / Convex Backend

## Objective

Add role-based org management with per-member direct downline capacity. Admins
need clear tiers, safe promotion/demotion, and fast control over how many direct
joined/prospect/to-invite/pending members each person can carry.

This milestone is docs/spec only until implementation begins.

## Decisions

- Global default direct capacity: `3`.
- Effective per-member capacity: `max(member.directLimitOverride ?? 3, currentDirectCount)`.
- If Marko Nogoy already has 12 direct members, his effective capacity is 12.
- Marko Nogoy is Level 2 admin.
- Maylyn is Level 1 admin.
- Capacity counts all direct child statuses: `joined`, `invited`, `pending`, and `to-invite`.
- Level 2 can edit/add downlines under any visible member.
- Level 1 can edit/add only members/prospects they created or own under their branch.

## Phase 1: Data Model & Backfill

- [ ] Extend `users` with admin tier metadata:
  - `adminLevel?: 0 | 1 | 2`
  - `adminAssignedBy?: Id<"users">`
  - `adminAssignedAt?: number`
- [ ] Extend `networkMembers` with capacity and ownership metadata:
  - `directLimitOverride?: number`
  - `createdByUserId?: Id<"users">`
  - `ownedByUserId?: Id<"users">`
- [ ] Add indexes needed for ownership checks and admin screens:
  - `networkMembers.by_createdByUserId`
  - `networkMembers.by_ownedByUserId`
- [ ] Backfill existing members:
  - `createdByUserId` from linked owner where safe.
  - `ownedByUserId` from viewer/profile owner where safe.
  - No destructive changes.
- [ ] Seed Marko Nogoy as Level 2 and Maylyn as Level 1 by stable identity.

## Phase 2: Backend Authorization

- [ ] Replace broad `role === "admin"` checks with helper functions:
  - `getAdminLevel(ctx)`
  - `requireAdminLevel(ctx, minLevel)`
  - `canManageMember(ctx, viewer, member)`
  - `getEffectiveDirectLimit(member, currentDirectCount)`
- [ ] Level 2 permissions:
  - Promote/demote Level 1 admins and members.
  - Manage any visible member.
  - Set per-member capacity overrides.
- [ ] Level 1 permissions:
  - Add/edit only owned or self-created members/prospects.
  - Cannot promote/demote admins.
  - Cannot change capacity overrides.
- [ ] Members:
  - No admin management rights.
  - Can only view allowed org data.
- [ ] Enforce capacity in all parent-changing mutations:
  - Add member.
  - Invite/prospect creation.
  - Reassign parent.
  - Delete reconnect mode.
  - Status changes that affect active direct capacity.

## Phase 3: Desktop Admin UX

- [ ] Add capacity indicators to org cards and inspector:
  - `currentDirectCount / effectiveDirectLimit`.
  - Status breakdown: joined, invited, pending, to-invite.
- [ ] Add Level 2 controls:
  - Promote/demote admin level.
  - Set per-member direct capacity override.
  - Edit/add under any visible member.
- [ ] Add Level 1 constraints:
  - Hide or disable actions outside owned/self-created scope.
  - Show clear read-only reason, not silent failure.
- [ ] Keep existing visual style and layout. No redesign.

## Phase 4: Mobile Parity

- [ ] Expose admin tier, ownership, effective limit, and capacity breakdown via mobile-safe API payloads.
- [ ] Update Flutter org chart add/edit permission checks.
- [ ] Keep mobile behavior aligned with backend authorization, not client trust.

## Phase 5: Validation

- [ ] Add focused Convex tests for authorization and capacity.
- [ ] Test Marko Level 2 can manage any visible member and promote/demote.
- [ ] Test Maylyn Level 1 can manage only owned/self-created members.
- [ ] Test member cannot bypass capacity via add, reassign, reconnect, or status update.
- [ ] Test member with 12 current directs and default 3 still has effective limit 12.
- [ ] Run `npx convex codegen`.
- [ ] Run `npm run lint`.

## Acceptance Criteria

- Backend is source of truth for RBAC and capacity.
- Level 2 admin can manage any visible member and assign Level 1 admins.
- Level 1 admin can manage only own/self-created additions.
- Default direct limit is 3, but existing over-limit members are not blocked until they exceed their effective current count.
- Desktop displays capacity clearly.
- Mobile receives enough fields for parity.
- Existing members and org tree continue working without data loss.
