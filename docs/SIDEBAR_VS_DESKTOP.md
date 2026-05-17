# Sidebar Parity: Mobile (Flutter) vs. Desktop (React)

This document outlines the differences between the pages available in the Desktop sidebar and the Mobile application drawer.

## 1. Missing in Mobile (Present in Desktop)
*   **Social Feed:** The desktop application has a dedicated `Social Feed` module under the `NETWORK` category. This page has been planned for mobile (Milestone `M016-SOCIAL-POSTING-PARITY`), but the actual Flutter page implementation (`SocialFeedPage`) does not exist in the mobile repository yet. 
*   *(Note: The "Home" link was also missing from the mobile drawer as mobile uses bottom-nav for Home, but I have added it to the drawer for strict parity).*

## 2. Missing in Desktop (Present in Mobile)
The Desktop reference screenshot cuts off after "Banking & Assets". If the Desktop sidebar does not contain the following modules, it is currently missing:
*   **Finance Category:**
    *   Cashflow
    *   Budgets
    *   Debt Tracker
    *   Installment Schedule
    *   Income / Expense Entry
    *   History / Statistics
*   **Support Category:**
    *   Receipt Scanner
    *   Academy
    *   Calendar
    *   Shopping List
    *   Help & Support
    *   Promotions
*   **Admin Workspace:**
    *   Admin Panel
    *   Presentations (Presentation Studio)
*   **Settings / Profile:**
    *   My Profile
    *   Theme Switcher

## 3. Icon Parity
The mobile app has been updated to use the exact iconography specified in the Desktop UI for the matched items:
*   Home -> `Icons.home_rounded`
*   Org Chart -> `Icons.hub_rounded`
*   Members -> `Icons.groups_rounded`
*   Social Feed -> `Icons.movie_outlined` (Placeholder link added in Mobile)
*   Activity Feed -> `Icons.notifications_outlined`
*   Trading Signals -> `Icons.bolt_rounded`
*   Banking & Assets -> Collapsible section added in Mobile.
