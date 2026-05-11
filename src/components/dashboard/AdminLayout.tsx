import { useState, useEffect } from "react";
import { Network, Users, Mail, Settings, ChevronLeft, ChevronRight, LogOut, Moon, Sun, Menu, TrendingUp, BookOpen, ShieldCheck } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { cn } from "@/lib/utils";

export type NavItem = "org-chart" | "members" | "invitations" | "settings" | "learn-to-trade" | "academy" | "admin-portal" | "academy-manager" | "trade-monitor";

const NAV_ITEMS: { key: NavItem; label: string; icon: React.ElementType; primary?: boolean }[] = [
  { key: "org-chart", label: "Org Chart", icon: Network },
  { key: "members", label: "Members", icon: Users },
  { key: "invitations", label: "Invitations", icon: Mail },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "learn-to-trade", label: "Learn to Trade", icon: TrendingUp, primary: true },
  { key: "academy", label: "Trading Academy", icon: BookOpen },
];

const PAGE_LABELS: Record<NavItem, string> = {
  "org-chart": "Organization Chart",
  members: "Members",
  invitations: "Invitations",
  settings: "Settings",
  "learn-to-trade": "Learn to Trade",
  academy: "Trading Academy",
  "admin-portal": "Platform Admin",
  "academy-manager": "Academy Manager",
  "trade-monitor": "Trade Monitor",
};

interface SidebarProps {
  active: NavItem;
  onNavigate: (item: NavItem) => void;
  collapsed: boolean;
  onToggle: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  isAdmin: boolean;
}

function Sidebar({ active, onNavigate, collapsed, onToggle, darkMode, onToggleDark, mobileOpen, setMobileOpen, isAdmin }: SidebarProps) {
  const { signOut } = useAuthActions();
  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setMobileOpen(false)} />
      )}
      
      <aside
        className={cn(
          "flex flex-col h-screen border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-all duration-300 shrink-0",
          "fixed inset-y-0 left-0 z-50 md:relative",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0 md:shadow-none"
        )}
        style={{ width: collapsed ? 64 : 240 }}
      >
      {/* Branding */}
      <div className="relative overflow-hidden flex items-center gap-3 p-4 shrink-0" style={{ background: "#2563eb", minHeight: 64 }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
        <div className="relative z-10 w-8 h-8 flex items-center justify-center shrink-0">
          <img src="/favicon-32x32.png" alt="Luxurious Logo" className="w-full h-full object-contain" />
        </div>
        {!collapsed && (
          <div className="relative z-10 overflow-hidden">
            <p className="text-white font-extrabold text-sm truncate">Luxurious</p>
            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-[0.18em] truncate">Trading Group</p>
          </div>
        )}
      </div>

      {/* Collapse toggle (Desktop only) */}
      <button onClick={onToggle} className="hidden md:flex absolute -right-3 top-12 z-20 w-6 h-6 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] shadow-sm transition-colors">
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {!collapsed && <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">Management</p>}
        {NAV_ITEMS.map(({ key, label, icon: Icon, primary }) => {
          const isActive = active === key;
          return (
            <button key={key} onClick={() => { onNavigate(key); setMobileOpen(false); }} title={collapsed ? label : undefined}
              className={cn("w-full flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-all mb-1",
                isActive 
                  ? primary ? "bg-[hsl(var(--primary))] text-white shadow-lg shadow-[hsl(var(--primary)/0.2)]" : "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]" 
                  : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]",
                primary && !isActive && "text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)] border border-[hsl(var(--primary)/0.1)]"
              )}>
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
              {isActive && !collapsed && !primary && <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "hsl(43 96% 48%)" }} />}
            </button>
          );
        })}
        {isAdmin && (
          <>
            {!collapsed && <p className="px-2 pb-2 mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">Administration</p>}
            <button onClick={() => { onNavigate("admin-portal"); setMobileOpen(false); }} title={collapsed ? "Platform Admin" : undefined}
              className={cn("w-full flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-all mb-1",
                active === "admin-portal" ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
              )}>
              <ShieldCheck size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">Platform Admin</span>}
            </button>
          </>
        )}
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
    </>
  );
}

function TopHeader({ page, onOpenMobileMenu }: { page: NavItem; onOpenMobileMenu: () => void }) {
  return (
    <header className="h-14 shrink-0 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <button onClick={onOpenMobileMenu} className="md:hidden p-1.5 -ml-1.5 rounded-md hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] transition-colors">
          <Menu size={20} />
        </button>
        <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">{PAGE_LABELS[page]}</h2>
        <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full" style={{ background: "hsl(43 96% 48%)" }} />
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

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function AdminLayout({ children, active, onNavigate }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const isAdmin = useQuery(api.admin.isAdmin);

  // Apply dark mode on mount
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  function toggleDark() {
    setDarkMode((d) => {
      document.documentElement.classList.toggle("dark", !d);
      return !d;
    });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
      <Sidebar 
        active={active} 
        onNavigate={onNavigate} 
        collapsed={collapsed} 
        onToggle={() => setCollapsed((c) => !c)} 
        darkMode={darkMode} 
        onToggleDark={toggleDark} 
        mobileOpen={mobileMenuOpen} 
        setMobileOpen={setMobileMenuOpen} 
        isAdmin={!!isAdmin} 
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopHeader page={active} onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
