# Technical Specification: M014 Presentation Studio

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     BROWSER (Admin Dashboard)                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 /admin/presentations                      │   │
│  │                                                          │   │
│  │  ┌─────────────┐  ┌──────────────────┐  ┌────────────┐  │   │
│  │  │  Landing     │  │   Canvas Editor  │  │  Presenter │  │   │
│  │  │  (CRUD Grid) │  │   (Fabric.js)    │  │  Mode      │  │   │
│  │  └─────────────┘  └──────────────────┘  └────────────┘  │   │
│  │         │                   │                   │        │   │
│  │         ▼                   ▼                   ▼        │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │           State Manager (React Context)          │    │   │
│  │  │  slides[], activeSlideId, undoStack, selection   │    │   │
│  │  └──────────────────────┬───────────────────────────┘    │   │
│  └─────────────────────────┼────────────────────────────────┘   │
│                            │                                    │
│                   ┌────────▼────────┐                           │
│                   │  Auto-Save Hook │                           │
│                   │  (debounce 2s)  │                           │
│                   └────────┬────────┘                           │
└────────────────────────────┼────────────────────────────────────┘
                             │ HTTPS
                    ┌────────▼──────────┐
                    │   Convex Backend   │
                    │  polished-eagle    │
                    │                    │
                    │  ┌──────────────┐  │
                    │  │presentations │  │  JSON canvas state
                    │  │   table      │  │  per slide
                    │  └──────────────┘  │
                    │  ┌──────────────┐  │
                    │  │presentation  │  │  Reusable starter
                    │  │  Templates   │  │  decks
                    │  └──────────────┘  │
                    │  ┌──────────────┐  │
                    │  │  _storage    │  │  Images, thumbnails,
                    │  │  (blobs)     │  │  exported files
                    │  └──────────────┘  │
                    └───────────────────┘
```

## 2. Convex Schema

```typescript
// convex/schema.ts additions

presentations: defineTable({
  title: v.string(),
  description: v.optional(v.string()),
  slides: v.array(v.object({
    id: v.string(),                          // UUID
    canvasJson: v.string(),                  // Fabric.js toJSON() stringified
    order: v.number(),                       // 0-indexed position
    thumbnail: v.optional(v.id("_storage")), // Auto-generated preview
    transition: v.optional(v.string()),      // "fade" | "slide-left" | "slide-right" | "zoom" | "none"
    transitionDuration: v.optional(v.number()), // milliseconds
  })),
  slideWidth: v.number(),                    // default 1920
  slideHeight: v.number(),                   // default 1080
  coverThumbnail: v.optional(v.id("_storage")),
  createdBy: v.id("users"),
  updatedAt: v.number(),                     // Date.now()
  isArchived: v.boolean(),
  tags: v.optional(v.array(v.string())),
})
  .index("by_createdBy", ["createdBy"])
  .index("by_isArchived", ["isArchived"])
  .index("by_updatedAt", ["updatedAt"]),

presentationTemplates: defineTable({
  name: v.string(),
  category: v.string(),                      // "pitch-deck" | "report" | "proposal" | "blank"
  slides: v.array(v.object({
    id: v.string(),
    canvasJson: v.string(),
    order: v.number(),
  })),
  slideWidth: v.number(),
  slideHeight: v.number(),
  thumbnail: v.optional(v.id("_storage")),
  isSystem: v.boolean(),                     // true = shipped with app, false = user-created
})
  .index("by_category", ["category"]),
