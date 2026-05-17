# Sidebar Parity: Mobile (Flutter) vs. Desktop (React)

After a complete audit of the desktop `AdminLayout.tsx` and the mobile `dashboard_drawer.dart`, the vast majority of the 22+ modules are perfectly synced. Below are the only remaining discrepancies between the two platforms:

## 1. Missing in Mobile (Present in Desktop)
*   **Admin Sub-modules:** The desktop application has dedicated management views for `Academy Manager`, `Trade Monitor`, and `APK Management`. These are currently missing from the mobile Admin workspace.
*   **Support / Tools:** Desktop has a `Learn to Trade` module which is absent in Mobile.
*   **Social Feed (Placeholder):** Mobile has the button for Parity, but the `SocialFeedPage` does not exist yet (M016).

## 2. Missing in Desktop (Present in Mobile)
*   **Support / Tools:** Mobile has a `Help & Support` module which is absent in Desktop.

## 3. Structural Differences
*   **Finance Grouping:** Desktop nests Finance modules into accordions (`Banking & Assets`, `Ledger & Activity`, `Financial Planning`, `Analytics`). Mobile currently displays all 10 Finance modules as a flat, scrollable list.

## 3. Icon Parity
The mobile app has been updated to use the exact iconography specified in the Desktop UI for the matched items:
*   Home -> `Icons.home_rounded`
*   Org Chart -> `Icons.hub_rounded`
*   Members -> `Icons.groups_rounded`
*   Social Feed -> `Icons.movie_outlined` (Placeholder link added in Mobile)
*   Activity Feed -> `Icons.notifications_outlined`
*   Trading Signals -> `Icons.bolt_rounded`
*   Banking & Assets -> Collapsible section added in Mobile.
