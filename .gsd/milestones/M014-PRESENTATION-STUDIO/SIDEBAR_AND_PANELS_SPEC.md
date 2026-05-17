# Desktop Presentation Studio: Sidebar & Floating Panels Specification

This document details the architectural and UI/UX requirements for the **Presentation Studio** panels, ensuring complete feature parity with the mobile (`Flutter`) implementation. The desktop version (`Fabric.js` / React) must adopt these exact workflows.

## 1. Left-Hand Tool Rail (The Sidebar)
The primary interaction hub is a fixed, slim left-hand tool rail. It should contain categorized sections with clear tooltips.

**Categories & Tools:**
*   **SHAPES:** Rectangle, Circle, Triangle, Line.
*   **TEXT:** Add Text block.
*   **MEDIA:** Image Upload (Triggers OS file picker; inserts `CanvasObject` of type `image`).
*   **PANELS:** 
    *   **Layers:** Toggles the visibility of the Dockable Layers Panel.
*   **EDIT:** (Enabled only when an object is selected)
    *   Clone, Forward (Bring Forward), Backward (Send Backward), Delete.

## 2. Floating & Movable Properties Panel
Instead of a static right-hand sidebar that cramps the canvas, the properties panel is a **floating, draggable modal**. 

**Core Requirements:**
*   **Draggable:** Users can drag the panel anywhere over the canvas so it never obstructs their active work area.
*   **Context-Aware:** Appears automatically when a `CanvasObject` is selected; hides when deselected.
*   **Tabbed Interface:**
    *   `STYLE`: Fill color, opacity, text styling (Bold, Italic, Underline).
    *   `OUTLINE`: Stroke color, stroke width.
    *   `SHADOW`: Shadow color, blur radius, X/Y offsets.
    *   `IMAGE`: Visible only for image objects. Contains Flip/Mirror controls and **Advanced Crop** controls.

### 2.1 Real-Time Live Crop Preview (Image Tab)
The Image tab contains controls for `cropX`, `cropY`, `cropWidth`, and `cropHeight`. 
*   **Live Preview Constraint:** Adjusting crop sliders must provide a buttery-smooth, 60 FPS live preview on the canvas. 
*   **Performance Optimization:** Do **not** push to the Undo/Redo history stack on every slider tick (this will serialize the entire JSON state and freeze the UI). Instead, update the local memory state during the `onDrag` event, and only push to the Undo stack on `onDragEnd`.
*   **Aspect Ratio Preservation:** When `cropWidth` or `cropHeight` is changed, the physical bounding box (`width` and `height`) of the `CanvasObject` must scale proportionately. This prevents the image from looking "squished" or stretched.

## 3. Dockable Layers Panel (Left Side)
A layer management panel that can be toggled via the Tool Rail. 

**Core Requirements:**
*   **Z-Index Representation:** Displays a vertical list of all objects currently on the active slide. The top of the list represents the topmost object (highest Z-index).
*   **Selection Sync:** Clicking a layer in the panel highlights it on the canvas, and clicking an object on the canvas highlights it in the Layers panel.
*   **Drag-and-Drop Reordering:** Users can click and drag a layer item up or down the list. 
    *   **Data Mutation:** Reordering the list must literally reorder the array of `CanvasObject`s in the slide's state. 
    *   Fabric.js will automatically respect the array rendering order.
*   **Thumbnails / Icons:** Each row should have a small icon indicating its type (e.g., text icon, shape icon, image thumbnail) alongside a brief descriptor.

## 4. Canvas Thumbnails (Paginator & Landing Page)
*   **Paginator Thumbnails:** The bottom filmstrip must not use generic icons. It must render a mini-canvas (or equivalent static representation) of the exact `CanvasObject` data, including images and crops. 
*   **Global Image Cache:** Thumbnails must reuse the same loaded image assets as the main canvas to prevent redundant network requests and ensure instant rendering.
*   **Grid View Parity:** The presentation manager landing page must also parse the `coverJson` (the JSON of the first slide) and render it precisely as a thumbnail.

---
**Note to Desktop Team:** Fabric.js natively supports `cropX` and `cropY`. Ensure the rendering pipeline maps our internal JSON `cropWidth` and `cropHeight` accurately to Fabric's image clipping model.
