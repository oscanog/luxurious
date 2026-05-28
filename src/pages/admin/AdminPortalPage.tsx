import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Users, BarChart3, Activity, ShieldAlert, ChevronRight, Bot } from "lucide-react";
import { Link } from "react-router-dom";

export function AdminPortalPage() {
  const stats = useQuery(api.admin.getPlatformStats);
  const isAdmin = useQuery(api.admin.isAdmin);

  // Not yet determined (query loading)
  if (isAdmin === undefined) return null;

  if (!isAdmin) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="text-center p-8 rounded-3xl border border-red-500/20 bg-red-500/5 max-w-md">
          <ShieldAlert size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-black text-[hsl(var(--foreground))]">Restricted Access</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">You do not have administrative privileges to view this section.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black text-[hsl(var(--foreground))]">Platform Administration</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">Global oversight and system management.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Users", value: stats?.userCount ?? "...", icon: Users, color: "hsl(221 83% 53%)" },
          { label: "Total Trades", value: stats?.tradeCount ?? "...", icon: BarChart3, color: "hsl(152 69% 42%)" },
          { label: "Open Positions", value: stats?.openPositions ?? "...", icon: Activity, color: "hsl(43 96% 48%)" },
        ].map((s) => (
          <div key={s.label} className="p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <s.icon size={20} style={{ color: s.color }} />
              </div>
              <span className="text-[10px] font-black text-[hsl(var(--muted-foreground))] uppercase tracking-widest">Global</span>
            </div>
            <p className="text-3xl font-black text-[hsl(var(--foreground))] tabular-nums">{s.value}</p>
            <p className="text-xs font-bold text-[hsl(var(--muted-foreground))] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-6">Management Tools</h3>
          <div className="space-y-3">
            {[
              { title: "Academy Content Manager", desc: "Edit levels, lessons, and slugs.", path: "/admin/academy" },
              { title: "AI Agent Settings", desc: "Manage DeepSeek V4, keys, limits, skills, and scope.", path: "/admin/ai-settings", icon: Bot },
              { title: "User Directory", desc: "Manage roles and virtual balances.", path: "/admin/users" },
              { title: "Global Trade Monitor", desc: "View all live and past trades.", path: "/admin/trades" },
              { title: "Profile + Security", desc: "Review profile, rank, and password workflow.", path: "/profile" },
            ].map((tool) => (
              <Link 
                key={tool.title} 
                to={tool.path}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] hover:border-[hsl(var(--primary)/0.5)] transition-all group"
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-[hsl(var(--foreground))]">{tool.title}</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{tool.desc}</p>
                </div>
                <ChevronRight size={16} className="text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-dashed border-[hsl(var(--border))] flex items-center justify-center">
          <div className="text-center">
            <Activity size={32} className="mx-auto mb-2 text-[hsl(var(--muted-foreground))] opacity-20" />
            <p className="text-xs font-bold text-[hsl(var(--muted-foreground))]">Real-time health monitor coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
