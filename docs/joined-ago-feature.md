# Org Chart "Joined Ago" / Investment Start Date Feature

This document explains the implementation of the "Joined Ago" dynamic time tracking and "Investment Start Date" editing feature in the Org Chart module. It serves as a reference for achieving feature parity in the Flutter mobile application.

## Feature Overview
1. **Dynamic "Joined Ago" Calculation**: Displays a highly readable, relative time string (e.g., "Joined 5 mins ago", "Joined 12 days ago") based on the member's `investmentStartedAt` timestamp.
2. **Org Chart Node Display**: The "Joined Ago" string is displayed directly below the "Asset" block in the canvas view for quick visibility.
3. **Member Inspector (Overview Dialog)**:
   - Contains a Date Picker input to allow admins to edit a member's `Investment Start Date`.
   - Displays the calculated "Joined Ago" duration and absolute start date at the bottom of the "Asset History Logs" section.

---

## 1. Backend Implementation (Convex)

### Schema & Data Model
- The `networkMembers` table already contains the `investmentStartedAt: v.optional(v.number())` timestamp field.

### Network Queries (`convex/network.ts`)
- Modified `buildTree` and `buildOverview` functions to ensure `investmentStartedAt` is passed down within the nested `member` object of the `OrgTreeNode` payload.
- Updated the `getMember` query payload to include `investmentStartedAt`.
- **TypeScript Fix**: Updated the `OrgTreeNode` type definition to include `investmentStartedAt?: number;` to satisfy the compiler.

### Mutations (`convex/networkMembers.ts`)
- Added a new `updateMemberInvestmentDate` mutation to handle updates from the frontend's Date Picker:
  ```typescript
  export const updateMemberInvestmentDate = mutation({
    args: {
      memberId: v.id("networkMembers"),
      investmentStartedAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
      // Validates profile auth
      await ctx.db.patch(args.memberId, {
        investmentStartedAt: args.investmentStartedAt,
        updatedAt: Date.now(),
      });
    },
  });
  ```

---

## 2. Frontend Implementation (React / Web)

### Formatting Utility
A clean utility function converts the Unix timestamp into a readable KISS format.
```typescript
const formatTimeSinceJoined = (timestamp?: number): string | null => {
  if (!timestamp) return null;
  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) return "Joined just now";
  
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Joined just now";
  if (diffMins < 60) return `Joined ${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Joined ${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `Joined ${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
};
```

### Canvas Node (`OrgCardNode.tsx`)
- Rendered conditionally if `member.latestAsset` and `member.investmentStartedAt` are present.
- Positioned directly below the Asset block using subtle styling `text-[hsl(var(--muted-foreground))] text-[9px] font-semibold`.

### Member Overview Dialog (`MemberInspector.tsx`)
- **Date Edit Input**: Placed right below the `Member Status` selection block. Triggers the `updateMemberInvestmentDate` mutation on change.
- **Log Container Footer**: At the bottom of the "Asset History Logs", we added a footer summarizing the absolute Start Date and the dynamic "Joined Ago" string prominently.

---

## 3. Flutter Mobile Parity Guide

For the Dart/Flutter counterpart (`c:\projects\luxurious-mobile`), the following parity tasks are required:

1. **Update Data Models**:
   - Ensure your local `OrgTreeNode` and `NetworkMember` models map the `investmentStartedAt` (int/timestamp) field coming from Convex `getNetwork` / `getMember` queries.

2. **Dart Formatting Utility**:
   - Replicate `formatTimeSinceJoined` in Dart using `DateTime.now().difference()` to return strings exactly matching the web format (`Joined X days ago`).

3. **Node Widget Update**:
   - Inside your Flutter Org Chart Node Widget, locate the asset row and append a Text widget below it displaying the calculated "Joined Ago" string using subtle/muted typography.

4. **Member Overview BottomSheet/Drawer**:
   - **Date Picker**: Add a tap-to-edit Date Picker input for "Investment Start Date" below the Status dropdown. 
   - **Mutation**: Connect the Date Picker to the new `api.networkMembers.updateMemberInvestmentDate` Convex mutation.
   - **Asset Footer**: Append a summary row at the bottom of the Asset Logs list to display `Start Date: MM/DD/YYYY` alongside the dynamic `Joined X days ago` text.
