import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { toast } from "react-hot-toast";
import {
  ArrowLeft, Undo2, Redo2, ZoomIn, ZoomOut, Save, Download,
  Plus, Trash2, Square, Circle, Triangle, Type, Minus,
  ChevronLeft, ChevronRight, Layers, Copy, Upload,
  FileDown, Presentation,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useFabricCanvas, useCanvasHistory } from "./useFabricCanvas";
import { exportToPptx, exportToPdf } from "./exportUtils";
import { parsePptx } from "./pptxImport";
import * as fabric from "fabric";

const SLIDE_W = 1920;
const SLIDE_H = 1080;
const DEBOUNCE_MS = 2000;

function ToolBtn({ icon: Icon, label, onClick, active = false, danger = false }: {
  icon: React.ElementType; label: string; onClick: () => void; active?: boolean; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex flex-col items-center gap-1 rounded-xl p-2.5 text-[10px] font-bold transition-colors w-full
        ${active ? "bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]" :
          danger ? "hover:bg-red-500/10 text-[hsl(var(--muted-foreground))] hover:text-red-500" :
          "hover:bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))]"}`}
    >
      <Icon size={18} aria-hidden="true" />
      <span className="hidden lg:block leading-none">{label}</span>
    </button>
  );
}

function SlideThumbnail({ json, width, height, isActive, index, onClick, onDelete }: {
  json: string; width: number; height: number;
  isActive: boolean; index: number;
  onClick: () => void; onDelete: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const scale = el.parentElement!.clientWidth / width;
    
    // Create a temporary static canvas to render the JSON
    const staticCanvas = new fabric.StaticCanvas(el, {
      width: width * scale,
      height: height * scale,
      backgroundColor: isActive ? "#f8fafc" : "#ffffff",
    });

    staticCanvas.setZoom(scale);

    try {
      staticCanvas.loadFromJSON(json, () => {
        staticCanvas.renderAll();
      });
    } catch (e) {
      console.error("Failed to render slide thumbnail", e);
    }

    return () => {
      staticCanvas.dispose();
    };
  }, [json, isActive, width, height, index]);

  return (
    <div
      className={`group relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all
        ${isActive ? "border-[hsl(var(--primary))] shadow-md" : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.4)]"}`}
      onClick={onClick}
    >
      <canvas ref={ref} className="w-full block" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity">
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="rounded-full bg-red-500 p-1 text-white"
        >
          <Trash2 size={10} />
        </button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black/40 py-0.5 text-center text-[9px] text-white font-bold">
        {index + 1}
      </div>
    </div>
  );
}

