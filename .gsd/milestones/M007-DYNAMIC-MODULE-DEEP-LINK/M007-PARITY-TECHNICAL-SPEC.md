# M007: Mobile Parity Technical Specification

**Objective:** Sync the mobile app with the new dynamic backend modules implemented in M007.

## 1. Backend RPC Changes (Desktop Repo)
The following RPCs have been added or updated in `convex/http.ts` but may not be fully utilized in mobile yet.

### Queries
| RPC Name | Backend Function | Description |
| :--- | :--- | :--- |
| `invitations:list` | `api.invitations.list` | List all invites sent by the user. |
| `planning:getSchedule` | `api.planning.getSchedule` | Fetch agenda/calendar items. |
| `receipts:list` | `api.receipts.list` | Fetch scanned receipts. |
| `shopping:list` | `api.shopping.list` | Fetch active shopping list items. |
| `support:listTickets` | `api.support.listTickets` | Fetch user's support tickets. |
| `academy:list` | `api.academy.list` | List all available courses. |

### Mutations
| RPC Name | Backend Function | Args | Description |
| :--- | :--- | :--- | :--- |
| `invitations:create` | `api.invitations.create` | `{ email: string }` | Send a new invitation. |
| `invitations:revoke` | `api.invitations.revoke` | `{ id: Id }` | Revoke a pending invite. |
| `shopping:create` | `api.shopping.create` | `{ text: string, priority: string }` | Add item to shopping list. |
| `shopping:toggle` | `api.shopping.toggle` | `{ id: Id }` | Toggle item completion. |
| `shopping:delete` | `api.shopping.delete` | `{ id: Id }` | Remove item from list. |
| `support:createTicket` | `api.support.createTicket`| `{ subject: string, body: string }` | Open a new support ticket. |

## 2. Mobile Client Integration (`c:\projects\luxurious-mobile\app`)

### Step 1: Update `ConvexClient`
Add the following prefixes to `_mobilePrefixes` in `lib/src/core/convex/convex_client.dart`:
- `invitations:`
- `receipts:`
- `shopping:`
- `support:`
- `academy:`

### Step 2: Implementation Tasks
1. **Invitations**: Replace `_legacyQuery` logic with live RPC calls in `InvitationsPage`.
2. **Shopping List**: Implement CRUD operations using the new `shopping:*` mutations.
3. **Support Center**: Connect the support UI to `support:createTicket` and `support:listTickets`.
4. **Calendar**: Sync `CalendarPage` with `planning:getSchedule`.
5. **Academy**: Move from mock courses to `academy:list` and `academy:get`.

## 3. Flow Verification
- [ ] User sends invite on mobile -> Invite appears in desktop list.
- [ ] User adds shopping item on desktop -> Item appears in mobile list.
- [ ] User opens support ticket on mobile -> Admin sees it in desktop admin panel.
