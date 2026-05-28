# Org Chart Direct Upline Solution - Learnings Log

## 1. Why Previous Solution Failed

### Issue A: `viewer.userId` Was Undefined
* **Root Cause**: The seeded `networkMembers` (seeded via `seedDefaultNetworkMembers` in `mobileHelpers.ts`) do not have the `userId` field populated at seed time. 
* **Effect**: `viewer.userId` on Melvin's viewer card in his own profile was `undefined`.
* **Result**: The condition `if (viewer && viewer.userId)` evaluated to `false`, completely skipping the upline query.

### Issue B: Bypassed by `isMasterUpline` Check
* **Root Cause**: In `buildOverview`, we checked if `viewer.parentMemberId === null` to determine if a member is a master upline. 
* **Effect**: In Melvin Nogoy's local profile tree, Melvin's viewer card is the root of the tree, meaning its `parentMemberId` is `null`.
* **Result**: `isMasterUpline` evaluated to `true`, forcing the execution of the master tree builder (`buildTree(parentLookup, "root")`) and completely bypassing the `else` block where the `directUpline` wrapping logic lived.

---

## 2. The Robust Solution

### A. Use `profile.userId`
* **Fix**: Instead of relying on `viewer.userId` which is missing from seeded cards, query with the logged-in user's verified `profile.userId` from the `mobileProfiles` table.
* **Mechanism**: 
  ```typescript
  if (profile.userId) {
    const parentTreeMember = await ctx.db
      .query("networkMembers")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), profile.userId),
          q.eq(q.field("isViewer"), false)
        )
      )
      .first();
    // ...
  }
  ```

### B. Eliminate `isMasterUpline` Branching
* **Fix**: Simplify `buildOverview` to evaluate `directUpline` presence directly.
* **Mechanism**:
  1. Build the local viewer's card (`viewerNode`) with Melvin as root.
  2. If `directUpline` exists (Melvin has Florence Nogoy as upline), wrap `viewerNode` inside `directUpline`'s node. Mark `directUpline` with `allowAdd: false`.
  3. If `directUpline` is `null` (Marko Nogoy has no upline), fall back to standard `buildTree(parentLookup, "root")` ensuring backward compatibility.

---

## 3. Solution Verification Checklist
* [x] Verified type compatibility on Convex TS schema.
* [x] Ensured index-free query via generic filter avoids schema mismatch errors.
* [x] Implemented React frontend check for `member.allowAdd !== false` to hide plus button on desktop.
* [x] Implemented Flutter mobile check for `node.allowAdd` to hide plus button on mobile.

---

## 4. Canonical Linked-Downline Visibility

### Issue: Member Account Showed Only Local Seeded Profile
* **Root Cause**: `listUnifiedNetworkMembers` started from the signed-in user's own `mobileProfiles` tree. If an admin/upline added the real downlines in another profile, the member account only saw local seeded placeholders.
* **Example**: Florence Nogoy signed in as a non-admin member. Her own profile showed only her viewer card and local prospects, while Marko's org tree had Florence's real connected downline subtree.

### Fix
* Add `networkMembers.by_userId` index.
* In `listUnifiedNetworkMembers`, find non-viewer `networkMembers` rows linked to `profile.userId` outside the current profile.
* Remap descendants of those canonical rows under the signed-in viewer card.
* Keep access scoped: member sees their canonical subtree, not admin-only users or unrelated branches.
* Update AI context to use the same unified member helper so desktop AI and org chart share one access model.

### Follow-up: Show Direct Upline Read-Only
* Florence's account needed to see Maylyn above Florence because Maylyn is the canonical direct upline.
* Direct-upline lookup now resolves canonical member rows by `userId` or email, then loads `parentMemberId`.
* `buildOverview` wraps viewer node under that upline and sets `allowAdd: false` on both the wrapper node and nested `member` payload.
* Desktop org cards already hide the plus button when `member.allowAdd === false`, so Maylyn is visible but cannot add from Florence's non-admin view.

### Follow-up: Latest Asset on Linked Viewer Card
* Florence's side panel showed asset logs, but the main canvas card missed latest asset because the card used the signed-in profile viewer row while the asset logs were attached to the canonical admin/upline tree row.
* Asset lookup now populates latest-asset maps by member id, linked user id, member email, and normalized member name.
* This lets duplicate auth/user rows with the same member email still render the same latest org asset on cards.
