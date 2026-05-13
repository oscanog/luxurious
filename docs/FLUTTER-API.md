# Luxurious Mobile API Reference

This document tracks the Flutter transport path used during **M007: Backend Integration**.

## Transport Model

Flutter talks to Convex through plain HTTP JSON routes.

- Base URL: `https://polished-eagle-138.convex.site`
- Healthcheck: `GET /health`
- Auth Sign-In: `POST /mobile/auth/sign-in`
- Auth Refresh: `POST /mobile/auth/refresh`
- Auth Session: `GET /mobile/auth/session`
- Auth Sign-Out: `POST /mobile/auth/sign-out`
- Query RPC: `POST /mobile/query`
- Mutation RPC: `POST /mobile/mutation`

## Identity Model During M008

- Flutter signs in through Convex Auth password flow.
- Flutter stores access token + refresh token in `SharedPreferences`.
- Mobile HTTP routes require `Authorization: Bearer <token>`.
- Convex derives logged-in user server-side, then bootstraps/loads that user's `mobileProfiles` record.
- Org chart, members, and finance data are now auth-bound per logged-in user.
- `viewerKey` is legacy bridge state. Keep only for old migrated rows, not new mobile client calls.

## Request Shape

### Auth Sign-In

```json
{
  "email": "alice@luxurious.trade",
  "password": "password123"
}
```

### Query

```json
{
  "name": "financials:listAccounts",
  "args": {}
}
```

### Mutation

```json
{
  "name": "transactions:createExpense",
  "args": {
    "amount": 42.5,
    "category": "Food",
    "note": "Lunch"
  }
}
```

### Response

```json
{
  "result": {}
}
```

### Required Header For Session / Query / Mutation

```text
Authorization: Bearer <token>
```

## Healthcheck

### `GET /health`

Returns backend availability.

Example response:

```json
{
  "status": "ok",
  "timestamp": 1747040000000
}
```

## Mobile Query Names

### `mobile:status`
- Returns bootstrap status for current authenticated user.

### `financials:listAccounts`
- Returns mobile financial accounts.

### `financials:getCashflow`
- Returns monthly inflow/outflow aggregation plus totals.

### `financials:listCurrencies`
- Returns currency reference list used by `CurrencyPage`.

### `planning:getOverview`
- Returns budgets, debts, and installments in one payload.

### `planning:getBudgets`
- Returns budget cards with current spend.

### `planning:getDebts`
- Returns debt tracker rows.

### `planning:getInstallments`
- Returns installment schedule rows.

### `analytics:getStatistics`
- Returns summary metrics and expense breakdown.

### `network:getDashboard`
- Returns network-first home payload:
  - viewer summary
  - joined / invited / pending / to-invite stats
  - uplines / downlines counts
  - direct members list
  - org chart tree

### `network:getTree`
- Returns org chart tree nodes for the network view.

### `network:listMembers`
- Returns network members for the members screen.
- Optional args:
  - `status` = `joined` | `invited` | `pending`

### `profile:getMe`
- Returns authenticated profile data:
  - display name
  - email
  - role
  - optional identity fields
  - joined downline count
  - derived rank + frame
  - avatar editor state
  - verification flags

### `profile:getRank`
- Returns joined-downline count plus derived rank metadata only.

### `transactions:listHistory`
- Returns recent transaction history.
- Optional args:
  - `limit`

## Mobile Mutation Names

### `mobile:bootstrap`
- Ensures mobile profile and seed data exist.

### `financials:createAccount`
- Creates a mobile financial account.
- Args:
  - `name`
  - `institution`
  - `type`
  - `openingBalance`
  - `currencyCode` optional

### `transactions:createIncome`
- Persists income and updates default account balance.
- Args:
  - `amount`
  - `category`
  - `note` optional
  - `occurredAt` optional

### `transactions:createExpense`
- Persists expense and updates default account balance.
- Args:
  - `amount`
  - `category`
  - `note` optional
  - `occurredAt` optional

### `profile:updateMe`
- Updates profile fields for current authenticated user.
- Args:
  - `displayName` optional
  - `birthday` optional
  - `bonchatId` optional
  - `bonchatUsername` optional
  - `yepbitId` optional
  - `yepbitUsername` optional

### `profile:updateAvatar`
- Saves avatar editor state for current authenticated user.
- Args:
  - `filter` = `natural` | `gold` | `cool` | `mono`
  - `mirrored`
  - `offsetX`
  - `offsetY`
  - `rotationQuarterTurns`
  - `scale`

### `profile:changePassword`
- Changes current authenticated user's password.
- Invalidates existing sessions after success.

## Current M007 Coverage

Wired now:
- Network dashboard
- Org chart
- Members
- Accounts
- Cashflow
- Currency
- Income Entry
- Expense Entry
- Budgets
- Debt Tracker
- Installments
- Statistics
- History

Still pending audit:
- Receipt Scanner
- Productivity screens
- Promotions
- Legacy academy/admin/org transport unification

## Recommendation

Do not route new Flutter mobile identity through `viewerKey`. Use authenticated mobile routes only.

## M008 Profile Notes

Implemented now:
- `profile:getMe`
- `profile:updateMe`
- `profile:updateAvatar`
- `profile:changePassword`
- `profile:getRank`

Current avatar model:
- editor state stored in Convex
- binary image still device-local on Flutter side

Current verification model:
- `emailVerified` reflects auth user email verification timestamp
- `phoneCertified` reflects auth user phone verification timestamp
- delivery / OTP flows still future work

Rank must be derived from **joined downlines only**. Invited, pending, and prospect records must not count.

## Production Deploy Gotcha

Flutter mobile auth uses production host:

```text
https://polished-eagle-138.convex.site
```

If you change mobile auth or HTTP routes in `convex/http.ts`, deploy backend changes to production before testing Flutter login:

```powershell
cd C:\projects\convex\luxurious
$env:CONVEX_DEPLOYMENT='prod:polished-eagle-138'; npx convex deploy --typecheck enable --message "M008 mobile auth routes and dashboard split"
```

If you forget, server can return plain text:

```text
No matching routes found
```
