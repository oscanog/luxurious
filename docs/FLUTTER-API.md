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
- Returns network dashboard data for the mobile home.

### `network:getTree`
- Returns the org chart tree.

### `network:listMembers`
- Returns member rows.
- Optional args:
  - `status`

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

## Current M007 Coverage

Wired now:
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
