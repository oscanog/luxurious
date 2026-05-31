# Auth temp password ambiguous character incident - 2026-05-31

## Summary

Mobile sign-in failed after Marko generated credentials for Melvin because the temporary password contained the digit `0`. That character can be mistaken for the letter `O` when copied manually from the credential dialog.

## What happened

- Generated credential used a target member email.
- Backend sign-in succeeds when the exact generated password is used.
- Backend sign-in fails when the digit `0` is typed as letter `O`.
- Before the fix, the mobile HTTP sign-in route could return a generic server error for bad password attempts, making Flutter show an unhelpful `Sign-in failed` message.

## Root cause

The temporary password generator allowed ambiguous digits `0` and `1`. The letter set already avoided confusing letters, but the digit set did not.

## Fix

- Temporary passwords now use digits `2-9` only.
- Mobile sign-in catches auth rejection and returns `401 Invalid credentials` instead of a backend server error.

## Verification

- Exact generated credential signs in through `/mobile/auth/sign-in`.
- Same password with letter `O` instead of digit `0` is rejected with `401`.

## Learning

Temporary credentials must avoid ambiguous characters because users often type them manually from screenshots, chat, or copied dialogs.
