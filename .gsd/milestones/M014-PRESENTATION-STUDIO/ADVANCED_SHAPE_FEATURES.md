# Advanced Shape Features Implementation Guide

This document outlines the advanced shape property schema added to the Presentation Studio. These properties are stored as part of the `canvasJson` payload in the Convex backend and should be supported by both the Flutter mobile client and the React/Fabric.js desktop client.

## Context
Since the Convex backend (`presentations` table) stores the slide canvas data as a serialized JSON string in the `canvasJson` field, no backend schema migrations or API modifications are required to support advanced shape properties. The backend is completely agnostic to the contents of `canvasJson`.

Both the web and mobile clients must agree on the JSON structure of a `CanvasObject` to ensure cross-platform compatibility when loading presentations.

## New Properties

The `CanvasObject` interface (used in both Flutter and React) has been extended with the following properties:

### 1. Outline (Stroke) Properties
These properties define the border or outline of a shape.

- **`strokeColor`** (`number` / `int`): The color of the outline, represented as an ARGB integer (Flutter) or converted to a CSS color string (Web). Default: `0x00000000` (transparent).
- **`strokeWidth`** (`number` / `double`): The thickness of the outline in logical pixels. Default: `0.0`.

### 2. Shadow Properties
These properties define a drop shadow effect for the shape.

- **`shadowColor`** (`number` / `int`): The color of the shadow, represented as an ARGB integer. Default: `0x00000000` (transparent).
- **`shadowBlur`** (`number` / `double`): The blur radius of the shadow. Default: `0.0`.
- **`shadowOffsetX`** (`number` / `double`): The horizontal displacement of the shadow. Default: `0.0`.
- **`shadowOffsetY`** (`number` / `double`): The vertical displacement of the shadow. Default: `0.0`.

### 3. Rotation Properties
These properties define the rotation of a shape.

- **`angle`** (`number` / `double`): The rotation angle in degrees (0-360). Default: `0.0`.

### 4. Image Properties
When the shape `type` is `"image"`, the following additional properties are used:

- **`src`** (`string`): The URL of the image. This can be a Convex storage URL or an external URL.
- **`mirrorX`** (`boolean`): Whether the image is flipped horizontally. Default: `false`.
- **`mirrorY`** (`boolean`): Whether the image is flipped vertically. Default: `false`.
- **`cropX`, `cropY`, `cropWidth`, `cropHeight`** (`number` / `double`): Optional. If specified, defines the crop rect relative to the original image dimensions.

## JSON Schema Example
A serialized shape object in `canvasJson` will now look like this:

```json
{
  "type": "rect",
  "x": 100,
  "y": 150,
  "width": 200,
  "height": 100,
  "color": 4280391411,
  "opacity": 1.0,
  "strokeColor": 4278190080,
  "strokeWidth": 2.0,
  "shadowColor": 1140850688,
  "shadowBlur": 10.0,
  "shadowOffsetX": 5.0,
  "shadowOffsetY": 5.0,
  "angle": 45.0
}
```

Example for an image object:
```json
{
  "type": "image",
  "x": 200,
  "y": 200,
  "width": 300,
  "height": 300,
  "src": "https://example.com/image.png",
  "mirrorX": true,
  "mirrorY": false,
  "angle": 0.0
}
```

## Desktop (React/Fabric.js) Implementation Requirements

To achieve parity with the mobile app, the Desktop Presentation Studio must map these JSON properties to Fabric.js object properties when parsing `canvasJson`:

1. **Stroke**: Map `strokeColor` to `fabric.Object.stroke` (after converting the ARGB int to a hex/rgba string) and `strokeWidth` to `fabric.Object.strokeWidth`.
2. **Shadow**: Instantiate a `fabric.Shadow` object and assign it to `fabric.Object.shadow`:
   ```javascript
   new fabric.Shadow({
     color: argbToRgbaString(json.shadowColor),
     blur: json.shadowBlur,
     offsetX: json.shadowOffsetX,
     offsetY: json.shadowOffsetY
   })
   ```
3. **Rotation**: Map `angle` to `fabric.Object.angle`.
4. **Image**: For type `image`, use `fabric.Image.fromURL(json.src, ...)`. Apply `flipX` (for `mirrorX`) and `flipY` (for `mirrorY`).
5. **Property Editor UI**: Update the desktop properties panel to include:
   - A stroke color picker and a stroke width slider.
   - A shadow color picker, blur slider, and offset X/Y sliders.
   - A rotation input/slider.
   - For images, toggles for flip X/Y and an image uploader.