export function PresentationEditor({ presentationId }: { presentationId: string }) {
  const navigate = useNavigate();
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const presentation = useQuery(api.presentations.get, { id: presentationId as Id<"presentations"> });
  const updateMut = useMutation(api.presentations.update);

  const [activeSlide, setActiveSlide] = useState(0);
  const [zoom, setZoom] = useState(0.4);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [slides, setSlides] = useState<Array<{ id: string; canvasJson: string; order: number }>>([]);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [activeObjProps, setActiveObjProps] = useState<any>(null);
  const generateUploadUrl = useMutation(api.presentations.generateUploadUrl);

  const history = useCanvasHistory();
  const canvas = useFabricCanvas(canvasEl, {
    width: SLIDE_W,
    height: SLIDE_H,
    onModified: (json) => {
      history.push(json);
      scheduleSave(json);
    },
    onSelect: (obj) => {
      if (obj) {
        setActiveObjProps({
          type: obj.type,
          fill: obj.fill,
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth,
          opacity: obj.opacity,
          fontFamily: obj.fontFamily,
          fontSize: obj.fontSize,
          fontWeight: obj.fontWeight,
          fontStyle: obj.fontStyle,
          textAlign: obj.textAlign,
          underline: obj.underline,
        });
      } else {
        setActiveObjProps(null);
      }
    }
  });

  // Load presentation into local state
  useEffect(() => {
    if (presentation?.slides) {
      setSlides(presentation.slides.map(s => ({ id: s.id, canvasJson: s.canvasJson, order: s.order })));
    }
  }, [presentation?._id]);

  // Load active slide into canvas
  useEffect(() => {
    const slide = slides[activeSlide];
    if (slide && canvas.fabricRef.current) {
      canvas.loadJson(slide.canvasJson);
      history.push(slide.canvasJson);
    }
  }, [activeSlide, canvas.fabricRef.current]);

  function scheduleSave(json: string) {
    clearTimeout(saveTimer.current);
    // Update local slides state
    setSlides(prev => prev.map((s, i) => i === activeSlide ? { ...s, canvasJson: json } : s));
    saveTimer.current = setTimeout(() => persistSave(), DEBOUNCE_MS);
  }

  const persistSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const current = slides.map((s, i) =>
        i === activeSlide ? { ...s, canvasJson: canvas.getJson() } : s
      );
      await updateMut({ id: presentationId as Id<"presentations">, slides: current });
      setSavedAt(new Date());
    } catch { toast.error("Save failed"); }
    finally { setIsSaving(false); }
  }, [slides, activeSlide, presentationId, updateMut, canvas]);

  function handleUndo() {
    const json = history.undo();
    if (json) canvas.loadJson(json);
  }

  function handleRedo() {
    const json = history.redo();
    if (json) canvas.loadJson(json);
  }

  function addSlide() {
    const blank = JSON.stringify({ version: "6.0.0", objects: [], background: "#ffffff" });
    const newSlide = { id: crypto.randomUUID(), canvasJson: blank, order: slides.length };
    setSlides(prev => [...prev, newSlide]);
    setActiveSlide(slides.length);
  }

  function deleteSlide(idx: number) {
    if (slides.length <= 1) { toast.error("Cannot delete last slide"); return; }
    setSlides(prev => prev.filter((_, i) => i !== idx));
    setActiveSlide(prev => Math.max(0, prev > idx ? prev - 1 : prev));
  }

  async function handleExportJson() {
    const data = JSON.stringify({ title: presentation?.title, slides }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${presentation?.title ?? "presentation"}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey;
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (ctrl && e.key === "z" && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if (ctrl && (e.key === "Z" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); handleRedo(); }
      if (ctrl && e.key === "s") { e.preventDefault(); persistSave(); }
      if (ctrl && e.key === "d") { e.preventDefault(); canvas.duplicateSelected(); }
      if (e.key === "Delete" || e.key === "Backspace") canvas.deleteSelected();
      if (ctrl && e.key === "+") { e.preventDefault(); setZoom(z => Math.min(2, z + 0.1)); }
      if (ctrl && e.key === "-") { e.preventDefault(); setZoom(z => Math.max(0.1, z - 0.1)); }
      if (ctrl && e.key === "0") { e.preventDefault(); setZoom(0.5); }
      if (e.key === "t" || e.key === "T") canvas.addText();
      if (e.key === "r" || e.key === "R") canvas.addRect();
      if (e.key === "c" && !ctrl) canvas.addCircle();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canvas, persistSave]);

  // Image upload
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await generateUploadUrl();
      const res = await fetch(url, { method: "POST", body: file, headers: { "Content-Type": file.type } });
      await res.json();
      // Get URL from Convex
      const reader = new FileReader();
      reader.onload = ev => canvas.addImageUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    } catch { toast.error("Image upload failed"); }
  }

  // PPTX import
  async function handlePptxImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast("Importing…");
      const imported = await parsePptx(file);
      setSlides(imported);
      setActiveSlide(0);
      toast.success(`Imported ${imported.length} slides`);
    } catch { toast.error("Import failed"); }
  }

  // PPTX export
  async function handleExportPptx() {
    if (!presentation) return;
    try {
      toast("Generating PPTX…");
      const current = slides.map((s, i) =>
        i === activeSlide ? { ...s, canvasJson: canvas.getJson() } : s
      );
      await exportToPptx(presentation.title, current, presentation.slideWidth, presentation.slideHeight);
      toast.success("Downloaded!");
    } catch (e: any) { toast.error(e.message ?? "Export failed"); }
  }

  // PDF export
  async function handleExportPdf() {
    if (!presentation) return;
    try {
      toast("Generating PDF…");
      const dataUrls = slides.map(() => canvas.toDataUrl()); // simplified — would render each slide
      await exportToPdf(presentation.title, dataUrls);
      toast.success("Downloaded!");
    } catch (e: any) { toast.error(e.message ?? "PDF export failed"); }
  }
  if (presentation === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(var(--background))]">
        <div className="text-[hsl(var(--muted-foreground))] animate-pulse">Loading editor…</div>
      </div>
    );
  }
  if (presentation === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(var(--background))]">
        <div className="text-red-500">Presentation not found</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[hsl(var(--background))] overflow-hidden">
      {/* Top toolbar */}
      <div className="flex h-13 flex-shrink-0 items-center gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4">
        <button onClick={() => navigate("/admin/presentations")} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
          <ArrowLeft size={14} /> Back
        </button>
        <div className="h-5 w-px bg-[hsl(var(--border))]" />
        <span className="text-sm font-bold text-[hsl(var(--foreground))] truncate max-w-48">{presentation.title}</span>
        <div className="flex-1" />

        {/* Undo/Redo */}
        <button onClick={handleUndo} title="Undo (Ctrl+Z)" className="rounded-lg p-2 hover:bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))]"><Undo2 size={15} /></button>
        <button onClick={handleRedo} title="Redo (Ctrl+Shift+Z)" className="rounded-lg p-2 hover:bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))]"><Redo2 size={15} /></button>

        {/* Zoom */}
        <div className="flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] px-2 py-1">
          <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"><ZoomOut size={12} /></button>
          <span className="text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"><ZoomIn size={12} /></button>
        </div>

        {/* Save status */}
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          {isSaving ? "Saving…" : savedAt ? `Saved ${savedAt.toLocaleTimeString()}` : ""}
        </span>

        <button onClick={() => persistSave()} className="flex items-center gap-1.5 rounded-lg bg-[hsl(var(--primary))] px-3 py-1.5 text-xs font-bold text-[hsl(var(--primary-foreground))] hover:opacity-90">
          <Save size={12} /> Save
        </button>
        <div className="flex rounded-lg border border-[hsl(var(--border))] overflow-hidden">
          <button onClick={handleExportPptx} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold hover:bg-[hsl(var(--muted)/0.5)] border-r border-[hsl(var(--border))]">
            <Presentation size={12} /> PPTX
          </button>
          <button onClick={handleExportPdf} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold hover:bg-[hsl(var(--muted)/0.5)] border-r border-[hsl(var(--border))]">
            <FileDown size={12} /> PDF
          </button>
          <button onClick={handleExportJson} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold hover:bg-[hsl(var(--muted)/0.5)]">
            <Download size={12} /> JSON
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left toolbar */}
        <div className="w-14 lg:w-20 flex-shrink-0 flex flex-col gap-1 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 overflow-y-auto">
          <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] px-1">Shapes</div>
          <ToolBtn icon={Square} label="Rect" onClick={canvas.addRect} />
          <ToolBtn icon={Circle} label="Circle" onClick={canvas.addCircle} />
          <ToolBtn icon={Triangle} label="Triangle" onClick={canvas.addTriangle} />
          <ToolBtn icon={Minus} label="Line" onClick={canvas.addLine} />
          <div className="my-1 border-t border-[hsl(var(--border))]" />
          <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] px-1">Text</div>
          <ToolBtn icon={Type} label="Text" onClick={() => canvas.addText()} />
          <div className="my-1 border-t border-[hsl(var(--border))]" />
          <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] px-1">Media</div>
          <label className="flex flex-col items-center gap-1 rounded-xl p-2.5 text-[10px] font-bold transition-colors w-full cursor-pointer hover:bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))]">
            <Upload size={18} />
            <span className="hidden lg:block leading-none text-center">Image</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
          <label className="flex flex-col items-center gap-1 rounded-xl p-2.5 text-[10px] font-bold transition-colors w-full cursor-pointer hover:bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))]">
            <FileDown size={18} />
            <span className="hidden lg:block leading-none text-center">Import<br/>PPTX</span>
            <input type="file" accept=".pptx" className="hidden" onChange={handlePptxImport} />
          </label>
          <div className="my-1 border-t border-[hsl(var(--border))]" />
          <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] px-1">Edit</div>
          <ToolBtn icon={Copy} label="Clone" onClick={canvas.duplicateSelected} />
          <ToolBtn icon={Layers} label="Fwd" onClick={canvas.bringForward} />
          <ToolBtn icon={Layers} label="Back" onClick={canvas.sendBackward} />
          <ToolBtn icon={Trash2} label="Delete" onClick={canvas.deleteSelected} danger />
        </div>

        {/* Canvas area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div ref={containerRef} className="flex flex-1 items-center justify-center bg-[hsl(var(--muted)/0.3)] overflow-auto p-8">
            <div
              className="shadow-2xl rounded-sm"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
                width: SLIDE_W,
                height: SLIDE_H,
              }}
            >
              <canvas ref={canvasEl} />
            </div>
          </div>

          {/* Bottom filmstrip */}
          <div className="flex h-28 flex-shrink-0 items-center gap-2 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 overflow-x-auto">
            {slides.map((slide, i) => (
              <div key={slide.id} className="flex-shrink-0 w-28">
                <SlideThumbnail
                  json={slide.canvasJson}
                  width={SLIDE_W}
                  height={SLIDE_H}
                  isActive={i === activeSlide}
                  index={i}
                  onClick={() => setActiveSlide(i)}
                  onDelete={() => deleteSlide(i)}
                />
              </div>
            ))}
            <button
              onClick={addSlide}
              className="flex-shrink-0 w-28 h-16 rounded-lg border-2 border-dashed border-[hsl(var(--border))] flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Right properties panel */}
        <div className="w-56 flex-shrink-0 border-l border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-y-auto p-4">
          <div className="text-xs font-black uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-4">Properties</div>

          {/* Background */}
          <div className="mb-4">
            <label className="text-xs font-bold text-[hsl(var(--muted-foreground))]">Background</label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={e => { setBgColor(e.target.value); canvas.setBackground(e.target.value); }}
                className="h-8 w-8 cursor-pointer rounded-lg border border-[hsl(var(--border))]"
              />
              <span className="text-xs font-mono text-[hsl(var(--foreground))]">{bgColor}</span>
            </div>
          </div>

          {/* Quick bg presets */}
          <div className="mb-4">
            <label className="text-xs font-bold text-[hsl(var(--muted-foreground))]">Presets</label>
            <div className="mt-2 grid grid-cols-5 gap-1">
              {["#ffffff","#0f172a","#1e3a5f","#D4AF37","#6366f1","#ec4899","#10b981","#f59e0b","#ef4444","#64748b"].map(c => (
                <button
                  key={c}
                  title={c}
                  onClick={() => { setBgColor(c); canvas.setBackground(c); }}
                  className="h-6 w-6 rounded-md border border-[hsl(var(--border))] transition-transform hover:scale-110"
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {/* Brand Kit */}
          <div className="mb-4">
            <label className="text-xs font-bold text-[hsl(var(--muted-foreground))]">Brand Kit</label>
            <div className="mt-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2">
              <div className="flex gap-1 mb-2">
                {["#0f172a", "#D4AF37", "#334155", "#ffffff"].map(c => (
                  <button
                    key={c}
                    title={c}
                    onClick={() => { setBgColor(c); canvas.setBackground(c); }}
                    className="h-6 w-6 rounded-sm border border-[hsl(var(--border))]"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  const objs = canvas.fabricRef.current?.getObjects() || [];
                  objs.forEach(obj => {
                    if (obj.type === "i-text" || obj.type === "textbox" || obj.type === "text") {
                      obj.set("fontFamily", "Inter");
                    }
                  });
                  canvas.fabricRef.current?.renderAll();
                  toast.success("Brand fonts applied");
                }}
                className="w-full rounded text-[10px] font-bold bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] py-1.5 hover:bg-[hsl(var(--primary)/0.2)] transition-colors"
              >
                Apply Brand Fonts
              </button>
            </div>
          </div>

          {/* Active Object Properties */}
          {activeObjProps && (
            <div className="mb-4 rounded-xl bg-[hsl(var(--muted)/0.3)] p-3 border border-[hsl(var(--border))]">
              <div className="text-xs font-bold text-[hsl(var(--foreground))] mb-2 border-b border-[hsl(var(--border))] pb-1 capitalize">
                {activeObjProps.type} Settings
              </div>

              {/* Color */}
              <div className="mb-3">
                <label className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase">Fill Color</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={activeObjProps.fill || "#000000"}
                    onChange={e => {
                      setActiveObjProps({ ...activeObjProps, fill: e.target.value });
                      canvas.updateActiveObject("fill", e.target.value);
                    }}
                    className="h-6 w-6 cursor-pointer rounded-sm border border-[hsl(var(--border))]"
                  />
                  <span className="text-[10px] font-mono">{activeObjProps.fill || "None"}</span>
                </div>
              </div>

              {/* Opacity */}
              <div className="mb-3">
                <label className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase">Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={activeObjProps.opacity ?? 1}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    setActiveObjProps({ ...activeObjProps, opacity: val });
                    canvas.updateActiveObject("opacity", val);
                  }}
                  className="mt-1 w-full"
                />
              </div>

              {/* Text specific */}
              {(activeObjProps.type === "i-text" || activeObjProps.type === "textbox" || activeObjProps.type === "text") && (
                <>
                  <div className="mb-3">
                    <label className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase">Font Size</label>
                    <input
                      type="number"
                      value={activeObjProps.fontSize || 24}
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setActiveObjProps({ ...activeObjProps, fontSize: val });
                        canvas.updateActiveObject("fontSize", val);
                      }}
                      className="mt-1 w-full rounded border px-2 py-1 text-xs"
                    />
                  </div>
                  <div className="mb-3 flex gap-1">
                    <button
                      onClick={() => {
                        const val = activeObjProps.fontWeight === "bold" ? "normal" : "bold";
                        setActiveObjProps({ ...activeObjProps, fontWeight: val });
                        canvas.updateActiveObject("fontWeight", val);
                      }}
                      className={`flex-1 rounded p-1 text-xs font-bold ${activeObjProps.fontWeight === "bold" ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "bg-[hsl(var(--muted))]"} transition-colors`}
                    >B</button>
                    <button
                      onClick={() => {
                        const val = activeObjProps.fontStyle === "italic" ? "normal" : "italic";
                        setActiveObjProps({ ...activeObjProps, fontStyle: val });
                        canvas.updateActiveObject("fontStyle", val);
                      }}
                      className={`flex-1 rounded p-1 text-xs italic ${activeObjProps.fontStyle === "italic" ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "bg-[hsl(var(--muted))]"} transition-colors`}
                    >I</button>
                    <button
                      onClick={() => {
                        const val = !activeObjProps.underline;
                        setActiveObjProps({ ...activeObjProps, underline: val });
                        canvas.updateActiveObject("underline", val);
                      }}
                      className={`flex-1 rounded p-1 text-xs underline ${activeObjProps.underline ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "bg-[hsl(var(--muted))]"} transition-colors`}
                    >U</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Slide info */}
          <div className="mb-4 rounded-xl bg-[hsl(var(--muted)/0.3)] p-3">
            <div className="text-xs font-bold text-[hsl(var(--muted-foreground))]">Slide</div>
            <div className="mt-1 text-lg font-black text-[hsl(var(--foreground))]">{activeSlide + 1} / {slides.length}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">{SLIDE_W} × {SLIDE_H}px</div>
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveSlide(i => Math.max(0, i - 1))}
              disabled={activeSlide === 0}
              className="flex-1 flex items-center justify-center rounded-lg border border-[hsl(var(--border))] py-2 hover:bg-[hsl(var(--muted)/0.5)] disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setActiveSlide(i => Math.min(slides.length - 1, i + 1))}
              disabled={activeSlide === slides.length - 1}
              className="flex-1 flex items-center justify-center rounded-lg border border-[hsl(var(--border))] py-2 hover:bg-[hsl(var(--muted)/0.5)] disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
