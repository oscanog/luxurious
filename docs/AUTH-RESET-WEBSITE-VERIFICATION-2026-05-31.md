# Auth Reset Website Verification - 2026-05-31

## Result

Status: success for actual reset credential, failed for wrong remembered email.

Website verified on local frontend at `http://localhost:5173` against Convex deployment `polished-eagle-138`.

## Flow Tested

1. Logged in as Marko Nogoy.
   - Email used: `sehun4244@gmail.com`
   - Role shown: Admin workspace
2. Opened Org Chart.
3. Searched for `Melvin Nogoy`.
4. Opened Security tab.
5. Reset Melvin Nogoy password.
6. Credential card appeared.
   - Email returned by backend: `melvin.billionaire@gmail.com`
   - Password returned: generated temporary password, masked in this file.
7. Signed out Marko Nogoy.
8. Tried requested email `m.viner001@gmail.com` with the new temporary password.
   - Result: failed with `Invalid email or password`.
9. Tried actual returned email `melvin.billionaire@gmail.com` with the same temporary password.
   - Result: success.
   - Dashboard loaded as Melvin Nogoy.

## Finding

The reset flow is working. The login account for Melvin Nogoy is currently:

`melvin.billionaire@gmail.com`

The email `m.viner001@gmail.com` is not the password-login account returned by reset, so it cannot sign in with Melvin Nogoy's reset password.

## Mistake Found

We were mixing two different emails:

- Reset credential email: `melvin.billionaire@gmail.com`
- Old/requested login email: `m.viner001@gmail.com`

Password reset is tied to the auth account email. New password only works with the exact email returned by the credential dialog.

## Learning

If reset password works on website, Flutter should work too because both use the same Convex Auth account and backend. Flutter can still fail if the login form keeps an old remembered email. User must clear remembered email and enter the exact reset email.

## Mobile Retest Instruction

On Flutter:

1. Clear remembered email/password if old email appears.
2. Enter `melvin.billionaire@gmail.com`.
3. Enter the temporary password from the reset dialog.
4. Sign in.
5. Change password from Profile.
6. Sign out and sign in again with the new password.

Do not use `m.viner001@gmail.com` unless the account email is changed first through Change Email.
