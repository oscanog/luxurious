# Auth Reset Dart Verification - 2026-05-31

## Result

Status: passed.

This test used a standalone Dart script at `C:\tmp\auth_reset_flow_test.dart`.
It called the same production mobile HTTP endpoints used by Flutter:

- `POST /mobile/auth/sign-in`
- `GET /mobile/auth/session`
- `POST /mobile/query`
- `POST /mobile/mutation`
- `POST /mobile/auth/sign-out`

Backend target:

`https://polished-eagle-138.convex.site`

## Flow Tested

1. Signed in as Marko Nogoy.
   - Email: `sehun4244@gmail.com`
   - Result: success.
2. Loaded `network:getDashboard`.
3. Found Melvin Nogoy in dashboard members.
   - Member id: `md7fd4nxhvh3h0bc2q2seb9ags86xnxj`
4. Called `networkMembers:resetMemberPassword`.
   - Backend returned email: `melvin.billionaire@gmail.com`
   - Temporary password generated, not stored in this document.
5. Signed out Marko Nogoy.
6. Tried sign-in with wrong email `m.viner001@gmail.com` and new temporary password.
   - Result: failed as expected.
7. Tried sign-in with returned email `melvin.billionaire@gmail.com` and same temporary password.
   - Result: success.
   - Session loaded as Melvin Nogoy.
8. Signed out Melvin Nogoy.

## Conclusion

Dart-level mobile backend flow works.

Flutter should work if user enters exact reset email:

`melvin.billionaire@gmail.com`

Flutter will fail if remembered email remains:

`m.viner001@gmail.com`

## Mistake Confirmed

The issue is not password reset failure. The issue is email mismatch after reset.

The reset password belongs to the account email returned by backend. It does not work with an old remembered email.

## Mobile Retest Instruction

On phone:

1. Clear remembered email/password.
2. Enter `melvin.billionaire@gmail.com`.
3. Enter latest temporary password from Dart test output.
4. Sign in.
5. Change password in Profile.
6. Sign out.
7. Sign in with `melvin.billionaire@gmail.com` and new password.

Do not use `m.viner001@gmail.com` unless admin changes Melvin's login email first.
