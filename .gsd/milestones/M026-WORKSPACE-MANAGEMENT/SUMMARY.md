# M026: Workspace Management

## Objective
Implement Workspace Management capabilities allowing designated Workspace Administrators (Admin Level 3) to modify team-specific metadata properly.

## Scope
1. Introduce a strict `adminLevel: 3` representing Workspace Admins.
   - Unlike Super Admins (Level 2), Workspace Admins are strictly scoped to only the teams they have joined.
2. Expose the `canManageWorkspace` capability to the mobile app for users matching this criteria on their active team.
3. Automatically promote designated seed users (`erwin.almendrala@gmail.com` for `teambechayerwinwin` and `sehun4244@gmail.com` for `default`) to Level 3.
4. Prepare the backend functions to secure edits to team names, slugs, and admin roles.
