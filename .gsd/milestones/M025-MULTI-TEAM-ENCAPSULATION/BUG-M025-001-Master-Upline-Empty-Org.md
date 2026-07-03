# Bug Report: Master Upline Org Chart Empty on First Login

## 🐛 The Issue
When a new team is created (e.g., `TeamBechayErwinWin`) with a designated Master Upline account (e.g., Erwin), the backend provisions a `users` record, a `teams` record, and attempts to initialize the `mobileProfiles` and `networkMembers` root nodes so the Master Upline has a valid top-level spot in the Org Studio.

However, when this newly provisioned Master Upline logs in for the first time, they successfully bypass the team-join step (as they are already in the team), but navigating to the **Org Chart / Org Studio** yields an empty chart with the warning:
> **"No org tree yet. Mobile-backed members have not loaded."**

## 🛑 Expected Behavior
The Master Upline should see themselves as the single root node (`isViewer: true`, role: `Master Upline`) in the Org Studio, from which they can begin inviting direct children under their team.

## 🔎 Technical Context & Suspected Causes
We have Multi-Team Encapsulation implemented. 
1. `listUnifiedNetworkMembers` (in `convex/network.ts` / `convex/networkMembers.ts`) filters network members by the user's `activeTeamId`.
2. When creating the team via `api.teams.createTeam` or internal CLI mutations, we manually insert a `mobileProfiles` record with the newly created `newUserId`, and a `networkMembers` record mapping to that `profileId` and `teamId`.

**Why might the Org Chart still be empty?**
- **Missing Required Indexes/Fields:** The `networkMembers` insertion in `teams.ts` might be missing a subtle required field for the root node, such as `parentMemberId: undefined` (or null), or the `status` string is not recognized by the specific client query.
- **`getMobileProfileForViewerOrThrow` Execution:** On the first real frontend login, the `mobile.ts` or `auth.ts` might be checking if the `mobileProfiles` exists. If it thinks the explicitly inserted profile is invalid (e.g., missing an auth identity mapping that happens automatically on real mobile app login), it might refuse to load the member, or perhaps it's incorrectly creating a second profile that has no members.
- **Frontend Query Filtration:** The Org Studio UI (e.g., `src/pages/dashboard/OrgChartPage.tsx` or similar) might be failing to locate the root node because `isViewer: true` combined with `parentMemberId === null` logic is failing to match the new `teamId` constraint.
- **`activeTeamId` Synching:** The frontend `TeamContext` might not be passing the `activeTeamId` correctly to the internal network queries, or the network queries are not referencing the correct `member.teamId`. 

## ✅ Resolution & Root Cause Analysis

The "Empty Org Chart" bug for new Master Uplines was caused by a sequential data cascade during the frontend authentication process, specifically related to how Convex Auth handles `authAccounts` and how the application automatically handles "bootstrapping" new users.

### The Chain of Failure:
1. **Deduplication Errors (`null._id` Crash):** During earlier testing, a duplicate `users` record was manually deleted. However, the associated `authAccounts` and `authSessions` in the Convex Auth hidden tables were *not* deleted.
2. **Auth Crash:** When the user attempted to sign in with their email, Convex Auth found the `authAccounts` record, looked up the `userId`, received `undefined` (because the user was deleted), and crashed with `Uncaught TypeError: Cannot read properties of null (reading '_id')`. This completely broke the frontend authentication flow before the application could generate secondary records.
3. **Ghost Node Disconnect:** When the `users` record was deleted/recreated, the **team** (`teams.masterUplineId`) and the **root network member** (`networkMembers.userId`) were left pointing to the old, deleted User ID.
4. **Bootstrap Mismatch:** When the user finally successfully signed up (generating a fresh, new `userId`), the `mobile:bootstrap` mutation automatically assigned them a new `mobileProfiles` ID. However, the existing `networkMembers` root node (provisioned for the team) was still hardcoded to the *deleted* user ID and an orphaned profile ID. 
5. **Team Binding Missing:** Although the user's `email` was correctly associated, their new user object's `activeTeamId` defaulted to the `default` team, rather than their structurally designated Master Upline team.

### How we fixed it:
*   **Auth Data Deep Clean:** We executed a one-off mutation (`teams:cleanupOrphanedAuth`) to safely iterate over `authAccounts` and dynamically delete any `authSessions`, `authRefreshTokens`, and `authAccounts` that reference non-existent `users`. This unblocked the `signUp` / `signIn` Convex Auth actions.
*   **Network Node Stitching:** We created a backend mutation (`teams:fixErwinTeamBinding`) with a comparison query (`teams:compareUsers`) to diagnose the deltas. It successfully:
    1. Reclaimed the orphaned Root Node (`networkMembers`) in the team's space.
    2. Overwrote the Root Node's `userId` and `profileId` to precisely match the newly authenticated user's `mobile:bootstrap` credentials.
    3. Explicitly updated the user's `activeTeamId` field so it scoped to the correct team.
    4. Spliced the Master Upline into `teamMemberships` with the `"admin"` role.

## 📝 Learnings & Recommendations
*   **Auth Ghost Data:** Deleting `users` manually is perilous in Convex Auth environments. If you delete a user during debugging, always ensure you clean up their `authAccounts` via script or the dashboard, otherwise you will soft-lock the login screen with vague TypeErrors upon future registration attempts for that email.
*   **Foreign Key Drift:** The `networkMembers`, `mobileProfiles`, and `users` tables are tightly coupled. Manual team provisioning scripts *must* cleanly link a user's `mobileProfile.userId` to their `networkMembers.profileId`.
*   **Role Constraint Checks:** Remember that `teamMemberships.role` is restricted to literal structural types (`"super_admin"`, `"admin"`, `"member"`). Overriding it casually with strings like `"owner"` will fail Convex's schema validation `v.union` definitions.
