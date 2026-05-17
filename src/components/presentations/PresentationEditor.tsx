import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { toast } from "react-hot-toast";
import {
  ArrowLeft, Undo2, Redo2, ZoomIn, ZoomOut, Save, Download,
  Plus, Trash2, Square, Circle, Triangle, Type, Minus,
  Image, ChevronLeft, ChevronRight, Layers, AlignLeft,
  Bold, Italic, Underline, Copy, Play,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useFabricCanvas, useCanvasHistory } from "./useFabricCanvas";

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
      className={`flex flex-col items-center gap-1 rounded-xl p-2.5 text-[10px] font-bold transition-colors w-full
        ${active ? "bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]" :
          danger ? "hover:bg-red-500/10 text-[hsl(var(--muted-foreground))] hover:text-red-500" :
          "hover:bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))]"}`}
    >
      <Icon size={18} />
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
    el.width = width * scale;
    el.height = height * scale;
    // Draw placeholder gradient
    const ctx = el.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = isActive ? "#1e40af22" : "#f1f5f9";
    ctx.fillRect(0, 0, el.width, el.height);
    ctx.fillStyle = "#94a3b8";
    ctx.font = `${12 * scale}px Inter`;
    ctx.textAlign = "center";
    ctx.fillText(`Slide ${index + 1}`, el.width / 2, el.height / 2);
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
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const presentation = useQuery(api.presentations.get, { id: presentationId as Id<"presentations"> });
  const updateMut = useMutation(api.presentations.update);

  const [activeSlide, setActiveSlide] = useState(0);
  const [zoom, setZoom] = useState(0.5);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [slides, setSlides] = useState<Array<{ id: string; canvasJson: string; order: number }>>([]);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [activePanel, setActivePanel] = useState<"elements" | "text" | "bg" | "layers" | null>("elements");

  const history = useCanvasHistory();
  const canvas = useFabricCanvas(canvasEl, {
    width: SLIDE_W,
    height: SLIDE_H,
    onModified: (json) => {
      history.push(json);
      scheduleSave(json);
    },
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

  if (!presentation) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(var(--background))]">
        <div className="text-[hsl(var(--muted-foreground))] animate-pulse">Loading editor…</div>
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
        <button onClick={handleExportJson} className="flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-bold hover:bg-[hsl(var(--muted)/0.5)]">
          <Download size={12} /> Export
        </button>
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
