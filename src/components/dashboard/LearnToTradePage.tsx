import { TrendingUp, PlayCircle, BookOpen, BarChart3, ArrowUpRight } from "lucide-react";

export function LearnToTradePage() {
  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Learn to Trade</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">Master the markets with risk-free simulation.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold shadow-lg shadow-[hsl(var(--primary)/0.25)] hover:scale-105 active:scale-95 transition-all">
          <PlayCircle size={18} />
          Start Simulation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Trading Academy", desc: "Learn technical analysis and market psychology.", icon: BookOpen, color: "hsl(221 83% 53%)" },
          { title: "Live Sim", desc: "Real-time data. Fake money. Real experience.", icon: BarChart3, color: "hsl(152 69% 42%)" },
          { title: "Performance", desc: "Track your simulated growth and strategy win-rate.", icon: TrendingUp, color: "hsl(43 96% 48%)" },
        ].map((c) => (
          <div key={c.title} className="p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary)/0.5)] transition-colors group cursor-pointer">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ background: `${c.color}15` }}>
              <c.icon size={24} style={{ color: c.color }} />
            </div>
            <h3 className="text-lg font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
              {c.title}
              <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 text-center border-dashed">
        <TrendingUp size={48} className="mx-auto mb-4 text-[hsl(var(--muted-foreground))] opacity-20" />
        <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Simulation Engine Loading</h2>
        <p className="text-[hsl(var(--muted-foreground))] max-w-md mx-auto mt-2">
          We are currently wiring the real-time market data to the Luxurious simulation environment. Check back soon.
        </p>
      </div>
    </div>
  );
}