```

## 3. API Contract

### Mutations (Admin-only, auth-guarded)

| Function | Args | Returns | Notes |
|----------|------|---------|-------|
| `presentations.create` | `{ title, templateId?, slideWidth?, slideHeight? }` | `Id<"presentations">` | Clones template slides if `templateId` provided, else single blank slide |
| `presentations.update` | `{ id, title?, description?, slides?, tags? }` | `void` | Auto-sets `updatedAt`. Slides array is full replacement. |
| `presentations.duplicate` | `{ id }` | `Id<"presentations">` | Deep clones all slides + storage refs. Title gets " (Copy)" suffix. |
| `presentations.archive` | `{ id }` | `void` | Soft delete. Sets `isArchived: true`. |
| `presentations.hardDelete` | `{ id }` | `void` | Deletes record + associated storage blobs. |
| `presentations.updateSlideOrder` | `{ id, slideIds: string[] }` | `void` | Reorders slides by provided ID array. |
| `presentations.generateUploadUrl` | `{}` | `string` | Convex storage upload URL for media. |
| `presentations.saveThumbnail` | `{ presentationId, slideId?, storageId }` | `void` | Saves thumbnail ref. If `slideId` omitted, saves as cover. |
| `presentations.saveAsTemplate` | `{ presentationId, name, category }` | `Id<"presentationTemplates">` | Converts presentation to reusable template. |

### Queries (Admin-only)

| Function | Args | Returns | Notes |
|----------|------|---------|-------|
| `presentations.list` | `{ search?, sortBy?, sortOrder?, isArchived? }` | `Presentation[]` with cover URLs | Landing page grid data. |
| `presentations.get` | `{ id }` | Full `Presentation` with all slides | Editor load. |
| `presentations.listTemplates` | `{ category? }` | `Template[]` with thumbnails | Template picker. |

## 4. Fabric.js Canvas Integration

### Canvas JSON Schema (per slide)

Each slide's `canvasJson` is the output of `fabric.Canvas.toJSON()`, which produces:

```json
{
  "version": "6.x",
  "objects": [
    {
      "type": "Textbox",
      "left": 100,
      "top": 200,
      "width": 500,
      "height": 80,
      "text": "Welcome to Luxurious",
      "fontSize": 48,
      "fontFamily": "Inter",
      "fontWeight": "bold",
      "fill": "#D4AF37",
      "textAlign": "center",
      "angle": 0,
      "opacity": 1,
      "shadow": { "color": "rgba(0,0,0,0.3)", "blur": 10, "offsetX": 2, "offsetY": 2 }
    },
    {
      "type": "Rect",
      "left": 50,
      "top": 50,
      "width": 1820,
      "height": 980,
      "fill": "transparent",
      "stroke": "#D4AF37",
      "strokeWidth": 2,
      "rx": 12,
      "ry": 12
    },
    {
      "type": "Image",
      "left": 800,
      "top": 400,
      "width": 320,
      "height": 320,
      "src": "https://polished-eagle-138.convex.cloud/api/storage/xxx",
      "filters": []
    }
  ],
  "background": "#0F172A"
}
```

### Canvas ↔ React Sync Strategy

```typescript
// EditorContext.tsx

interface EditorState {
  presentationId: string;
  slides: SlideData[];
  activeSlideIndex: number;
  isDirty: boolean;
  isSaving: boolean;
  undoStack: string[];     // JSON snapshots
  redoStack: string[];
  undoPointer: number;
}

// Auto-save hook
function useAutoSave(canvas: fabric.Canvas, state: EditorState) {
  const saveTimer = useRef<NodeJS.Timeout>();
  const updateMutation = useMutation(api.presentations.update);

  useEffect(() => {
    if (!state.isDirty) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const json = JSON.stringify(canvas.toJSON());
      const updatedSlides = state.slides.map((s, i) =>
        i === state.activeSlideIndex
          ? { ...s, canvasJson: json }
          : s
      );
      await updateMutation({
        id: state.presentationId,
        slides: updatedSlides,
      });
      dispatch({ type: 'SAVED' });
    }, 2000);
  }, [state.isDirty]);
}
```

## 5. PPTX Import Pipeline

```
.pptx file (user upload)
    │
    ▼
┌──────────┐
│  JSZip   │  Unzip OOXML archive
└────┬─────┘
     │
     ▼
┌──────────────────┐
│ Parse slide XMLs │  ppt/slides/slide1.xml, slide2.xml...
│ + relationships  │  ppt/slides/_rels/slide1.xml.rels
│ + media files    │  ppt/media/image1.png, image2.jpg...
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Transform to     │  XML elements → Fabric.js objects
│ Fabric.js JSON   │
│                  │  <a:txBody> → fabric.Textbox
│                  │  <p:sp>     → fabric.Rect/Circle/Path
│                  │  <a:blip>   → fabric.Image (base64)
│                  │  Backgrounds → canvas.backgroundColor
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Create slides    │  One Convex slide record per parsed slide
│ in Convex        │  Upload extracted images to _storage
└──────────────────┘
```

### Unit Conversion

PPTX uses EMU (English Metric Units). 1 inch = 914400 EMU. Standard slide = 12192000 × 6858000 EMU = 10" × 7.5" (4:3) or 13.33" × 7.5" (16:9).

```typescript
const EMU_PER_PIXEL = 914400 / 96; // 9525 EMU per pixel at 96 DPI
function emuToPixels(emu: number): number {
  return Math.round(emu / EMU_PER_PIXEL);
}
```

## 6. PPTX Export Pipeline

```
Fabric.js Canvas State
    │
    ▼
┌──────────────────────┐
│ Iterate slides       │
│ For each slide:      │
│   canvas.getObjects()│
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│ Map to PptxGenJS     │
│                      │
│  Textbox → addText() │  Position: px → inches (/96)
│  Rect    → addShape()│  Colors: hex preserved
│  Image   → addImage()│  Encode as base64
│  Line    → addShape()│  Map stroke/fill
│  Group   → flatten   │  Ungroup, map individually
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│ pptx.writeFile()     │  Generate .pptx blob
│ → FileSaver.saveAs() │  Trigger browser download
└──────────────────────┘
```

### Coordinate Mapping

```typescript
function pxToInches(px: number): number {
  return px / 96;
}

