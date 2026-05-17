import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { toast } from "react-hot-toast";
import {
  Plus, Search, Grid3X3, List, ArrowDownUp, Trash2, Copy, Pencil,
  Clock, Layers, Presentation, MoreVertical,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import * as fabric from "fabric";

type SortBy = "updatedAt" | "title";
type SortOrder = "asc" | "desc";

function formatDate(ts: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric",
  }).format(new Date(ts));
}

function CoverThumbnail({ json, className }: { json: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    // Assuming 16:9 ratio, width is clientWidth
    const width = el.parentElement!.clientWidth;
    const height = el.parentElement!.clientHeight;
    
    // The slide width is typically 1920x1080. We need to scale.
    const SLIDE_W = 1920;
    const scale = width / SLIDE_W;
    
    const staticCanvas = new fabric.StaticCanvas(el, {
      width: width,
      height: height,
      backgroundColor: "#ffffff",
    });
    staticCanvas.setZoom(scale);
    
    try {
      staticCanvas.loadFromJSON(json, () => {
        staticCanvas.renderAll();
      });
    } catch(e) {}
    
    return () => {
      staticCanvas.dispose();
    };
  }, [json]);

  return <canvas ref={ref} className={className} />;
}

function CreateModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const createMutation = useMutation(api.presentations.create);
  const templates = useQuery(api.presentations.listTemplates, {});
  const [title, setTitle] = useState("Untitled Presentation");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const CATEGORIES = [
    { id: null, label: "Blank (16:9)", icon: "⬜", desc: "Empty canvas, 1920×1080" },
    { id: "pitch-deck", label: "Pitch Deck", icon: "🚀", desc: "10-slide investor template" },
    { id: "report", label: "Business Report", icon: "📊", desc: "8-slide report template" },
    { id: "proposal", label: "Project Proposal", icon: "📋", desc: "7-slide proposal template" },
  ];

  async function handleCreate() {
    if (!title.trim()) { toast.error("Title required"); return; }
    setCreating(true);
    try {
      const tpl = templates?.find(t => t.category === selectedTemplate);
      const id = await createMutation({
        title: title.trim(),
        templateId: tpl?._id as Id<"presentationTemplates"> | undefined,
      });
      toast.success("Presentation created");
      navigate(`/admin/presentations/${id}/edit`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 shadow-2xl">
        <h2 className="text-xl font-black tracking-tight text-[hsl(var(--foreground))]">New Presentation</h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Choose a starting point</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id ?? "blank"}
              onClick={() => setSelectedTemplate(cat.id)}
              className={`rounded-2xl border-2 p-4 text-left transition-all ${
                selectedTemplate === cat.id
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)]"
                  : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.4)]"
              }`}
            >
              <div className="text-2xl">{cat.icon}</div>
              <div className="mt-2 font-bold text-sm text-[hsl(var(--foreground))]">{cat.label}</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">{cat.desc}</div>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <label className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Title</label>
          <input
            className="mt-2 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))] transition-colors"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCreate()}
            autoFocus
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-[hsl(var(--border))] py-3 text-sm font-bold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex-1 rounded-xl bg-[hsl(var(--primary))] py-3 text-sm font-bold text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PresentationCard({
  item,
  viewMode,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  item: {
    _id: Id<"presentations">;
    title: string;
    slideCount: number;
    updatedAt: number;
    coverThumbnailUrl: string | null;
    coverJson?: string;
    tags?: string[];
  };
  viewMode: "grid" | "list";
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (viewMode === "list") {
    return (
      <div className="group flex items-center gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-4 hover:border-[hsl(var(--primary)/0.3)] transition-all">
        <div className="h-12 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-[hsl(var(--muted)/0.5)] flex items-center justify-center relative">
          {item.coverJson ? (
            <CoverThumbnail json={item.coverJson} className="absolute inset-0 w-full h-full object-cover" />
          ) : item.coverThumbnailUrl ? (
            <img src={item.coverThumbnailUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Presentation size={16} className="text-[hsl(var(--muted-foreground))]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-[hsl(var(--foreground))] truncate">{item.title}</div>
          <div className="flex items-center gap-3 mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            <span className="flex items-center gap-1"><Layers size={11} />{item.slideCount} slides</span>
            <span className="flex items-center gap-1"><Clock size={11} />{formatDate(item.updatedAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="rounded-lg px-3 py-1.5 text-xs font-bold bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">Edit</button>
          <button onClick={onDuplicate} className="rounded-lg p-1.5 hover:bg-[hsl(var(--muted)/0.5)]"><Copy size={14} /></button>
          <button onClick={onDelete} className="rounded-lg p-1.5 hover:bg-red-500/10 text-red-500"><Trash2 size={14} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden hover:border-[hsl(var(--primary)/0.4)] hover:shadow-lg transition-all cursor-pointer">
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-[hsl(var(--muted)/0.6)] to-[hsl(var(--muted)/0.2)] flex items-center justify-center overflow-hidden relative" onClick={onEdit}>
        {item.coverJson ? (
          <CoverThumbnail json={item.coverJson} className="absolute inset-0 w-full h-full object-cover" />
        ) : item.coverThumbnailUrl ? (
          <img src={item.coverThumbnailUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[hsl(var(--muted-foreground))]">
            <Presentation size={32} className="opacity-40" />
            <span className="text-xs opacity-40">{item.slideCount} slides</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm text-[hsl(var(--foreground))] truncate">{item.title}</div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
              <Clock size={10} />{formatDate(item.updatedAt)}
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
            className="ml-2 rounded-lg p-1 hover:bg-[hsl(var(--muted)/0.5)] transition-colors"
          >
            <MoreVertical size={14} className="text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>
      </div>

      {/* Context menu */}
      {menuOpen && (
        <div className="absolute bottom-12 right-3 z-10 w-40 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl py-1">
          <button onClick={() => { setMenuOpen(false); onEdit(); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-[hsl(var(--muted)/0.5)]"><Pencil size={12} />Open Editor</button>
          <button onClick={() => { setMenuOpen(false); onDuplicate(); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-[hsl(var(--muted)/0.5)]"><Copy size={12} />Duplicate</button>
          <div className="my-1 border-t border-[hsl(var(--border))]" />
          <button onClick={() => { setMenuOpen(false); onDelete(); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-500/10"><Trash2 size={12} />Delete</button>
        </div>
      )}
    </div>
  );
}

export function PresentationLanding() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("updatedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteTarget, setDeleteTarget] = useState<Id<"presentations"> | null>(null);

  const items = useQuery(api.presentations.list, { search, sortBy, sortOrder });
  const duplicateMut = useMutation(api.presentations.duplicate);
  const deleteMut = useMutation(api.presentations.hardDelete);

  async function handleDuplicate(id: Id<"presentations">) {
    try {
      const newId = await duplicateMut({ id });
      toast.success("Duplicated!");
      navigate(`/admin/presentations/${newId}/edit`);
    } catch { toast.error("Failed to duplicate"); }
  }

  async function handleDelete(id: Id<"presentations">) {
    try {
      await deleteMut({ id });
      toast.success("Deleted");
      setDeleteTarget(null);
    } catch { toast.error("Failed to delete"); }
  }

  function toggleSort(field: SortBy) {
    if (sortBy === field) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortOrder("desc"); }
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
              <Trash2 className="text-red-500" size={24} />
            </div>
            <h3 className="text-lg font-black text-[hsl(var(--foreground))]">Delete Presentation?</h3>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">This action cannot be undone. All slides and media will be permanently removed.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-[hsl(var(--border))] py-3 text-sm font-bold hover:bg-[hsl(var(--muted)/0.5)] transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteTarget)} className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[hsl(var(--foreground))]">Presentation Studio</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {items === undefined ? "Loading…" : `${items.length} presentation${items.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-2.5 text-sm font-bold text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity shadow-lg"
        >
          <Plus size={16} /> New Presentation
        </button>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input
            className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-2.5 pl-9 pr-4 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))] transition-colors placeholder:text-[hsl(var(--muted-foreground))]"
            placeholder="Search presentations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => toggleSort("updatedAt")}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors ${sortBy === "updatedAt" ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]" : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/0.4)]"}`}
        >
          <Clock size={12} />Date {sortBy === "updatedAt" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
        </button>
        <button
          onClick={() => toggleSort("title")}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors ${sortBy === "title" ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]" : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/0.4)]"}`}
        >
          <ArrowDownUp size={12} />Name {sortBy === "title" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
        </button>
        <div className="flex rounded-xl border border-[hsl(var(--border))] overflow-hidden">
          <button onClick={() => setViewMode("grid")} className={`px-3 py-2.5 transition-colors ${viewMode === "grid" ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "hover:bg-[hsl(var(--muted)/0.5)]"}`}><Grid3X3 size={14} /></button>
          <button onClick={() => setViewMode("list")} className={`px-3 py-2.5 transition-colors ${viewMode === "list" ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "hover:bg-[hsl(var(--muted)/0.5)]"}`}><List size={14} /></button>
        </div>
      </div>

      {/* Grid / List */}
      {items === undefined ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-video rounded-2xl bg-[hsl(var(--muted)/0.3)] animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-[hsl(var(--muted)/0.5)]">
            <Presentation size={36} className="text-[hsl(var(--muted-foreground))] opacity-50" />
          </div>
          <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">{search ? "No results" : "No presentations yet"}</h3>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            {search ? "Try a different search term" : "Create your first presentation to get started"}
          </p>
          {!search && (
            <button onClick={() => setShowCreate(true)} className="mt-6 flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-2.5 text-sm font-bold text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity">
              <Plus size={16} /> Create Presentation
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map(item => (
            <PresentationCard
              key={item._id}
              item={item as any}
              viewMode="grid"
              onEdit={() => navigate(`/admin/presentations/${item._id}/edit`)}
              onDuplicate={() => handleDuplicate(item._id)}
              onDelete={() => setDeleteTarget(item._id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map(item => (
            <PresentationCard
              key={item._id}
              item={item as any}
              viewMode="list"
              onEdit={() => navigate(`/admin/presentations/${item._id}/edit`)}
              onDuplicate={() => handleDuplicate(item._id)}
              onDelete={() => setDeleteTarget(item._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
