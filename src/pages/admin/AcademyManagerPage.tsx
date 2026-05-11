import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Plus, Edit2, Trash2, ChevronLeft, Save, Eye, Layout } from "lucide-react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import toast from "react-hot-toast";

type View = "list" | "edit-level" | "edit-lesson";

export function AcademyManagerPage() {
  const [view, setView] = useState<View>("list");
  const [selectedLevelId, setSelectedLevelId] = useState<Id<"academyLevels"> | null>(null);
  
  const levels = useQuery(api.academy.getLevels) ?? [];
  const lessons = useQuery(api.academy.getLessons, selectedLevelId ? { levelId: selectedLevelId } : "skip") ?? [];
  
  const upsertLevel = useMutation(api.academy.upsertLevel);
  const deleteLevel = useMutation(api.academy.deleteLevel);
  const upsertLesson = useMutation(api.academy.upsertLesson);
  const deleteLesson = useMutation(api.academy.deleteLesson);

  // -- Form States --
  const [levelForm, setLevelForm] = useState<Partial<Doc<"academyLevels">>>({});
  const [lessonForm, setLessonForm] = useState<Partial<Doc<"academyLessons">>>({});
  const [isPreview, setIsPreview] = useState(false);

  async function handleSaveLevel() {
    try {
      await upsertLevel({
        id: levelForm._id,
        order: levelForm.order ?? levels.length + 1,
        title: levelForm.title ?? "",
        subtitle: levelForm.subtitle ?? "",
        color: levelForm.color ?? "hsl(221 83% 53%)",
        description: levelForm.description ?? "",
      });
      toast.success("Level saved");
      setView("list");
    } catch { toast.error("Failed to save level"); }
  }

  async function handleSaveLesson() {
    if (!selectedLevelId) return;
    try {
      await upsertLesson({
        id: lessonForm._id,
        levelId: selectedLevelId,
        order: lessonForm.order ?? lessons.length + 1,
        slug: lessonForm.slug ?? "",
        title: lessonForm.title ?? "",
        duration: lessonForm.duration ?? "",
        content: lessonForm.content ?? "",
      });
      toast.success("Lesson saved");
      setView("edit-level");
    } catch { toast.error("Failed to save lesson"); }
  }

  if (view === "edit-level" && selectedLevelId) {
    const level = levels.find(l => l._id === selectedLevelId);
    return (
      <div className="p-6 space-y-6">
        <button onClick={() => setView("list")} className="flex items-center gap-2 text-sm font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
          <ChevronLeft size={16} /> Back to Levels
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-[hsl(var(--foreground))]">{level?.title}</h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Manage lessons for this module</p>
          </div>
          <button onClick={() => { setLessonForm({ levelId: selectedLevelId, order: lessons.length + 1 }); setView("edit-lesson"); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[hsl(var(--primary))] text-white text-xs font-bold shadow-lg shadow-[hsl(var(--primary)/0.2)]">
            <Plus size={14} /> Add Lesson
          </button>
        </div>

        <div className="p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Edit Level Settings</h3>
            <button onClick={() => void handleSaveLevel()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[hsl(var(--primary))] text-white text-xs font-bold shadow-lg">
              <Save size={14} /> Save Changes
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-[hsl(var(--muted-foreground))]">Title</label>
              <input value={levelForm.title ?? ""} onChange={e => setLevelForm({...levelForm, title: e.target.value})} className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-[hsl(var(--primary))]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-[hsl(var(--muted-foreground))]">Subtitle</label>
              <input value={levelForm.subtitle ?? ""} onChange={e => setLevelForm({...levelForm, subtitle: e.target.value})} className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-[hsl(var(--primary))]" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {lessons.map(lesson => (
            <div key={lesson._id} className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-[hsl(var(--muted)/0.3)] flex items-center justify-center text-xs font-bold text-[hsl(var(--muted-foreground))]">
                  {lesson.order}
                </div>
                <div>
                  <p className="text-sm font-bold text-[hsl(var(--foreground))]">{lesson.title}</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{lesson.slug} · {lesson.duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setLessonForm(lesson); setView("edit-lesson"); }} className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => { if(confirm("Delete lesson?")) { void deleteLesson({ id: lesson._id }); } }} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {lessons.length === 0 && (
            <div className="py-12 text-center border-2 border-dashed border-[hsl(var(--border))] rounded-2xl text-[hsl(var(--muted-foreground))] text-sm">
              No lessons in this level yet.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === "edit-lesson") {
    return (
      <div className="p-6 space-y-6">
        <button onClick={() => setView("edit-level")} className="flex items-center gap-2 text-sm font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
          <ChevronLeft size={16} /> Back to Lessons
        </button>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-[hsl(var(--foreground))]">{lessonForm._id ? "Edit Lesson" : "New Lesson"}</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsPreview(!isPreview)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] text-xs font-bold border border-[hsl(var(--border))]">
              {isPreview ? <Layout size={14} /> : <Eye size={14} />} {isPreview ? "Edit Mode" : "Preview Mode"}
            </button>
            <button onClick={() => void handleSaveLesson()} className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[hsl(var(--primary))] text-white text-xs font-bold shadow-lg shadow-[hsl(var(--primary)/0.2)]">
              <Save size={14} /> Save Lesson
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-[hsl(var(--muted-foreground))]">Lesson Title</label>
              <input value={lessonForm.title ?? ""} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} className="w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-[hsl(var(--primary))]" placeholder="e.g. What is Trading?" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-black uppercase text-[hsl(var(--muted-foreground))]">Slug</label>
                <input value={lessonForm.slug ?? ""} onChange={e => setLessonForm({...lessonForm, slug: e.target.value})} className="w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-[hsl(var(--primary))]" placeholder="1.1" />
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-black uppercase text-[hsl(var(--muted-foreground))]">Duration</label>
                <input value={lessonForm.duration ?? ""} onChange={e => setLessonForm({...lessonForm, duration: e.target.value})} className="w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-[hsl(var(--primary))]" placeholder="5 min" />
              </div>
            </div>
          </div>
          
          <div className="col-span-2 space-y-1.5">
            <label className="text-[10px] font-black uppercase text-[hsl(var(--muted-foreground))]">Content (Markdown)</label>
            {isPreview ? (
              <div className="w-full h-[400px] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-6 overflow-auto prose prose-sm prose-invert max-w-none">
                {lessonForm.content?.split("\n\n").map((block, i) => <p key={i}>{block}</p>)}
              </div>
            ) : (
              <textarea value={lessonForm.content ?? ""} onChange={e => setLessonForm({...lessonForm, content: e.target.value})} className="w-full h-[400px] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl px-4 py-4 text-sm font-medium outline-none focus:border-[hsl(var(--primary))] font-mono resize-none" placeholder="Lesson text goes here..." />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[hsl(var(--foreground))]">Academy Manager</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">Configure learning modules and lessons.</p>
        </div>
        <button onClick={() => { setLevelForm({ order: levels.length + 1 }); setView("edit-level"); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white font-bold text-xs shadow-lg shadow-[hsl(var(--primary)/0.2)] hover:scale-105 active:scale-95 transition-all">
          <Plus size={16} /> Create Level
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {levels.map(level => (
          <div key={level._id} className="p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setLevelForm(level); setView("edit-level"); setSelectedLevelId(level._id); }} className="p-2 rounded-lg bg-[hsl(var(--background))] hover:bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-all">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => { if(confirm("Delete level and all lessons?")) { void deleteLevel({ id: level._id }); } }} className="p-2 rounded-lg bg-[hsl(var(--background))] hover:bg-red-500/10 text-red-500 transition-all">
                  <Trash2 size={14} />
                </button>
             </div>

             <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black" style={{ background: `${level.color}15`, color: level.color }}>
                 {level.order}
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: level.color }}>{level.subtitle}</p>
                 <h3 className="text-base font-bold text-[hsl(var(--foreground))]">{level.title}</h3>
               </div>
             </div>

             <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 mb-6 h-8">{level.description}</p>
             
             <button onClick={() => { setSelectedLevelId(level._id); setView("edit-level"); }} className="w-full py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs font-bold text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary)/0.5)] transition-all">
               Manage Lessons
             </button>
          </div>
        ))}
      </div>
    </div>
  );
}
