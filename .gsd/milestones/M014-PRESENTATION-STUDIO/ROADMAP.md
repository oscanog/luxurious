# Milestone M014: Presentation Studio (Canva-Style Editor)

**Status:** `planned`  
**Start Date:** `2026-05-17`  
**Objective:** Build a full-featured, Canva-inspired presentation design studio inside the Luxurious admin dashboard. Admins create, edit, duplicate, and delete branded pitch decks for future prospects — all backed by Convex real-time storage, with PPTX/PPT import support and multi-format export.

**Technical Spec:** [TECHNICAL-SPEC.md](./TECHNICAL-SPEC.md)

---

## Context

Luxurious needs prospect-facing presentations. No external tool. No Canva subscription. Boss opens our app → clicks "Presentations" → builds a stunning deck → exports PPTX or PDF → sends to prospect. Everything self-hosted. Convex stores all presentation JSON, media assets, and templates. The editor must feel premium — drag-and-drop canvas, rich text, shapes, images, gradients, layers — the works.

### Reference Repos Evaluated

| Repo | Stack | Verdict |
|------|-------|---------|
| [lidojs/canva-clone](https://github.com/lidojs/canva-clone) | React + custom canvas | Most feature-complete. Layering, masking, drag-drop, multi-format export. Complex codebase. |
| [iKrishnaSahu/canva-clone](https://github.com/iKrishnaSahu/canva-clone) | React 19 + Fabric.js + Vite | Modern stack. Image filters, JSON save/load. Good starting reference. |
| [Polotno Studio](https://github.com/polotno-studio/polotno-studio) | React + Konva | Most polished. SDK commercial but Studio source available. PPTX export built-in. |

### Chosen Architecture

- **Canvas Engine:** `fabric.js` v6+ (TypeScript-native, object model, JSON serialization, grouping, free-draw, filters, SVG import)
- **PPTX Export:** `pptxgenjs` (programmatic slide generation from canvas state)
- **PPTX Import:** Custom parser using `jszip` + XML parsing → Fabric.js object mapping
- **State Persistence:** Convex `presentations` table stores full JSON canvas state per slide
- **Media Storage:** Convex `_storage` for uploaded images, logos, backgrounds
- **Route:** `/admin/presentations` (single page — CRUD landing + embedded editor)

---

## Roadmap

### Phase 1: Convex Backend — Schema & Storage

- [ ] T01 Define `presentations` table schema:
  ```
  {
    title: string,
    description?: string,
    slides: array of {
      id: string (uuid),
      canvasJson: string (Fabric.js serialized JSON),
      order: number,
      thumbnail?: storageId,
    },
    coverThumbnail?: storageId,
    createdBy: userId,
    updatedAt: number,
    isArchived: boolean,
    tags?: string[],
  }
  ```
- [ ] T02 Define `presentationTemplates` table for reusable starter templates:
  ```
  {
    name: string,
    category: string ("pitch-deck", "report", "proposal", "blank"),
    slides: same structure as presentations.slides,
    thumbnail: storageId,
    isSystem: boolean,
  }
  ```
- [ ] T03 Create admin-only mutations:
  - `presentations.create` — from blank or template
  - `presentations.update` — save canvas JSON + metadata
  - `presentations.duplicate` — deep clone with new ID
  - `presentations.delete` — soft delete (archive) with hard-delete option
  - `presentations.updateSlideOrder` — reorder slides via drag
- [ ] T04 Create admin queries:
  - `presentations.list` — paginated, searchable, sortable (by title, date, tags)
  - `presentations.get` — single presentation with all slides
  - `presentations.listTemplates` — available starter templates
- [ ] T05 Create media mutations:
  - `presentations.generateUploadUrl` — for image/logo/background uploads
  - `presentations.saveThumbnail` — store slide/cover thumbnails
- [ ] T06 Deploy schema + functions to dev and prod.

### Phase 2: Landing Page — Presentation Manager (CRUD)

- [ ] T07 Build `/admin/presentations` landing page with:
  - Grid/list toggle view of all presentations (card thumbnails)
  - Each card shows: cover thumbnail, title, last edited date, slide count
  - Hover reveals: Edit, Duplicate, Delete actions
  - "Create New" prominent button (opens template picker or blank canvas)
  - Search bar (by title, tags)
  - Sort dropdown (newest, oldest, alphabetical)
  - Filter by tags/categories
- [ ] T08 Build "Create New" flow:
  - Template picker modal with categories: Pitch Deck, Report, Proposal, Blank
  - Each template shows preview thumbnail + name
  - "Start from Blank" option with slide size picker (16:9, 4:3, custom)
  - Title input field
- [ ] T09 Build delete confirmation dialog with archive vs permanent delete options.
- [ ] T10 Build duplicate action with auto-generated title suffix "(Copy)".

### Phase 3: Canvas Editor — Core Infrastructure

- [ ] T11 Initialize Fabric.js canvas inside editor workspace:
  - Fixed slide dimensions (default 1920×1080 for 16:9)
  - Responsive viewport scaling (fit canvas to available screen space)
  - Zoom controls (zoom in/out/fit, mouse wheel zoom)
  - Pan with spacebar + drag (Canva-style)
  - Grid/ruler toggles (snap-to-grid)
  - Canvas background color/gradient/image support
- [ ] T12 Build editor layout (Canva-inspired):
  - **Left Sidebar** — Tool panels (Templates, Elements, Text, Uploads, Background)
  - **Center** — Canvas workspace with slide preview
  - **Right Sidebar** — Properties panel (position, size, rotation, opacity, colors, effects)
  - **Top Toolbar** — Undo/Redo, Zoom, Slide navigation, Export, Share, Save status
  - **Bottom Bar** — Slide filmstrip (thumbnail strip of all slides, drag-to-reorder)
- [ ] T13 Implement canvas state ↔ Convex sync:
  - Auto-save on change (debounced 2 seconds)
  - Manual "Save" button with timestamp indicator
  - `canvas.toJSON()` serialization to Convex
  - `canvas.loadFromJSON()` deserialization from Convex
  - Optimistic UI — show "Saving..." → "Saved" status badge
- [ ] T14 Implement undo/redo stack:
  - Track canvas state history (max 50 steps)
  - Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Shift+Z (redo)
  - Undo/Redo toolbar buttons with disabled state when at boundary

### Phase 4: Design Tools — Elements & Shapes

- [ ] T15 **Shape Tool** — Insert basic shapes:
  - Rectangle, Rounded Rectangle, Circle, Ellipse, Triangle, Star, Arrow, Line
  - Pentagon, Hexagon, Diamond, Heart, Speech Bubble, Callout shapes
  - Custom polygon tool (click-to-plot vertices)
  - Shape properties: fill color, stroke color, stroke width, corner radius, opacity
  - Gradient fill (linear, radial) with color stops editor
  - Pattern fill from uploaded images
- [ ] T16 **Text Tool** — Rich text editing:
  - Click-to-add text box with inline editing
  - Font family picker (Google Fonts integration — Inter, Roboto, Montserrat, Playfair, Poppins, Open Sans, Lato, Oswald + 50 more)
  - Font size (slider + numeric input, 8pt to 200pt)
  - Font weight (thin, light, regular, medium, semi-bold, bold, extra-bold, black)
  - Font style (italic, underline, strikethrough)
  - Text alignment (left, center, right, justify)
  - Line height / letter spacing controls
  - Text color (solid + gradient)
  - Text shadow (offset, blur, color)
  - Text outline/stroke
  - Bulleted and numbered lists
  - Auto-resize text box vs fixed text box
  - Curved text / text on path (arc)
  - Text effects: shadow, glow, lift, hollow, splice, echo, glitch
- [ ] T17 **Image Tool** — Image handling:
  - Upload images (drag-and-drop onto canvas or via sidebar)
  - Image library (previously uploaded assets from Convex storage)
  - Crop tool (freeform + aspect ratio lock: 1:1, 4:3, 16:9, 3:2)
  - Image filters: brightness, contrast, saturation, blur, grayscale, sepia, invert, vintage, warm, cool
  - Image border / rounded corners
  - Image shadow (drop shadow, inner shadow)
  - Image opacity
  - Replace image (swap while keeping size/position/effects)
  - Flip horizontal / vertical
  - SVG upload and editing support
- [ ] T18 **Icon / Illustration Library**:
  - Built-in icon set (Lucide icons — 1000+ icons rendered as SVG on canvas)
  - Search icons by keyword
  - Colorize icons (single color, multi-color for path-based SVGs)
  - Resize icons maintaining aspect ratio
- [ ] T19 **Line & Connector Tool**:
  - Straight line, curved line (bezier), elbow connector
  - Arrow heads (none, arrow, circle, diamond) on start/end
  - Line style (solid, dashed, dotted)
  - Line thickness and color
  - Snap to object connection points

### Phase 5: Design Tools — Advanced Features

- [ ] T20 **Layer Management Panel**:
  - Layer list showing all objects on current slide (ordered by z-index)
  - Drag-to-reorder layers
  - Lock/unlock individual layers (prevent accidental edits)
  - Hide/show layers (toggle visibility)
  - Rename layers (double-click)
  - Bring to front / send to back / move up / move down
  - Group / ungroup selected objects
- [ ] T21 **Alignment & Distribution**:
  - Align selected objects: left, center, right, top, middle, bottom
  - Distribute evenly: horizontal, vertical
  - Smart alignment guides (snap lines showing when objects align)
  - Equal spacing guides
  - Center on canvas (horizontal, vertical, both)
- [ ] T22 **Object Properties Panel** (right sidebar):
  - Position (X, Y) with numeric input
  - Size (W, H) with aspect ratio lock toggle
  - Rotation (degree input + drag handle)
  - Opacity slider (0–100%)
  - Border/stroke editor
  - Shadow editor (X offset, Y offset, blur, spread, color)
  - Corner radius (all corners or individual)
  - Flip horizontal / vertical
  - Copy style / paste style
- [ ] T23 **Color System**:
  - Color picker with hex, RGB, HSL inputs
  - Eyedropper tool (pick color from canvas)
  - Recent colors palette (last 12 used)
  - Brand colors palette (configurable: Luxurious gold, navy, etc.)
  - Gradient editor: linear + radial, multiple color stops, angle control
  - Transparency/alpha channel support
- [ ] T24 **Background Tool**:
  - Solid color background
  - Gradient background (linear, radial)
  - Image background (upload or choose from library)
  - Background blur effect
  - Background opacity
  - Pattern backgrounds (dots, lines, grid, diagonal)
  - Apply to single slide or all slides

### Phase 6: Slide Management

- [ ] T25 **Slide Filmstrip** (bottom bar):
  - Thumbnail preview of each slide (auto-generated from canvas)
  - Click to navigate to slide
  - Drag-to-reorder slides
  - Right-click context menu: Duplicate, Delete, Insert Before/After
  - Add new slide button (+) with template picker mini-menu
  - Slide numbering (1, 2, 3...)
  - Current slide highlight indicator
- [ ] T26 **Slide Operations**:
  - Add blank slide
  - Add slide from template
  - Duplicate current slide
  - Delete slide (with confirmation if only 1 slide remains)
  - Copy slide content to clipboard
  - Paste slide content from clipboard
  - Apply master layout to slide (header+body, title only, blank, two-column)
- [ ] T27 **Slide Transitions** (for presentation mode):
  - Fade in/out
  - Slide left/right/up/down
  - Zoom in/out
  - None (instant)
  - Transition duration control (0.3s–2s)
- [ ] T28 **Presenter Mode** (full-screen slideshow):
  - Full-screen presentation playback
  - Arrow keys / click to advance
  - Escape to exit
  - Slide counter overlay (e.g., "3 / 12")
  - Timer display (elapsed time)
  - Black screen toggle (B key)
  - Laser pointer simulation (mouse trail)

### Phase 7: Import & Export

- [ ] T29 **PPTX/PPT Import**:
  - Upload `.pptx` file via drag-drop or file picker
  - Parse PPTX using `jszip` + XML parsing
  - Extract: slide dimensions, text boxes (content + styling), images (as base64), shapes (mapped to Fabric.js equivalents), backgrounds
  - Map PPTX elements → Fabric.js canvas objects
  - Import progress indicator with slide-by-slide preview
  - Handle graceful fallbacks for unsupported elements (charts → placeholder image, videos → poster frame)
  - Support for slide master/layout inheritance
- [ ] T30 **PPTX Export**:
  - Export current presentation to `.pptx` using `pptxgenjs`
  - Map Fabric.js objects → PptxGenJS slide elements:
    - Text → `slide.addText()` with font/color/position
    - Shapes → `slide.addShape()` with fill/stroke
    - Images → `slide.addImage()` (base64 or URL)
    - Lines → `slide.addShape()` with line type
  - Preserve slide order, backgrounds, dimensions
  - Download as file with presentation title as filename
- [ ] T31 **PDF Export**:
  - Render each slide to high-res canvas image
  - Compile images into multi-page PDF using `jspdf` or `pdf-lib`
  - Download with title as filename
  - Quality options: standard (150 DPI) / high (300 DPI)
- [ ] T32 **Image Export**:
  - Export current slide as PNG or JPEG
  - Export all slides as ZIP of images
  - Resolution options: 1x, 2x, 4x
  - Transparent background option (PNG only)
- [ ] T33 **JSON Export/Import** (for backup/transfer):
  - Export full presentation state as JSON file
  - Import JSON file to restore/create presentation
  - Useful for template sharing between instances

### Phase 8: Keyboard Shortcuts & UX Polish

- [ ] T34 **Keyboard Shortcuts**:
  - `Ctrl+S` — Save
  - `Ctrl+Z` — Undo
  - `Ctrl+Shift+Z` / `Ctrl+Y` — Redo
  - `Ctrl+C` / `Ctrl+V` — Copy/Paste objects
  - `Ctrl+D` — Duplicate selected
  - `Ctrl+A` — Select all objects on slide
  - `Delete` / `Backspace` — Delete selected
  - `Ctrl+G` — Group selected
  - `Ctrl+Shift+G` — Ungroup
  - `[` / `]` — Send backward / bring forward
  - `Ctrl+[` / `Ctrl+]` — Send to back / bring to front
  - `Arrow keys` — Nudge selected (1px)
  - `Shift+Arrow` — Nudge selected (10px)
  - `Ctrl+0` — Zoom to fit
  - `Ctrl++` / `Ctrl+-` — Zoom in/out
  - `T` — Insert text
  - `R` — Insert rectangle
  - `C` — Insert circle
  - `L` — Insert line
  - `Escape` — Deselect all
  - `Space+Drag` — Pan canvas
- [ ] T35 **Context Menu** (right-click on canvas/objects):
  - Cut, Copy, Paste, Duplicate
  - Bring to front / Send to back
  - Group / Ungroup
  - Lock / Unlock
  - Delete
  - Copy style / Paste style
  - Align options sub-menu
- [ ] T36 **Clipboard Support**:
  - Copy/paste Fabric.js objects within editor
  - Copy/paste between slides
  - Paste external images from clipboard (Ctrl+V image from screenshot)
- [ ] T37 **Selection & Multi-select**:
  - Click to select single object
  - Shift+Click to add/remove from selection
  - Drag selection box (marquee select)
  - Multi-object transform (move, scale, rotate as group)
  - Selection info bar (shows count: "3 objects selected")
- [ ] T38 **Responsive Editor Layout**:
  - Collapsible left sidebar (maximize canvas space)
  - Collapsible right sidebar
  - Full-screen editor mode (hide all panels)
  - Minimum viewport warning for very small screens

### Phase 9: Templates & Brand Kit

- [ ] T39 **Starter Templates** (seed data):
  - Pitch Deck (10 slides: cover, agenda, problem, solution, product, traction, team, roadmap, pricing, contact)
  - Business Report (8 slides: cover, executive summary, metrics, charts placeholder, analysis, conclusions, appendix, back cover)
  - Project Proposal (7 slides: cover, overview, scope, timeline, budget, team, next steps)
  - Blank (1 slide: empty 16:9 canvas)
  - All templates use Luxurious brand colors (navy, gold, white, slate)
- [ ] T40 **Brand Kit Panel** (left sidebar tab):
  - Brand colors: primary (navy), secondary (gold), accent, neutral palette
  - Brand fonts: heading font, body font
  - Brand logos: uploadable logo variants (full, icon, white, dark)
  - "Apply Brand" button — updates all text/shape colors on current slide to brand palette
- [ ] T41 **Save as Template**:
  - Save any presentation as reusable template
  - Template name + category picker
  - Auto-generate thumbnail from first slide

### Phase 10: Polish, Performance & QA

- [ ] T42 **Performance Optimization**:
  - Lazy-load slides (only render active slide canvas)
  - Thumbnail generation via off-screen canvas (web worker if possible)
  - Image compression before upload (max 2MB, auto-resize if larger)
  - Canvas object caching (Fabric.js `objectCaching: true`)
  - Debounced auto-save (2s after last change)
- [ ] T43 **Error Handling**:
  - Upload failure → retry with error toast
  - Save failure → retry with "Unsaved changes" warning
  - PPTX import failure → graceful error dialog with partial import option
  - Network loss → offline indicator, queue saves for reconnection
- [ ] T44 **Accessibility**:
  - Keyboard navigation for all tools
  - ARIA labels on toolbar buttons
  - High contrast mode for editor chrome
  - Screen reader support for slide navigation
- [ ] T45 **Testing**:
  - Test with 50+ slide presentations for performance
  - Test PPTX import with 10+ real-world PowerPoint files
  - Test export fidelity (PPTX → re-import → visual diff)
  - Test on Chrome, Firefox, Edge
  - Test responsive layout at common breakpoints (1280, 1440, 1920)

---

## Success Criteria

- [ ] Admin navigates to `/admin/presentations` and sees all presentations in grid/list view.
- [ ] Admin creates new presentation from template or blank with title input.
- [ ] Admin opens editor and sees Canva-like workspace: left tools, center canvas, right properties, bottom filmstrip.
- [ ] Admin drags shapes, text, images onto canvas and positions/styles them freely.
- [ ] Admin uploads images and they appear in image library for reuse across presentations.
- [ ] Admin manages multiple slides: add, duplicate, delete, reorder via drag in filmstrip.
- [ ] Admin imports existing `.pptx` file and sees slides rendered on canvas with reasonable fidelity.
- [ ] Admin exports presentation as PPTX — opens correctly in PowerPoint/Google Slides.
- [ ] Admin exports presentation as PDF — all slides rendered at print quality.
- [ ] Auto-save works: every change persisted to Convex within 2 seconds.
- [ ] Undo/redo works across all operations (50 step history).
- [ ] All keyboard shortcuts function as documented.
- [ ] Editor performs smoothly with 30+ objects per slide, 20+ slides per deck.
- [ ] Delete/archive presentations with confirmation prompt.
- [ ] Duplicate presentation creates independent copy.
- [ ] Presenter mode plays full-screen slideshow with transitions.
- [ ] Brand kit colors/fonts applied consistently across templates.

---

## Non-Goals (Deferred)

- **Real-time collaboration** (multi-user editing same deck). Single-user for now.
- **Animation timeline** (element entrance/exit animations). Slide transitions only.
- **Video embedding** on canvas. Images and SVGs only.
- **AI content generation** (auto-generate slide text from prompt). Manual creation only.
- **Mobile editor**. Desktop/tablet only. Landing page viewable on mobile.
- **Version history** (revert to previous save). Single current state.
- **Comments/annotations**. No review workflow.
- **Custom fonts upload**. Google Fonts library only.

---

## Dependencies

| Dependency | Purpose | Version |
|------------|---------|---------|
| `fabric` | Canvas engine — object model, selection, serialization, filters | ^6.x |
| `pptxgenjs` | PPTX file generation from canvas state | ^3.x |
| `jszip` | Parse uploaded PPTX files (OOXML = zipped XML) | ^3.x |
| `jspdf` or `pdf-lib` | PDF export from rendered slide images | latest |
| `uuid` | Generate unique IDs for slides and objects | ^9.x |
| `file-saver` | Trigger browser file downloads for exports | ^2.x |

---

## Notes

- Fabric.js v6 is TypeScript-native. JSON serialization (`toJSON`/`loadFromJSON`) makes Convex persistence trivial — store slide state as stringified JSON.
- `pptxgenjs` expects dimensions in inches. Canvas uses pixels. Conversion: `1 inch = 96px` at standard DPI. Slide 1920×1080px = 20×11.25 inches.
- PPTX import is best-effort. Complex SmartArt, charts, and embedded OLE objects won't map perfectly. Fallback: render as rasterized image placeholder.
- Convex `_storage` handles all binary assets (images, thumbnails, exported files). Signed URLs for retrieval.
- Editor route: `/admin/presentations` for landing, `/admin/presentations/:id/edit` for editor. Both admin-only.
- Template seed data should be created via a Convex seed script or manual insertion in dashboard.
