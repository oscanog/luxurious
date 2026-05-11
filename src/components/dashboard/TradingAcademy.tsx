import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { BookOpen, Lock, CheckCircle, ChevronRight, ArrowLeft, Trophy, Zap, Star } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

type View = "hub" | "lesson";

export function TradingAcademy() {
  const [currentLevelId, setCurrentLevelId] = useState<Id<"academyLevels"> | null>(null);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const [view, setView] = useState<View>("hub");

  const levels = useQuery(api.academy.getLevels) ?? [];
  const progress = useQuery(api.academy.getUserProgress) ?? [];
  const completeLessonMutation = useMutation(api.academy.completeLesson);

  const completedSlugs = progress.map((p) => p.lessonSlug);

  // Get lessons for selected level
  const currentLessons = useQuery(
    api.academy.getLessons,
    currentLevelId ? { levelId: currentLevelId } : "skip"
  ) ?? [];

  // Get current lesson content
  const currentLesson = useQuery(
    api.academy.getLesson,
    currentSlug ? { slug: currentSlug } : "skip"
  );

  // Get all lessons for all levels (for progress calc)
  const allLevelLessons = levels.map((level) => ({
    level,
    lessonCount: 5, // Each level has 5 lessons
  }));

  const totalLessons = levels.length * 5;
  const xp = completedSlugs.length * 50;

  function getUnlockedLevel() {
    for (let i = 0; i < levels.length; i++) {
      const levelOrder = levels[i].order;
      const levelSlugs = Array.from({ length: 5 }, (_, j) => `${levelOrder}.${j + 1}`);
      const allDone = levelSlugs.every((s) => completedSlugs.includes(s));
      if (!allDone) return levelOrder;
    }
    return levels.length + 1;
  }

  const unlockedLevel = getUnlockedLevel();

  function openLesson(levelId: Id<"academyLevels">, slug: string) {
    setCurrentLevelId(levelId);
    setCurrentSlug(slug);
    setView("lesson");
  }

  async function handleComplete() {
    if (!currentSlug) return;
    await completeLessonMutation({ lessonSlug: currentSlug });

    // Go to next lesson
    const idx = currentLessons.findIndex((l) => l.slug === currentSlug);
    if (idx < currentLessons.length - 1) {
      setCurrentSlug(currentLessons[idx + 1].slug);
    } else {
      setView("hub");
    }
  }

  // -- Lesson View --
  if (view === "lesson" && currentSlug && currentLevelId) {
    const level = levels.find((l) => l._id === currentLevelId);
    const lessonIdx = currentLessons.findIndex((l) => l.slug === currentSlug);
    const isDone = completedSlugs.includes(currentSlug);

    if (!currentLesson || !level) {
      return (
        <div className="p-6 flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    return (
      <div className="p-6 max-w-4xl mx-auto animate-in fade-in duration-300">
        <button onClick={() => setView("hub")} className="flex items-center gap-2 text-sm font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Academy
        </button>

        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md" style={{ background: `${level.color}15`, color: level.color }}>
            {level.subtitle} · Lesson {lessonIdx + 1}/{currentLessons.length}
          </span>
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{currentLesson.duration} read</span>
        </div>

        <h1 className="text-2xl font-black text-[hsl(var(--foreground))] mb-6">{currentLesson.title}</h1>

        <div className="p-8 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm mb-6">
          {currentLesson.content.split("\n\n").map((block, i) => {
            if (block.startsWith("- ") || block.startsWith("1. ")) {
              return (
                <ul key={i} className="space-y-1.5 my-3 ml-1">
                  {block.split("\n").map((line, j) => (
                    <li key={j} className="text-sm text-[hsl(var(--foreground)/0.85)] leading-relaxed flex gap-2">
                      <span className="text-[hsl(var(--primary))] mt-0.5 shrink-0">•</span>
                      <span dangerouslySetInnerHTML={{ __html: line.replace(/^[-\d.]+\s*/, "").replace(/\*\*(.+?)\*\*/g, '<strong class="text-[hsl(var(--foreground))]">$1</strong>') }} />
                    </li>
                  ))}
                </ul>
              );
            }
            return <p key={i} className="text-sm text-[hsl(var(--foreground)/0.85)] leading-relaxed my-3" dangerouslySetInnerHTML={{ __html: block.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[hsl(var(--foreground))]">$1</strong>') }} />;
          })}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isDone && <span className="text-xs font-bold text-green-500 flex items-center gap-1"><CheckCircle size={14} /> Completed</span>}
          </div>
          <button onClick={() => { void handleComplete(); }} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[hsl(var(--primary))] text-white font-black text-sm shadow-lg shadow-[hsl(var(--primary)/0.25)] hover:scale-105 active:scale-95 transition-all">
            {lessonIdx < currentLessons.length - 1 ? "Complete & Next" : "Finish Level"} <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // -- Hub View --
  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[hsl(var(--foreground))]">Trading Academy</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">Master trading from zero to hero. Self-paced. No fluff.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] flex items-center gap-3">
            <Zap size={16} className="text-yellow-500" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">XP Earned</p>
              <p className="text-sm font-extrabold text-[hsl(var(--foreground))] tabular-nums">{xp}</p>
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] flex items-center gap-3">
            <Trophy size={16} className="text-yellow-500" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Progress</p>
              <p className="text-sm font-extrabold text-[hsl(var(--foreground))] tabular-nums">{completedSlugs.length}/{totalLessons}</p>
            </div>
          </div>
        </div>
      </div>

      {/* XP Bar */}
      <div className="p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-[hsl(var(--muted-foreground))]">Overall Progress</p>
          <p className="text-xs font-black text-[hsl(var(--foreground))]">{totalLessons > 0 ? Math.round((completedSlugs.length / totalLessons) * 100) : 0}%</p>
        </div>
        <div className="w-full h-2 bg-[hsl(var(--muted)/0.3)] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${totalLessons > 0 ? (completedSlugs.length / totalLessons) * 100 : 0}%`, background: "linear-gradient(90deg, hsl(221 83% 53%), hsl(152 69% 42%))" }} />
        </div>
      </div>

      {/* Empty State */}
      {levels.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12 text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-[hsl(var(--muted-foreground))] opacity-20" />
          <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">No Academy Content Yet</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2 max-w-md mx-auto">Seed the database using: <code className="text-[hsl(var(--primary))]">npx convex run academy:seedLevel</code></p>
        </div>
      )}

      {/* Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {levels.map((level) => {
          const levelSlugs = Array.from({ length: 5 }, (_, j) => `${level.order}.${j + 1}`);
          const levelCompleted = levelSlugs.filter((s) => completedSlugs.includes(s)).length;
          const isLocked = level.order > unlockedLevel;
          const isComplete = levelCompleted === 5;
          const progress = (levelCompleted / 5) * 100;

          return (
            <LevelCard
              key={level._id}
              level={level}
              levelCompleted={levelCompleted}
              isLocked={isLocked}
              isComplete={isComplete}
              progress={progress}
              completedSlugs={completedSlugs}
              onOpenLesson={(slug) => openLesson(level._id, slug)}
            />
          );
        })}
      </div>
    </div>
  );
}

// Separate component so each level can independently fetch its lessons
function LevelCard({
  level,
  levelCompleted,
  isLocked,
  isComplete,
  progress,
  completedSlugs,
  onOpenLesson,
}: {
  level: any;
  levelCompleted: number;
  isLocked: boolean;
  isComplete: boolean;
  progress: number;
  completedSlugs: string[];
  onOpenLesson: (slug: string) => void;
}) {
  const lessons = useQuery(api.academy.getLessons, { levelId: level._id }) ?? [];

  return (
    <div className={`relative p-6 rounded-2xl border bg-[hsl(var(--card))] transition-all ${isLocked ? "opacity-50 border-[hsl(var(--border))]" : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)] hover:shadow-lg"}`}>
      {isLocked && (
        <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-[hsl(var(--background)/0.5)] backdrop-blur-[2px] z-10">
          <div className="flex flex-col items-center gap-2">
            <Lock size={24} className="text-[hsl(var(--muted-foreground))]" />
            <p className="text-xs font-bold text-[hsl(var(--muted-foreground))]">Complete previous level</p>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black" style={{ background: `${level.color}15`, color: level.color }}>
            {level.order}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: level.color }}>{level.subtitle}</p>
            <h3 className="text-base font-bold text-[hsl(var(--foreground))]">{level.title}</h3>
          </div>
        </div>
        {isComplete ? (
          <span className="px-2.5 py-1 rounded-lg bg-green-500/10 text-green-500 text-[10px] font-black uppercase flex items-center gap-1"><Star size={10} /> Complete</span>
        ) : (
          <span className="text-xs font-bold text-[hsl(var(--muted-foreground))]">{levelCompleted}/5</span>
        )}
      </div>

      <div className="w-full h-1.5 bg-[hsl(var(--muted)/0.3)] rounded-full overflow-hidden mb-5">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: isComplete ? "hsl(152 69% 42%)" : level.color }} />
      </div>

      <div className="space-y-2">
        {lessons.map((lesson) => {
          const isDone = completedSlugs.includes(lesson.slug);
          return (
            <button key={lesson._id} onClick={() => !isLocked && onOpenLesson(lesson.slug)} disabled={isLocked}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${isDone ? "bg-green-500/5" : "hover:bg-[hsl(var(--muted)/0.3)]"}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${isDone ? "bg-green-500/10 text-green-500" : "bg-[hsl(var(--muted)/0.3)] text-[hsl(var(--muted-foreground))]"}`}>
                {isDone ? <CheckCircle size={14} /> : lesson.order}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isDone ? "text-[hsl(var(--foreground)/0.6)]" : "text-[hsl(var(--foreground))]"}`}>{lesson.title}</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{lesson.duration}</p>
              </div>
              <ChevronRight size={14} className="text-[hsl(var(--muted-foreground))] shrink-0" />
            </button>
          );
        })}
        {lessons.length === 0 && !isLocked && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-4">No lessons loaded. Run seed script.</p>
        )}
      </div>
    </div>
  );
}