function fabricObjToSlideElement(obj: fabric.Object, slide: PptxGenJS.Slide) {
  const x = pxToInches(obj.left ?? 0);
  const y = pxToInches(obj.top ?? 0);
  const w = pxToInches((obj.width ?? 0) * (obj.scaleX ?? 1));
  const h = pxToInches((obj.height ?? 0) * (obj.scaleY ?? 1));

  switch (obj.type) {
    case 'Textbox':
    case 'IText':
      slide.addText((obj as fabric.Textbox).text ?? '', {
        x, y, w, h,
        fontSize: (obj as fabric.Textbox).fontSize ?? 16,
        fontFace: (obj as fabric.Textbox).fontFamily ?? 'Arial',
        color: (obj as fabric.Textbox).fill?.toString() ?? '000000',
        bold: (obj as fabric.Textbox).fontWeight === 'bold',
        align: (obj as fabric.Textbox).textAlign as any,
        rotate: obj.angle ?? 0,
      });
      break;
    case 'Rect':
      slide.addShape('rect', {
        x, y, w, h,
        fill: { color: (obj.fill as string) ?? 'FFFFFF' },
        line: obj.stroke ? { color: obj.stroke, width: obj.strokeWidth ?? 1 } : undefined,
        rectRadius: (obj as fabric.Rect).rx ?? 0,
        rotate: obj.angle ?? 0,
      });
      break;
    case 'Image':
      slide.addImage({
        data: (obj as fabric.Image).toDataURL({ format: 'png' }),
        x, y, w, h,
        rotate: obj.angle ?? 0,
      });
      break;
  }
}
```

## 7. Editor Component Tree

```
PresentationStudioPage
├── PresentationLanding              (CRUD grid — when no id in URL)
│   ├── PresentationCard[]           (thumbnail + actions)
│   ├── CreateNewModal               (template picker)
│   └── DeleteConfirmDialog
│
└── PresentationEditor               (when :id in URL)
    ├── EditorTopToolbar
    │   ├── UndoRedoButtons
    │   ├── ZoomControls
    │   ├── SlideNavigator (prev/next)
    │   ├── SaveStatusBadge
    │   └── ExportDropdown (PPTX, PDF, PNG, JSON)
    │
    ├── EditorWorkspace (flex row)
    │   ├── LeftSidebar
    │   │   ├── TemplatesPanel
    │   │   ├── ElementsPanel (shapes, icons)
    │   │   ├── TextPanel (presets, add textbox)
    │   │   ├── UploadsPanel (image library)
    │   │   ├── BackgroundPanel
    │   │   └── BrandKitPanel
    │   │
    │   ├── CanvasArea
    │   │   └── FabricCanvas (ref-controlled)
    │   │
    │   └── RightSidebar (PropertiesPanel)
    │       ├── PositionSizeControls
    │       ├── FillStrokeControls
    │       ├── TextFormattingControls
    │       ├── ShadowControls
    │       ├── OpacityControl
    │       └── LayerControls
    │
    └── BottomFilmstrip
        ├── SlideThumbnail[]
        ├── AddSlideButton
        └── SlideContextMenu
```

## 8. File Size & Storage Estimates

| Content | Estimated Size | Storage |
|---------|---------------|---------|
| Single slide canvas JSON (text + shapes) | 2–15 KB | Convex document field |
| Single slide canvas JSON (with embedded image base64) | 50–500 KB | ⚠️ Store images in `_storage`, reference by URL |
| Slide thumbnail (PNG, 384×216) | 20–80 KB | Convex `_storage` |
| Uploaded image (photo, compressed) | 100 KB – 2 MB | Convex `_storage` |
| Full presentation (20 slides, no images) | 40–300 KB | Convex document |
| Full presentation (20 slides, 10 images) | 40–300 KB JSON + 1–20 MB storage | Split: JSON in doc, blobs in storage |
| Exported PPTX (20 slides) | 1–15 MB | Generated client-side, not stored |

### Key Decision: Images by Reference

Canvas JSON must NOT embed base64 images inline — too large for Convex document limits. Instead:

1. Upload image → Convex `_storage` → get `storageId`
2. Get signed URL → use as `fabric.Image.src`
3. Canvas JSON stores the URL string, not the binary
4. On re-load, Fabric.js fetches image from URL automatically

## 9. Performance Targets

| Metric | Target |
|--------|--------|
| Editor initial load (empty slide) | < 1.5s |
| Switch between slides | < 300ms |
| Auto-save roundtrip | < 500ms |
| Canvas render with 30 objects | 60 FPS |
| PPTX import (10 slides) | < 5s |
| PPTX export (20 slides) | < 3s |
| PDF export (20 slides, 150 DPI) | < 8s |

## 10. Security

- All mutations require `getAuthUserId(ctx)` + admin role check.
- Media uploads go through authenticated `generateUploadUrl`.
- Presentation data is never publicly accessible — admin-only queries.
- Exported files are generated client-side (no server-side rendering needed).
- Storage URLs are time-limited signed URLs from Convex.
