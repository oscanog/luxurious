# Academy Module Parity Specification

This document details the exact layout, behavior, and data structures of the Desktop Academy modules (`AcademyManagerPage` and `AcademyPage`). It serves as the definitive blueprint for implementing seamless parity in the Flutter mobile application.

## 1. Academy Manager Page (Admin)
**Path:** `/admin/academy` (Desktop: `AcademyManagerPage.tsx`)

This page is used by administrators to build the curriculum. It has three distinct views managed by a state variable (`"list" | "edit-level" | "edit-lesson"`).

### A. List View (The Hub)
- **Header:** "Academy Manager" title with a "Create Level" button (`+` icon).
- **Grid Layout:** Displays a 2-column grid (on desktop) of `AcademyLevel` cards.
- **Level Card Design:**
  - **Left Graphic:** A rounded square showing the level's `order` (e.g., "1"), tinted with the level's `color`.
  - **Header:** `subtitle` (e.g., "FRESHMAN") in uppercase gold, above the `title` (e.g., "Market Foundations").
  - **Body:** `description` text truncated to 2 lines.
  - **Actions:** 
    - Hovering reveals `Edit` and `Delete` icons in the top right.
    - A full-width "Manage Lessons" button at the bottom.

### B. Edit Level View
- **Header:** "Back to Levels" button, Level Title, and an "Add Lesson" button.
- **Level Settings Form:** 
  - Input fields for `Title`, `Subtitle`, and `Description`. (Note: `Color` is currently handled via default presets in desktop).
  - A "Save Changes" button in the section header.
- **Lessons List:**
  - Displays all `AcademyLesson` documents associated with this `levelId`, sorted by `order`.
  - Each row shows the order number, title, slug, and duration.
  - Hovering reveals `Edit` and `Delete` buttons for the lesson.

### C. Edit Lesson View
- **Header:** "Back to Lessons" button, "New/Edit Lesson" title.
- **Controls:** A toggle between "Edit Mode" and "Preview Mode", plus a "Save Lesson" button.
- **Form Fields:** `Lesson Title`, `Slug` (e.g., "1.1"), `Duration` (e.g., "5 min").
- **Content Editor:** A large `textarea` for writing raw Markdown content. When toggled to Preview, it renders the Markdown as styled HTML.

---

## 2. Academy Page (Consumer)
**Path:** `/academy` (Desktop: `AcademyPage.tsx`)

This is the end-user learning portal. It has two views: `"hub"` and `"lesson"`.

### A. Hub View
- **Hero Banner:** A vibrant blue/gradient hero section.
  - **Stats:** Shows "XP Earned" (50 XP per completed lesson) and "Progress" (completed / total lessons).
- **Overall Progress Bar:** A linear progress bar mapping total completion percentage.
- **Level Cards Grid:**
  - Mirrors the admin grid but adds user-specific locking logic.
  - **Locking Logic:** Level $N$ is locked if Level $N-1$ does not have all 5 of its lessons completed.
  - **Visuals:** Locked levels have a semi-transparent glassmorphism overlay with a Lock icon and "Complete previous level" text.
  - **Lesson List:** Inside the card, all lessons for that level are listed. Completed lessons have a green checkmark and green tinted background. Unlocked pending lessons have an arrow icon.
  - **Progress:** A mini progress bar per level (e.g., "3/5").

### B. Lesson View
- **Header:** "Back to Academy" button.
- **Metadata:** Level Subtitle, "Lesson X/Y", and Duration.
- **Title:** The lesson's `title`.
- **Content:** The raw Markdown `content` is parsed and rendered (lists, bold text, paragraphs).
- **Footer:** 
  - If completed, shows a green "Completed" badge.
  - A primary button: "Complete & Next" (moves to the next lesson in the array) or "Finish Level" (returns to Hub).

---

## 3. Data Schema & Models

### `academyLevels`
```typescript
{
  order: number,          // e.g. 1
  title: string,          // e.g. "Market Foundations"
  subtitle: string,       // e.g. "Freshman"
  color: string,          // e.g. "hsl(221 83% 53%)"
  description: string,
}
```

### `academyLessons`
```typescript
{
  levelId: Id<"academyLevels">,
  order: number,          // e.g. 1
  slug: string,           // e.g. "1.1"
  title: string,
  duration: string,       // e.g. "5 min"
  content: string,        // Markdown body
}
```

### `academyProgress`
```typescript
{
  userId: Id<"users">,
  lessonSlug: string,     // e.g. "1.1"
  completedAt: number,
}
```

## Implementation Strategy for Flutter
1. **AcademyManagerPage (Admin):** Ensure the UI strictly uses the 3-state enum (`list`, `editLevel`, `editLesson`). The current Flutter implementation requires minor CSS/Theme adjustments to match the grid styling, floating edit buttons, and markdown preview toggles.
2. **AcademyPage (Consumer):** Build the hero banner, calculate the XP logic, and implement the lock-state overlay for the ExpansionTiles or Card lists. Render markdown using `flutter_markdown`.
