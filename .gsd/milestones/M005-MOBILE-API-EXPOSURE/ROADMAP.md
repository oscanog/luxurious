# Milestone M005: Mobile API Exposure

**Status:** `[planning]`
**Start Date:** 2026-05-12
**Objective:** Prepare, harden, and expose Convex APIs specifically for consumption by the Flutter mobile application.

## Success Criteria

1. [ ] Health check endpoint verified in production.
2. [ ] Authentication flows (Mobile-friendly) implemented.
3. [ ] Core Data synchronization queries (Users, Trades) optimized for mobile.
4. [ ] Real-time subscription tests for mobile clients.

## Roadmap

### Slice S01: Infrastructure & Health
**Status:** `[planning]`
- [ ] T01: Verify `http.ts` /health endpoint visibility for mobile clients.
- [ ] T02: Document mobile-specific CORS/Auth requirements in `docs/FLUTTER-API.md`.
- [ ] T03: Set up mobile-specific environment variables in Convex Dashboard.

### Slice S02: User & Auth Hardening
**Status:** `[planning]`
- [ ] T01: Create `api.users.mobileViewer` with minimal payload for faster mobile loads.
- [ ] T02: Implement device-token tracking for future push notifications.
- [ ] T03: Audit `@convex-dev/auth` flows for mobile deep-linking compatibility.

### Slice S03: Simulation & Trading API
**Status:** `[planning]`
- [ ] T01: Batch query for `getWallet` + `getOpenTrades` to reduce mobile RTT.
- [ ] T02: Mobile-optimized price feed query (lower tick frequency).
- [ ] T03: Simulation order validation rules for mobile clients.
