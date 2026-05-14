import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  CircleDollarSign,
  CreditCard,
  FileScan,
  Gift,
  History,
  Home,
  Landmark,
  LogOut,
  Menu,
  Moon,
  Network,
  PieChart,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sigma,
  Sun,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

export type NavPath =
  | "/"
  | "/dashboard"
  | "/org-chart"
  | "/members"
  | "/activity-feed"
  | "/accounts"
  | "/cashflow"
  | "/currency"
  | "/budgets"
  | "/debt-tracker"
  | "/installments"
  | "/income"
  | "/expense"
  | "/statistics"
  | "/promotions"
  | "/receipt-scanner"
  | "/calendar"
  | "/shopping-list"
  | "/profile"
  | "/history"
  | "/settings"
  | "/learn-to-trade"
  | "/academy"
  | "/admin"
  | "/admin/users"
  | "/admin/academy"
  | "/admin/trades";

const NETWORK_ITEMS: Array<{ path: NavPath; label: string; icon: React.ElementType }> = [
  { path: "/", label: "Home", icon: Home },
  { path: "/org-chart", label: "Org Chart", icon: Network },
  { path: "/members", label: "Members", icon: Users },
  { path: "/activity-feed", label: "Activity Feed", icon: Bell },
];

const FINANCE_GROUPS = [
  {
    label: "Banking & Assets",
    icon: Landmark,
    items: [
      { path: "/accounts", label: "Accounts", icon: Landmark },
      { path: "/currency", label: "Currency", icon: CircleDollarSign },
    ],
  },
  {
    label: "Ledger & Activity",
    icon: History,
    items: [
      { path: "/cashflow", label: "Cashflow", icon: TrendingUp },
      { path: "/income", label: "Income", icon: TrendingDown },
      { path: "/expense", label: "Expense", icon: ReceiptText },
      { path: "/history", label: "History", icon: History },
    ],
  },
  {
    label: "Financial Planning",
    icon: PieChart,
    items: [
      { path: "/budgets", label: "Budgets", icon: PieChart },
      { path: "/debt-tracker", label: "Debt Tracker", icon: CreditCard },
      { path: "/installments", label: "Installments", icon: Wallet },
    ],
  },
  {
    label: "Analytics",
    icon: Sigma,
    items: [
      { path: "/statistics", label: "Statistics", icon: Sigma },
    ],
  },
] as const;

const SUPPORT_ITEMS: Array<{ path: NavPath; label: string; icon: React.ElementType }> = [
  { path: "/receipt-scanner", label: "Receipt Scanner", icon: FileScan },
  { path: "/promotions", label: "Promotions", icon: Gift },
  { path: "/academy", label: "Academy", icon: BookOpen },
  { path: "/calendar", label: "Calendar", icon: CalendarDays },
  { path: "/shopping-list", label: "Shopping List", icon: ShoppingCart },
  { path: "/learn-to-trade", label: "Learn to Trade", icon: BriefcaseBusiness },
];

const ADMIN_ITEMS: Array<{ path: NavPath; label: string; icon: React.ElementType }> = [
  { path: "/admin", label: "Admin Panel", icon: ShieldCheck },
  { path: "/admin/users", label: "User Manager", icon: Users },
  { path: "/admin/academy", label: "Academy Manager", icon: BookOpen },
  { path: "/admin/trades", label: "Trade Monitor", icon: TrendingUp },
];

const PATH_LABELS: Record<NavPath, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/org-chart": "Organization Chart",
  "/members": "Members",
  "/activity-feed": "Activity Feed",
  "/accounts": "Accounts",
  "/cashflow": "Cashflow",
  "/currency": "Currency",
  "/budgets": "Budgets",
  "/debt-tracker": "Debt Tracker",
  "/installments": "Installments",
  "/income": "Income",
  "/expense": "Expense",
  "/statistics": "Statistics",
  "/promotions": "Promotions",
  "/receipt-scanner": "Receipt Scanner",
  "/calendar": "Calendar",
  "/shopping-list": "Shopping List",
  "/profile": "Profile",
  "/history": "History",
  "/settings": "Settings",
  "/learn-to-trade": "Learn to Trade",
  "/academy": "Academy",
  "/admin": "Admin Panel",
  "/admin/users": "User Manager",
  "/admin/academy": "Academy Manager",
  "/admin/trades": "Trade Monitor",
};

