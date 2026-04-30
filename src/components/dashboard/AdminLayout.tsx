import { useState } from "react";
import { Network, Users, Mail, Settings, ChevronLeft, ChevronRight, LogOut, Moon, Sun } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { cn } from "@/lib/utils";

export type NavItem = "org-chart" | "members" | "invitations" | "settings";

const NAV_ITEMS: { key: NavItem; label: string; icon: React.ElementType }[] = [
  { key: "org-chart", label: "Org Chart", icon: Network },
  { key: "members", label: "Members", icon: Users },
  { key: "invitations", label: "Invitations", icon: Mail },
  { key: "settings", label: "Settings", icon: Settings },
];

const PAGE_LABELS: Record<NavItem, string> = {
  "org-chart": "Organization Chart",
  members: "Members",
  invitations: "Invitations",
  settings: "Settings",
};

interface SidebarProps {
  active: NavItem;
  onNavigate: (item: NavItem) => void;
  collapsed: boolean;
  onToggle: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

function Sidebar({ active, onNavigate, collapsed, onToggle, darkMode, onToggleDark }: SidebarProps) {
  const { signOut } = useAuthActions();
  return (
    <aside
      className="flex flex-col h-screen border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-all duration-300 shrink-0 relative"
      style={{ width: collapsed ? 64 : 232 }}
    >
      {/* Branding */}
      <div className="relative overflow-hidden flex items-center gap-3 p-4 shrink-0" style={{ background: "#2563eb", minHeight: 64 }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
        <div className="relative z-10 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
          <span className="text-white font-extrabold text-base">L</span>
        </div>
        {!collapsed && (
          <div className="relative z-10 overflow-hidden">
            <p className="text-white font-extrabold text-sm truncate">Luxurious</p>
            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-[0.18em] truncate">Trading Group</p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button onClick={onToggle} className="absolute -right-3 top-12 z-20 w-6 h-6 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] shadow-sm transition-colors">
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {!collapsed && <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">Management</p>}
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button key={key} onClick={() => onNavigate(key)} title={collapsed ? label : undefined}
              className={cn("w-full flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-all",
                isActive ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
              )}>
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
              {isActive && !collapsed && <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "hsl(43 96% 48%)" }} />}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[hsl(var(--border))] px-2 py-3 space-y-1">
        <button onClick={onToggleDark} title={darkMode ? "Light mode" : "Dark mode"}
          className="w-full flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors">
          {darkMode ? <Sun size={18} className="shrink-0" /> : <Moon size={18} className="shrink-0" />}
          {!collapsed && <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>}
        </button>
        <button onClick={() => void signOut()}
          className="w-full flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:bg-red-500/10 hover:text-red-500 transition-colors">
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

function TopHeader({ page }: { page: NavItem }) {
  return (
    <header className="h-14 shrink-0 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">{PAGE_LABELS[page]}</h2>
        <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "hsl(43 96% 48%)" }} />
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Administrator</p>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">admin@luxurious.trade</p>
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: "linear-gradient(135deg, hsl(43 96% 48%), hsl(221 83% 53%))" }}>
          AD
        </div>
      </div>
    </header>
  );
}

interface AdminLayoutProps {
  children: React.ReactNode;
  active: NavItem;
  onNavigate: (item: NavItem) => void;
}

export function AdminLayout({ children, active, onNavigate }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  function toggleDark() {
    setDarkMode((d) => {
      document.documentElement.classList.toggle("dark", !d);
      return !d;
    });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
      <Sidebar active={active} onNavigate={onNavigate} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} darkMode={darkMode} onToggleDark={toggleDark} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopHeader page={active} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
