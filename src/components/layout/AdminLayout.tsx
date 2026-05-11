import { useState, useEffect } from "react";
import { Network, Users, Mail, Settings, ChevronLeft, ChevronRight, LogOut, Moon, Sun, Menu, TrendingUp, BookOpen, ShieldCheck } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { cn } from "@/lib/utils";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export type NavPath = 
  | "/org-chart" 
  | "/members" 
  | "/invitations" 
  | "/settings" 
  | "/learn-to-trade" 
  | "/academy" 
  | "/admin" 
  | "/admin/academy" 
  | "/admin/trades";

const NAV_ITEMS: { path: NavPath; label: string; icon: React.ElementType; primary?: boolean }[] = [
  { path: "/org-chart", label: "Org Chart", icon: Network },
  { path: "/members", label: "Members", icon: Users },
  { path: "/invitations", label: "Invitations", icon: Mail },
  { path: "/academy", label: "Trading Academy", icon: BookOpen },
];

const PATH_LABELS: Record<string, string> = {
  "/org-chart": "Organization Chart",
  "/members": "Members",
  "/invitations": "Invitations",
  "/settings": "Settings",
  "/learn-to-trade": "Learn to Trade",
  "/academy": "Trading Academy",
  "/admin": "Platform Admin",
  "/admin/academy": "Academy Manager",
  "/admin/trades": "Trade Monitor",
};

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const user = useQuery(api.users.viewer);
  const isAdminQuery = useQuery(api.admin.isAdmin);
  const { signOut } = useAuthActions();
  const location = useLocation();
  
  const isAdmin = isAdminQuery || user?.email === "admin@luxurious.trade" || user?.role === "admin";

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
  }, [darkMode]);

  function toggleDark() {
    setDarkMode((d) => {
      document.documentElement.classList.toggle("dark", !d);
      return !d;
    });
  }

  const activeLabel = PATH_LABELS[location.pathname] || "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
      {/* Sidebar */}
      <>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        )}
        <aside
          className={cn(
            "flex flex-col h-screen border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-all duration-300 shrink-0 fixed inset-y-0 left-0 z-50 md:relative",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
          style={{ width: collapsed ? 64 : 240 }}
        >
          {/* Branding */}
          <Link to="/" className="relative overflow-hidden flex items-center gap-3 p-4 shrink-0" style={{ background: "#2563eb", minHeight: 64 }}>
            <div className="relative z-10 w-8 h-8 shrink-0">
              <img src="/favicon-32x32.png" alt="Luxurious Logo" className="w-full h-full object-contain" />
            </div>
            {!collapsed && (
              <div className="relative z-10 overflow-hidden">
                <p className="text-white font-extrabold text-sm truncate">Luxurious</p>
                <p className="text-blue-100 text-[10px] font-bold uppercase tracking-[0.18em] truncate">Trading Group</p>
              </div>
            )}
          </Link>

          <button onClick={() => setCollapsed(!collapsed)} className="hidden md:flex absolute -right-3 top-12 z-20 w-6 h-6 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] shadow-sm">
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>

          <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
            {!collapsed && <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Management</p>}
            {NAV_ITEMS.map(({ path, label, icon: Icon, primary }) => (
              <NavLink key={path} to={path} onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => cn(
                  "w-full flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-all mb-1",
                  isActive 
                    ? primary ? "bg-[hsl(var(--primary))] text-white shadow-lg" : "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]" 
                    : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]",
                  primary && !isActive && "text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)] border border-[hsl(var(--primary)/0.1)]"
                )}>
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            ))}

            {isAdmin && (
              <>
                {!collapsed && <p className="px-2 pb-2 mt-4 text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Administration</p>}
                <NavLink to="/admin" end onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => cn(
                    "w-full flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-all mb-1",
                    isActive ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                  )}>
                  <ShieldCheck size={18} className="shrink-0" />
                  {!collapsed && <span className="truncate">Platform Admin</span>}
                </NavLink>
                <NavLink to="/admin/academy" onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => cn(
                    "w-full flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-all mb-1",
                    isActive ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                  )}>
                  <BookOpen size={18} className="shrink-0" />
                  {!collapsed && <span className="truncate">Academy Manager</span>}
                </NavLink>
                <NavLink to="/admin/trades" onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => cn(
                    "w-full flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-all mb-1",
                    isActive ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                  )}>
                  <TrendingUp size={18} className="shrink-0" />
                  {!collapsed && <span className="truncate">Trade Monitor</span>}
                </NavLink>
              </>
            )}
          </nav>

          <div className="border-t border-[hsl(var(--border))] px-2 py-3 space-y-1">
            <NavLink to="/settings" onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => cn(
                "w-full flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-all",
                isActive ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
              )}>
              <Settings size={18} />
              {!collapsed && <span>Settings</span>}
            </NavLink>
            <button onClick={toggleDark} className="w-full flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              {!collapsed && <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>}
            </button>
            <button onClick={() => void signOut()} className="w-full flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:bg-red-500/10 hover:text-red-500 transition-colors">
              <LogOut size={18} />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        </aside>
      </>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="h-14 shrink-0 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-1.5 -ml-1.5 rounded-md hover:bg-[hsl(var(--muted))]">
              <Menu size={20} />
            </button>
            <h2 className="text-base font-bold text-[hsl(var(--foreground))]">{activeLabel}</h2>
          </div>
          <div className="flex items-center gap-4">
            <NavLink to="/learn-to-trade" 
              className={({ isActive }) => cn(
                "hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm",
                isActive 
                  ? "bg-[hsl(var(--primary))] text-white shadow-lg shadow-[hsl(var(--primary)/0.2)]" 
                  : "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.2)]"
              )}>
              <TrendingUp size={14} />
              <span>Learn to Trade</span>
            </NavLink>
            
            <div className="h-6 w-px bg-[hsl(var(--border))] hidden sm:block" />

            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[hsl(var(--foreground))]"
              >{user?.name ?? user?.email?.split("@")[0] ?? "User"}</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]"
              >{user?.email ?? ""}</p>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white" style={{ background: "linear-gradient(135deg, hsl(43 96% 48%), hsl(221 83% 53%))" }}>
              {(user?.name ?? user?.email ?? "U").slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