function SidebarLink({
  collapsed,
  item,
  badgeCount,
  onSelect,
}: {
  collapsed: boolean;
  item: { path: NavPath; label: string; icon: React.ElementType };
  badgeCount?: number;
  onSelect: () => void;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      end={item.path === "/" || item.path === "/admin"}
      onClick={onSelect}
      className={({ isActive }) =>
        cn(
          "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all",
          isActive
            ? "bg-[hsl(var(--primary))] text-white shadow-[0_16px_40px_-24px_hsl(221_83%_53%_/_0.7)]"
            : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]",
        )
      }
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {badgeCount !== undefined && badgeCount > 0 && (
            <span className="rounded-full bg-white/16 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-current">
              {badgeCount}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

function SidebarAccordion({
  label,
  icon: Icon,
  items,
  collapsed,
  onSelect,
}: {
  label: string;
  icon: React.ElementType;
  items: ReadonlyArray<{ path: NavPath; label: string; icon: React.ElementType }>;
  collapsed: boolean;
  onSelect: () => void;
}) {
  const location = useLocation();
  const isAnyActive = items.some((item) => location.pathname === item.path);
  const [isOpen, setIsOpen] = useState(isAnyActive);

  // If collapsed, don't show accordion behavior, just show the icon?
  // Actually, sidebar usually handles this by showing a tooltip or just expanding.
  // We'll keep it simple: if collapsed, the accordion is effectively disabled/closed.
  
  if (collapsed) {
    return (
      <div className="space-y-1">
        {items.map((item) => (
          <SidebarLink key={item.path} collapsed={collapsed} item={item} onSelect={onSelect} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all",
          isAnyActive
            ? "text-[hsl(var(--foreground))]"
            : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]",
        )}
      >
        <Icon size={18} className="shrink-0" />
        <span className="flex-1 truncate text-left">{label}</span>
        <ChevronDown
          size={14}
          className={cn("shrink-0 transition-transform duration-200", isOpen ? "rotate-180" : "")}
        />
      </button>
      
      {isOpen && (
        <div className="ml-4 space-y-1 border-l border-[hsl(var(--border))] pl-2 animate-in slide-in-from-top-1 duration-200">
          {items.map((item) => (
            <SidebarLink
              key={item.path}
              collapsed={collapsed}
              item={item}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarSection({
  title,
  items,
  financeGroups,
  collapsed,
  onSelect,
  notificationCount,
  promotionCount,
}: {
  title: string;
  items?: Array<{ path: NavPath; label: string; icon: React.ElementType }>;
  financeGroups?: typeof FINANCE_GROUPS;
  collapsed: boolean;
  onSelect: () => void;
  notificationCount?: number;
  promotionCount?: number;
}) {
  return (
    <div>
      {!collapsed && (
        <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">
          {title}
        </p>
      )}
      <div className="space-y-1">
        {financeGroups ? (
          financeGroups.map((group) => (
            <SidebarAccordion
              key={group.label}
              label={group.label}
              icon={group.icon}
              items={group.items}
              collapsed={collapsed}
              onSelect={onSelect}
            />
          ))
        ) : (
          items?.map((item) => (
            <SidebarLink
              key={item.path}
              collapsed={collapsed}
              item={item}
              onSelect={onSelect}
              badgeCount={
                item.path === "/activity-feed"
                  ? notificationCount
                  : item.path === "/promotions"
                    ? promotionCount
                    : undefined
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

export function AdminLayout({
  children,
  themeMode,
  onToggleTheme,
}: {
  children: React.ReactNode;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const mobileStatus = useQuery(api.mobile.status);
  const profile = useQuery(api.profile.getMe);
  const notificationSummary = useQuery(api.notifications.getSummary);
  const isAdminQuery = useQuery(api.admin.isAdmin);
  const { signOut } = useAuthActions();
  const location = useLocation();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = Boolean(isAdminQuery || mobileStatus?.isAdmin);
  const activeLabel = PATH_LABELS[(location.pathname as NavPath) ?? "/"] ?? PATH_LABELS["/"];
  const unreadCount = notificationSummary?.unreadCount ?? 0;
  const promotionCount = notificationSummary?.activePromotionCount ?? 0;
  const initials = (mobileStatus?.user.name ?? "User")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }

    if (!profileMenuOpen) {
      return;
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [profileMenuOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
      <>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)} />
        )}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-transform duration-300 md:sticky md:top-0 md:translate-x-0",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
          style={{ width: collapsed ? 88 : 296 }}
        >
            <div
              className="relative overflow-hidden border-b border-[hsl(var(--border))] p-4"
              style={{
                backgroundColor: "hsl(221 83% 53%)",
                backgroundImage: "radial-gradient(circle, rgb(255 255 255 / 0.18) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            >
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/16 bg-white/10 text-lg font-black text-white">
                  L
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-white">Luxurious</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-blue-100">Network workspace</p>
                    <p className="mt-3 truncate text-sm font-semibold text-white">{mobileStatus?.user.name ?? "Trader"}</p>
                    <p className="truncate text-xs text-blue-100/90">{mobileStatus?.user.email ?? ""}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/14 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                        {isAdmin ? "Admin workspace" : "Member workspace"}
                      </span>
                      {profile && (
                        <span className="rounded-full bg-[hsl(var(--secondary))] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[hsl(222_47%_11%)]">
                          {profile.rank.name}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            </div>

            <button
              onClick={() => setCollapsed((current) => !current)}
              className="absolute -right-3 top-12 z-20 hidden h-7 w-7 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] shadow-sm hover:text-[hsl(var(--foreground))] md:flex"
            >
              {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>

            <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
              <SidebarSection
                title="Network"
                items={NETWORK_ITEMS}
                collapsed={collapsed}
                onSelect={() => setMobileMenuOpen(false)}
                notificationCount={unreadCount}
                promotionCount={promotionCount}
              />
              <SidebarSection
                title="Finance"
                financeGroups={FINANCE_GROUPS}
                collapsed={collapsed}
                onSelect={() => setMobileMenuOpen(false)}
              />
              <SidebarSection
                title="Support"
                items={SUPPORT_ITEMS}
                collapsed={collapsed}
                onSelect={() => setMobileMenuOpen(false)}
                notificationCount={unreadCount}
                promotionCount={promotionCount}
              />
              <SidebarSection
                title="Profile"
                items={[{ path: "/profile", label: "My Profile", icon: CircleUserRound }]}
                collapsed={collapsed}
                onSelect={() => setMobileMenuOpen(false)}
              />
              {isAdmin && (
                <SidebarSection
                  title="Admin"
                  items={ADMIN_ITEMS}
                  collapsed={collapsed}
                  onSelect={() => setMobileMenuOpen(false)}
                />
              )}
            </nav>

            <div className="space-y-1 border-t border-[hsl(var(--border))] px-3 py-3">
              <button
                onClick={onToggleTheme}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
              >
                {themeMode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                {!collapsed && <span>{themeMode === "dark" ? "Light Mode" : "Dark Mode"}</span>}
              </button>
              <button
                onClick={() => void signOut()}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-[hsl(var(--muted-foreground))] transition-colors hover:bg-red-500/10 hover:text-red-500"
              >
                <LogOut size={18} />
                {!collapsed && <span>Sign Out</span>}
              </button>
            </div>
        </aside>
      </>

      <div className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 border-b border-[hsl(var(--border))] bg-[hsl(var(--card)/0.94)] backdrop-blur">
          <div className="flex min-h-[88px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)_minmax(0,1fr)] xl:items-center">
            <div className="flex items-center gap-3 xl:justify-self-start">
              <button onClick={() => setMobileMenuOpen(true)} className="rounded-md p-1.5 hover:bg-[hsl(var(--muted))] md:hidden">
                <Menu size={20} />
              </button>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  Luxurious Desktop
                </p>
                <h2 className="text-base font-black text-[hsl(var(--foreground))]">{activeLabel}</h2>
              </div>
            </div>

            <div className="flex min-w-0 items-center justify-center xl:px-4">
              <div className="flex min-w-0 w-full items-center justify-center gap-2 rounded-[18px] border border-[hsl(var(--primary)/0.28)] bg-[hsl(var(--primary)/0.12)] px-4 py-[11px] text-[14px] font-semibold text-[hsl(var(--foreground))] xl:max-w-[360px]">
                <Network size={17} className="shrink-0 text-[hsl(var(--secondary))]" />
                <span className="truncate">Live network sync</span>
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-3 xl:justify-self-end">
              <NavLink
                to="/activity-feed"
                className={({ isActive }) =>
                  cn(
                    "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[hsl(var(--border))] transition-colors",
                    isActive
                      ? "bg-[hsl(var(--primary))] text-white"
                      : "bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]",
                  )
                }
                aria-label="Open alerts"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 rounded-full bg-[hsl(var(--secondary))] px-1.5 py-0.5 text-[10px] font-bold leading-none text-[hsl(222_47%_11%)]">
                    {unreadCount}
                  </span>
                )}
              </NavLink>

              <div ref={profileMenuRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((current) => !current)}
                  className="flex items-center gap-3 rounded-[22px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-1.5 pl-1.5 pr-3 text-left shadow-[0_12px_32px_-28px_hsl(221_83%_53%_/_0.5)] transition-colors hover:bg-[hsl(var(--accent))]"
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(43_96%_48%),hsl(221_83%_53%))] text-xs font-black text-white">
                    {initials}
                  </div>
                  <div className="hidden min-w-0 lg:block">
                    <p className="truncate text-sm font-bold text-[hsl(var(--foreground))]">
                      {mobileStatus?.user.name ?? "Trader"}
                    </p>
                    <p className="truncate text-[11px] text-[hsl(var(--muted-foreground))]">
                      {profile?.rank.name ?? mobileStatus?.user.role ?? ""}
                    </p>
                  </div>
                  <ChevronDown
                    size={16}
                    className={cn(
                      "hidden text-[hsl(var(--muted-foreground))] transition-transform lg:block",
                      profileMenuOpen && "rotate-180",
                    )}
                  />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+12px)] z-40 w-64 rounded-[24px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 shadow-[0_28px_80px_-36px_hsl(220_60%_10%_/_0.45)]">
                    <div className="rounded-[18px] px-3 py-3">
                      <p className="truncate text-sm font-bold text-[hsl(var(--foreground))]">{mobileStatus?.user.name ?? "Trader"}</p>
                      <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">{mobileStatus?.user.email ?? ""}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-[18px] px-3 py-3 text-sm font-semibold text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
                    >
                      <CircleUserRound size={18} />
                      My Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onToggleTheme();
                      }}
                      className="flex w-full items-center gap-3 rounded-[18px] px-3 py-3 text-sm font-semibold text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
                    >
                      {themeMode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                      {themeMode === "dark" ? "Light Mode" : "Dark Mode"}
                    </button>
                    <Link
                      to="/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-[18px] px-3 py-3 text-sm font-semibold text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
                    >
                      <Settings size={18} />
                      Account Settings
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        void signOut();
                      }}
                      className="flex w-full items-center gap-3 rounded-[18px] px-3 py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10"
                    >
                      <LogOut size={18} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
