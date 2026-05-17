# Technical Specification: M013 APK Distribution

## 1. Overview
This feature provides an in-house distribution mechanism for the Luxurious Android application (APK), bypassing the Google Play Store. It involves a secure admin interface for uploading builds and a public-facing portal for users to search, view release notes, and download builds.

## 2. Convex Schema Design

### `apkReleases` Table
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  apkReleases: defineTable({
    version: v.string(), // e.g., "1.0.4"
    buildNumber: v.number(), // e.g., 42
    releaseNotes: v.string(), // Markdown formatted
    storageId: v.id("_storage"), // Convex storage reference
    fileSize: v.number(), // Size in bytes
    fileName: v.string(),
    isActive: v.boolean(), // Soft delete or visibility toggle
    publishedAt: v.number(), // Timestamp
    uploadedBy: v.id("users"), // Admin reference
  })
  .index("by_publishedAt", ["publishedAt"])
  .index("by_buildNumber", ["buildNumber"])
  .index("by_isActive", ["isActive", "publishedAt"]),
});
```

## 3. Backend Implementation (Convex API)

### Storage Setup
- **Upload URL Generation:** Admin calls `generateUploadUrl` mutation to securely obtain an endpoint for direct client-to-storage upload.
- **File Constraints:** Enforce file size limits and MIME types (ideally `application/vnd.android.package-archive` but standard `application/octet-stream` may be used depending on browser mapping).

### Public Queries (`publicQueries.ts`)
- **`listActiveReleases`**: Fetch paginated, active APK builds ordered by `publishedAt` descending.
- **Search/Filter**: Support filtering by version or release notes content.

### Admin Mutations (`adminMutations.ts`)
- **`publishRelease`**: Takes `storageId`, `version`, `buildNumber`, `releaseNotes`, etc., and creates a new `apkReleases` document. Must verify admin authorization.
- **`deleteRelease`**: Soft delete (`isActive = false`) or hard delete (remove doc and delete from storage). Prefer hard delete to save storage space if history is not strictly required.

## 4. Frontend Implementation

### Public View (`/download` or `/apk`)
- **Accessibility:** Must not require an active session. Protected by route config exceptions.
- **UI Components:**
  - **No Banner:** Clean interface.
  - **Data Table / List:** Use a paginated table or a clean list view (card per release).
  - **Toolbar:** Include a search input (by version or keyword) and sort toggles.
  - **Release Notes:** Markdown renderer component for `releaseNotes`.
  - **Download Button:** Calls Convex `getFileUrl` to initiate the download.
  - **Share Button:** Icon-only button. Copies the specific release download URL (e.g., `/download?v=1.0.4` or direct file URL) to the clipboard and triggers a toast notification. Supports Web Share API as a progressive enhancement.

### Admin View (`/admin/apk-management`)
- **Accessibility:** Restricted to Admin role only.
- **UI Components:**
  - **Upload Button:** Opens a modal or form.
  - **Upload Form:**
    - File input (APK only).
    - Version input string.
    - Build Number input.
    - Markdown editor for Release Notes.
    - Progress indicator for the storage upload process.
  - **Management Table:** Paginated list showing all releases with an action column (Delete/Archive).

## 5. Security & Edge Cases
- **Public URL Security:** Ensure `getFileUrl` is functional for public users without exposing internal storage IDs maliciously.
- **Upload Validation:** Validate file extension is `.apk` before attempting upload to save bandwidth.
- **Admin Verification:** Ensure robust role checks on all mutations to prevent unauthorized uploads.
- **Storage Cleanup:** If an APK is deleted from the table, ensure the corresponding file in Convex `_storage` is also explicitly deleted to prevent orphaned files and unnecessary storage costs.
