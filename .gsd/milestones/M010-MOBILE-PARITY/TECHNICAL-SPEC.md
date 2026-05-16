# Technical Specification: M010-MOBILE-PARITY

## Context & Architecture
The Luxurious application currently has disjointed feature sets between the Android mobile client (Flutter) and the web desktop client (React). Recent intensive development on the mobile platform (Milestones M011, M013, M014) introduced advanced UI/UX patterns specifically for the Org Chart, Onboarding, and Security management. The backend Convex mutations and queries have already been stabilized and expanded to support these features. This specification defines how these features will be ported to the React desktop environment.

## 1. Network Explorer (Read/Write)
**Implementation Plan:**
- **UI Framework:** Standardize on existing React UI components (TailwindCSS, Radix UI or existing internal components).
- **Infinite Scrolling:** Utilize Convex's `usePaginatedQuery` mapped to the `networkMembers` table to load members dynamically as the user scrolls within the Explorer tabs.
- **Tabs State:** Maintain tab state (Joined, Invited, Pending, To Invite) in URL search parameters to allow deep linking or in local component state.
- **Data Dependency:** Relies on the existing `network:getDashboard` and `network:listMembers` queries.

## 2. Advanced Org Chart Studio
**Implementation Plan:**
- **Canvas Library:** Evaluate `react-flow-renderer` or `d3-org-chart` to replace the basic web tree implementation. It must support:
  - Panning & infinite zooming.
  - Custom React node rendering (to mimic the Mobile "Role · FULL (6/6)" badges).
  - Built-in Minimap components (standard in React Flow).
- **Controller Logic:** Port the branch collapsing and "focus path to root" algorithms from the Dart `OrgService` / `BuchheimWalker` implementations to a custom React hook (e.g., `useOrgChartStudio()`).

## 3. Onboarding Stepper
**Implementation Plan:**
- **Component Structure:** Develop a generic `<Stepper />` layout component with progress indicators.
- **State Management:** Use `useReducer` or a structured state object to collect the payload across steps (Identity -> Contact -> Platform).
- **Auto-save:** Implement a debounced `localStorage` integration keyed by `draft_onboarding_${targetParentId}` to preserve state if the user navigates away or accidentally refreshes the page.

## 4. Admin Security Module
**Implementation Plan:**
- **Inspector Panel:** Refactor the existing desktop member details sidebar to categorize actions. Add a distinct `<SecuritySection />` isolated from general actions.
- **Mutations Integration:**
  - Map the `<ChangePasswordModal />` to the `networkMembers:resetMemberPassword` action.
  - Map the `<ChangeEmailModal />` to the `networkMembers:updateMemberEmail` action.
- **Credential Dispatch:**
  - Create a `<CredentialsSuccessDialog />` triggered when the above actions successfully resolve.
  - Wire the "Email Credentials" button to the `email:sendEmail` action, passing the structured HTML layout currently defined in the backend/mobile specifications.

## 5. Constraint Enforcement
**Implementation Plan:**
- **Backend Reliance:** The backend `network.ts` already strictly enforces `MAX_DIRECT_DOWNLINES = 6`. 
- **Frontend Guarding:** The `NetworkMemberSummary` mapped from `getDashboard` returns `directChildrenCount`. Calculate `isFull` on the client side (`count >= 6`) to actively disable the `(+) Add Member` and Reassign targets, visually tinting them red with disabled cursors.
