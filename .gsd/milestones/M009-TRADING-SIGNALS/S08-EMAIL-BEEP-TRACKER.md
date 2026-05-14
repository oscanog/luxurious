# S08 Tracker: Email Beep Feature

## Requirements
- When an admin hovers/clicks in a time cell (e.g. 3pm), a dialog should appear.
- The dialog should contain a dynamic initial message for beeping the specific app_user.
- Send the email using `nodemailer` and Gmail app passwords.
- Implement the email sending as a Convex Action.

## Implementation Steps
- [x] Install `nodemailer` and `@types/nodemailer`.
- [x] Create Convex action `convex/email.ts` with `"use node"` directive to send emails using `nodemailer` and Gmail app password `pcgwepxuxpnydgdr`.
- [x] Update `getDailyAttendance` query in `convex/participation.ts` to include user's `email`.
- [x] Add Mail, Clipboard, Check icons and `useAction` to `TradingSignalsPage.tsx`.
- [x] Implement `BeepUserDialog` component to handle message input, optional signal code, and sending.
- [x] Add paste button with success feedback to signal code input.
- [x] Style email body with dark mode blue theme, logo, mascot, and footer.
- [x] Convert images to WebP for email deployment.
- [x] Fix `npm audit` vulnerabilities by updating `nodemailer`.
- [x] Run `npx convex codegen` and `npx convex dev`.
- [x] Update `TECHNICAL-SPEC.md` and `ROADMAP.md`.

## Manual Setup Notes
- The Convex action expects `GMAIL_USER` and `GMAIL_APP_PASSWORD` environment variables.
- Currently, it falls back to the password provided (`pcgwepxuxpnydgdr`) and a generic email (`your-email@gmail.com`). 
- **ACTION REQUIRED**: Set your actual Gmail address in Convex environment variables:
  `npx convex env set GMAIL_USER your.email@gmail.com`
  `npx convex env set GMAIL_APP_PASSWORD pcgwepxuxpnydgdr`
