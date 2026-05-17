# Milestone M013: APK Distribution Platform

**Status:** `planned`  
**Start Date:** `2026-05-17`  
**Objective:** Create a dedicated, publicly accessible page for users to download the Android APK build, along with an admin interface to upload, manage, and delete APK releases with their associated release notes.

**Technical Spec:** [TECHNICAL-SPEC.md](./TECHNICAL-SPEC.md)

## Objective
Since we are not deploying to the Google Play Store for this release, we require an in-house APK distribution mechanism. The goal is to provide a seamless, publicly accessible download page (no login required) for end-users, alongside a robust admin dashboard for managing APK uploads and versions.

## Roadmap

### Phase 1: UX/UI Design & Planning
- [ ] T01 Define layout for public APK download page (searchable, sortable, filterable list of releases).
- [ ] T02 Define layout for admin management page (upload button, form for release notes, versioning).
- [ ] T03 Ensure design aligns with Luxurious aesthetic, excluding unnecessary banners to keep the interface clean and functional.

### Phase 2: Convex Backend & Storage
- [x] T04 Define Convex schema for `apkReleases` (version string, build number, release notes, storage ID, release date, isActive flag).
- [x] T05 Implement secure file upload API using Convex storage.
- [x] T06 Create public, unauthenticated query to fetch active APK releases.
- [x] T07 Create admin-only mutations to upload, edit, and delete/archive APK builds.

### Phase 3: Admin Management Interface
- [x] T08 Build admin upload modal/page with fields for Version, Release Notes (markdown), and the File itself.
- [x] T09 Implement admin-side paginated data table for managing existing releases.
- [x] T10 Add delete/archive actions with confirmation prompts.

### Phase 4: Public Distribution Page
- [x] T11 Build the public-facing `/download` route accessible without authentication.
- [x] T12 Implement a searchable, sortable, and filterable paginated list of available APKs.
- [x] T13 Add "Download" action that retrieves the file securely from Convex storage.
- [x] T14 Render release notes beautifully in the list or a collapsible accordion.
- [x] T15 Add icon-only share button to easily copy/share specific APK download link.

### Phase 5: Polish & Testing
- [ ] T16 Test upload constraints (file size limits, APK mime type).
- [ ] T17 Ensure public route does not leak sensitive admin data.
- [ ] T18 Optimize performance with cursor pagination.

## Success Criteria

- [ ] Unauthenticated users can successfully navigate to the download page and download the latest APK.
- [ ] Public page features icon-only share button that copies the build download link to the clipboard.
- [ ] Admins can easily upload a new APK with a version number and release notes.
- [ ] Admins can delete or archive older APK versions.
- [ ] The public page features functional search, sort, and pagination.
- [ ] The page does not contain unnecessary banners, focusing strictly on functional requirements.
- [ ] File uploads are securely stored and efficiently served via Convex storage.
