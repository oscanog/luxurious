import { useEffect, useRef, useCallback } from "react";
import * as fabric from "fabric";

export interface CanvasState {
  json: string;
  width: number;
  height: number;
}

export function useCanvasHistory(maxSteps = 50) {
  const stackRef = useRef<string[]>([]);
  const pointerRef = useRef(-1);

  const push = useCallback((json: string) => {
    // Truncate forward history
    stackRef.current = stackRef.current.slice(0, pointerRef.current + 1);
    stackRef.current.push(json);
    if (stackRef.current.length > maxSteps) stackRef.current.shift();
    pointerRef.current = stackRef.current.length - 1;
  }, [maxSteps]);

  const undo = useCallback(() => {
    if (pointerRef.current <= 0) return null;
    pointerRef.current--;
    return stackRef.current[pointerRef.current];
  }, []);

  const redo = useCallback(() => {
    if (pointerRef.current >= stackRef.current.length - 1) return null;
    pointerRef.current++;
    return stackRef.current[pointerRef.current];
  }, []);

  const canUndo = () => pointerRef.current > 0;
  const canRedo = () => pointerRef.current < stackRef.current.length - 1;

  return { push, undo, redo, canUndo, canRedo };
}

export function useFabricCanvas(
  canvasElRef: React.RefObject<HTMLCanvasElement | null>,
  options: { width: number; height: number; onModified?: (json: string) => void }
) {
  const fabricRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (!canvasElRef.current) return;
    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: options.width,
      height: options.height,
      backgroundColor: "#ffffff",
      selection: true,
      preserveObjectStacking: true,
      enableRetinaScaling: true,
    });
    fabricRef.current = canvas;

    const onChange = () => {
      if (options.onModified) {
        options.onModified(JSON.stringify(canvas.toJSON()));
      }
    };

    canvas.on("object:modified", onChange);
    canvas.on("object:added", onChange);
    canvas.on("object:removed", onChange);

    return () => {
      canvas.off("object:modified", onChange);
      canvas.off("object:added", onChange);
      canvas.off("object:removed", onChange);
      canvas.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasElRef.current]);

  const loadJson = useCallback(async (json: string) => {
    if (!fabricRef.current) return;
    await fabricRef.current.loadFromJSON(JSON.parse(json));
    fabricRef.current.renderAll();
  }, []);

  const getJson = useCallback(() => {
    if (!fabricRef.current) return "{}";
    return JSON.stringify(fabricRef.current.toJSON());
  }, []);

  const addRect = useCallback(() => {
    if (!fabricRef.current) return;
    const rect = new fabric.Rect({
      left: 100, top: 100, width: 200, height: 120,
      fill: "#D4AF37", rx: 8, ry: 8,
    });
    fabricRef.current.add(rect);
    fabricRef.current.setActiveObject(rect);
    fabricRef.current.renderAll();
  }, []);

  const addCircle = useCallback(() => {
    if (!fabricRef.current) return;
    const circle = new fabric.Circle({ left: 150, top: 150, radius: 60, fill: "#1e3a5f" });
    fabricRef.current.add(circle);
    fabricRef.current.setActiveObject(circle);
    fabricRef.current.renderAll();
  }, []);

  const addTriangle = useCallback(() => {
    if (!fabricRef.current) return;
    const tri = new fabric.Triangle({ left: 100, top: 100, width: 160, height: 140, fill: "#6366f1" });
    fabricRef.current.add(tri);
    fabricRef.current.setActiveObject(tri);
    fabricRef.current.renderAll();
  }, []);

  const addText = useCallback((text = "Click to edit") => {
    if (!fabricRef.current) return;
    const t = new fabric.IText(text, {
      left: 100, top: 100, fontSize: 36, fontFamily: "Inter",
      fill: "#0f172a", fontWeight: "bold",
    });
    fabricRef.current.add(t);
    fabricRef.current.setActiveObject(t);
    fabricRef.current.renderAll();
  }, []);

  const addLine = useCallback(() => {
    if (!fabricRef.current) return;
    const line = new fabric.Line([50, 50, 300, 50], {
      stroke: "#0f172a", strokeWidth: 3, selectable: true,
    });
    fabricRef.current.add(line);
    fabricRef.current.setActiveObject(line);
    fabricRef.current.renderAll();
  }, []);

  const addImageUrl = useCallback((url: string) => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    fabric.FabricImage.fromURL(url, { crossOrigin: "anonymous" }).then(img => {
      const scale = Math.min(400 / (img.width ?? 400), 300 / (img.height ?? 300));
      img.set({ left: 200, top: 150, scaleX: scale, scaleY: scale });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    });
  }, []);

  const deleteSelected = useCallback(() => {
    if (!fabricRef.current) return;
    const objs = fabricRef.current.getActiveObjects();
    fabricRef.current.remove(...objs);
    fabricRef.current.discardActiveObject();
    fabricRef.current.renderAll();
  }, []);

  const bringForward = useCallback(() => {
    fabricRef.current?.getActiveObject() && fabricRef.current.bringObjectForward(fabricRef.current.getActiveObject()!);
    fabricRef.current?.renderAll();
  }, []);

  const sendBackward = useCallback(() => {
    fabricRef.current?.getActiveObject() && fabricRef.current.sendObjectBackwards(fabricRef.current.getActiveObject()!);
    fabricRef.current?.renderAll();
  }, []);

  const duplicateSelected = useCallback(async () => {
    if (!fabricRef.current) return;
    const active = fabricRef.current.getActiveObject();
    if (!active) return;
    const cloned = await active.clone();
    cloned.set({ left: (active.left ?? 0) + 20, top: (active.top ?? 0) + 20 });
    fabricRef.current.add(cloned);
    fabricRef.current.setActiveObject(cloned);
    fabricRef.current.renderAll();
  }, []);

  const setBackground = useCallback((color: string) => {
    if (!fabricRef.current) return;
    fabricRef.current.backgroundColor = color;
    fabricRef.current.renderAll();
  }, []);

  const zoomTo = useCallback((ratio: number) => {
    if (!fabricRef.current) return;
    fabricRef.current.setZoom(ratio);
  }, []);

  const fitToContainer = useCallback((containerW: number, containerH: number) => {
    if (!fabricRef.current) return;
    const scaleX = containerW / fabricRef.current.getWidth();
    const scaleY = containerH / fabricRef.current.getHeight();
    const scale = Math.min(scaleX, scaleY, 1);
    fabricRef.current.setZoom(scale);
  }, []);

  const toDataUrl = useCallback(() => {
    return fabricRef.current?.toDataURL({ format: "png", multiplier: 1 }) ?? "";
  }, []);

  return {
    fabricRef,
    loadJson, getJson,
    addRect, addCircle, addTriangle, addText, addLine, addImageUrl,
    deleteSelected, bringForward, sendBackward, duplicateSelected,
    setBackground, zoomTo, fitToContainer, toDataUrl,
  };
}
