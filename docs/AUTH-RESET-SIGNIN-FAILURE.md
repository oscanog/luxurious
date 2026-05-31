# Auth Reset Sign-In Failure

## Incident

Boss could not sign in after admin reset from mobile org chart. Mobile showed `Sign-in failed.` after reset credentials were shown.

## What Happened

The reset was done while signed in as the admin account. That is admin account context, not necessarily target login.

The reset dialog generated credentials for the target member. Screenshot showed the target member login email.

The failed login screenshot showed a different email in the login field. App had "Remember password" enabled, so old remembered email stayed in field. New temporary password was paired with old remembered email, so Convex Auth rejected sign-in.

## Why Bug Occurred

Primary cause: credential mismatch.

- Reset created a new password for actual target account.
- Login form still contained old remembered email.
- User changed password field but did not change email field to reset dialog email.
- Backend correctly returned invalid credentials because email and password did not belong to same auth account.

Secondary backend risk found:

- `networkMembers.resetMemberPassword` used `users.email` as login id.
- If `users.email` and `authAccounts.providerAccountId` ever drift, reset could update or report wrong login email.
- Backend now reads actual password auth account id before resetting, so returned email is actual sign-in id.

## Code Fix

Changed backend:

- `convex/networkMembers.ts`
  - `getMemberAuthInfo` now resolves target login email from `authAccounts` for provider `password`.
  - Reset returns normalized actual password login id.
- `convex/http.ts`
  - Mobile sign-in now trims and lowercases email server-side.

## User Fix

On boss phone:

1. Clear old remembered login email from sign-in form.
2. Use email shown in reset dialog.
3. Use password shown in reset dialog.
4. Disable "Remember password" until first successful login, or overwrite remembered credentials after login.

Do not use admin account email when signing in as target user.

## Follow-Up

Mobile UX should clear remembered password when a reset invalidates session, or show a stronger warning: "Use this exact email with this password."
