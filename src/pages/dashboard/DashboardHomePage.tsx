import { useMemo, useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { Star, UserRound, RefreshCcw, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import owlFrontLeft from "@/assets/brand/owl-front-left.png";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import { Skeleton } from "@/components/ui/Skeleton";

import { NetworkDialog } from "@/components/dashboard/NetworkDialog";

const HERO_STATS = [
  { key: "joinedCount", label: "Joined", tab: "joined", accentClassName: "text-[hsl(var(--secondary))]" },
  { key: "invitedCount", label: "Invited", tab: "invited", accentClassName: "text-[hsl(var(--foreground))]" },
  { key: "toInviteCount", label: "To Invite", tab: "to-invite", accentClassName: "text-[hsl(var(--secondary))]" },
  { key: "pendingCount", label: "Pending", tab: "pending", accentClassName: "text-[hsl(var(--foreground))]" },
] as const;

function StatTile({
  label,
  value,
  accentClassName,
  onClick,
}: {
  label: string;
  value: number | string;
  accentClassName: string;
  onClick?: () => void;
}) {
  return (
    <SurfaceCard 
      onClick={onClick}
      className={`group relative rounded-[30px] p-[18px] transition-all hover:scale-[1.02] active:scale-[0.98] ${onClick ? "cursor-pointer" : ""}`}
    >
      <p className="text-[12px] font-medium text-[hsl(var(--muted-foreground))]">{label}</p>
      <p className={`mt-3 text-[40px] leading-none font-bold tabular-nums ${accentClassName}`}>{value}</p>
      {onClick && (
        <div className="absolute bottom-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] opacity-0 transition-all group-hover:opacity-100">
          <ArrowRight size={14} />
        </div>
      )}
    </SurfaceCard>
  );
}

function MetricChip({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[20px] border border-[hsl(var(--border)/0.5)] bg-[hsl(var(--background))] px-4 py-4 shadow-sm">
      <p className="text-[11px] font-medium text-[hsl(var(--muted-foreground))]">{label}</p>
      <p className="mt-1 text-[17px] leading-none font-bold text-[hsl(var(--foreground))] tabular-nums">{value}</p>
    </div>
  );
}

function StatusChip({
  label,
  status,
  isViewer,
}: {
  label: string;
  status: "joined" | "invited" | "pending" | "to-invite";
  isViewer: boolean;
}) {
  const toneClassName =
    status === "joined"
      ? "bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))]"
      : status === "invited"
        ? "bg-[hsl(var(--secondary)/0.12)] text-[hsl(43_76%_32%)] dark:text-[hsl(var(--foreground))]"
        : "bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--foreground))]";

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border)/0.6)] px-3.5 py-2 text-[12px] font-bold ${toneClassName} shadow-sm`}>
      {isViewer ? <Star size={14} className="text-[hsl(var(--secondary))]" /> : <UserRound size={14} className="text-[hsl(var(--secondary))]" />}
      <span>{label}</span>
    </div>
  );
}


function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1160px] space-y-5 p-4 sm:p-6 lg:p-8">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-14 w-80 max-w-full rounded-2xl" />
      <Skeleton className="h-[300px] rounded-[34px]" />
      <div className="grid grid-cols-2 gap-4 lg:max-w-[760px]">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-[30px]" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Skeleton className="h-72 rounded-[30px]" />
        <Skeleton className="h-72 rounded-[30px]" />
      </div>
    </div>
  );
}

export function DashboardHomePage() {
  const dashboard = useQuery(api.network.getDashboard);
  const [quote, setQuote] = useState<{ text: string; author: string } | null>(() => {
    const CACHE_KEY = "luxxurie_daily_quote";
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { quote, date } = JSON.parse(cached);
        const today = new Date().toISOString().split('T')[0];
        if (date === today) return quote;
      } catch (e) {
        localStorage.removeItem(CACHE_KEY);
      }
    }
    return null;
  });
  const [isNetworkDialogOpen, setIsNetworkDialogOpen] = useState(false);
  const [initialNetworkTab, setInitialNetworkTab] = useState<"joined" | "invited" | "pending" | "to-invite">("joined");

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(new Date()),
    [],
  );

  useEffect(() => {
    if (quote) return;

    async function fetchQuote() {
      const CACHE_KEY = "luxxurie_daily_quote";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      try {
        const res = await fetch("https://api.allorigins.win/raw?url=https://zenquotes.io/api/random", {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const data = await res.json();
        if (data && data[0]) {
          const newQuote = { text: data[0].q, author: "Luxxurie" };
          setQuote(newQuote);
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            quote: newQuote,
            date: new Date().toISOString().split('T')[0]
          }));
        } else {
          setQuote({ text: "The path to luxury is paved with consistent focus.", author: "Luxxurie" });
        }
      } catch (e) {
        clearTimeout(timeoutId);
        setQuote({ text: "The path to luxury is paved with consistent focus.", author: "Luxxurie" });
      }
    }
    void fetchQuote();
  }, [quote]);

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (tz: string) => {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(now);
  };

  const phTime = formatTime("Asia/Manila");
  const caTime = formatTime("America/Toronto");

  if (dashboard === undefined) {
    return <DashboardSkeleton />;
  }

  const statsText = `${dashboard.stats.joinedCount} joined, ${dashboard.stats.invitedCount} invited, ${dashboard.stats.pendingCount} pending`;

  return (
    <div className="mx-auto max-w-[1160px] space-y-6 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex flex-col gap-1">
            <p className="text-[14px] font-medium text-[hsl(var(--muted-foreground))]">{dateLabel}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[hsl(var(--primary))]">
                PH: <span className="tabular-nums font-bold opacity-80">{phTime}</span>
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[hsl(var(--primary))]">
                CANADA: <span className="tabular-nums font-bold opacity-80">{caTime}</span>
              </p>
            </div>
          </div>

          <button 
            onClick={() => {
              toast.success("Metrics synced", {
                style: {
                  borderRadius: '16px',
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))',
                  fontWeight: 'bold',
                  fontSize: '13px'
                }
              });
            }}
            className="flex sm:hidden h-10 w-10 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] transition-all hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] active:scale-95 shadow-sm"
          >
            <RefreshCcw size={18} />
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <button 
            onClick={() => {
              toast.success("Metrics synced", {
                style: {
                  borderRadius: '16px',
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))',
                  fontWeight: 'bold',
                  fontSize: '13px'
                }
              });
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] transition-all hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] hover:scale-105 active:scale-95"
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-[34px] border border-[hsl(210_40%_90%)] bg-[linear-gradient(135deg,hsl(210_40%_99%),hsl(210_40%_96%))] dark:border-[rgb(37_99_235_/_0.42)] dark:bg-[linear-gradient(135deg,#26459E,#1E3A8A)]">
        <div className="flex flex-col gap-6 px-[22px] pt-[18px] md:flex-row md:items-end md:justify-between md:gap-4 md:pr-[18px]">
          <div className="flex-1 pb-[18px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(210_30%_90%)] bg-white/60 backdrop-blur-sm px-[14px] py-[6px] dark:border-white/10 dark:bg-[rgb(15_42_107_/_0.9)]">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[hsl(var(--foreground))] dark:text-white/80">{statsText}</p>
            </div>
            
            <div className="mt-8 max-w-xl pb-4">
              <p className="text-[20px] font-bold leading-[1.3] text-[hsl(var(--foreground))] dark:text-white sm:text-[28px] italic">
                "{quote?.text ?? "Loading inspiration..."}"
              </p>
              <p className="mt-3 text-[14px] font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))] dark:text-blue-300">
                — {quote?.author ?? "Luxxurie"}
              </p>
            </div>

            <div className="mt-2">
              <p className="text-[24px] font-bold leading-none text-[hsl(var(--foreground))] dark:text-white">
                {dashboard.viewer?.name ?? "Trader"}
              </p>
              <p className="mt-1.5 text-[13px] font-bold text-[hsl(43_76%_32%)] dark:text-[hsl(var(--secondary))]">
                {dashboard.viewer?.roleTitle ?? "Network Lead"}
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <img
              src={owlFrontLeft}
              alt="Luxurious owl"
              className="h-auto w-[124px] object-contain sm:w-[152px] lg:w-[172px]"
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {HERO_STATS.map((item) => (
          <StatTile
            key={item.key}
            label={item.label}
            value={item.key === "toInviteCount" ? "∞" : dashboard.stats[item.key]}
            accentClassName={item.accentClassName}
            onClick={() => {
              setInitialNetworkTab(item.tab as any);
              setIsNetworkDialogOpen(true);
            }}
          />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SurfaceCard className="rounded-[30px] p-[22px]">
          <div className="flex items-center gap-3">
            <h2 className="text-[22px] font-bold text-[hsl(var(--foreground))]">Org chart</h2>
            <div className="flex-1" />
            <Link to="/org-chart" className="text-[14px] font-semibold text-[hsl(var(--primary))]">
              Open
            </Link>
          </div>
          <p className="mt-2 text-[12px] leading-5 text-[hsl(var(--muted-foreground))]">
            Track uplines and downlines from primary tree, not from finance cards.
          </p>
          <div className="mt-[18px] grid gap-3 sm:grid-cols-3">
            <MetricChip label="Uplines" value={dashboard.stats.uplinesCount} />
            <MetricChip label="Downlines" value={dashboard.stats.downlinesCount} />
            <MetricChip label="Members" value={dashboard.stats.totalNetworkCount} />
          </div>
          <div className="mt-[18px] flex flex-wrap gap-2">
            {dashboard.tree.slice(0, 3).map((node) => (
              <StatusChip key={node.id} label={node.name} status={node.status} isViewer={node.isViewer} />
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[30px] p-[22px]">
          <div className="flex items-center gap-3">
            <h2 className="text-[22px] font-bold text-[hsl(var(--foreground))]">Members</h2>
            <div className="flex-1" />
            <Link to="/members" className="text-[14px] font-semibold text-[hsl(var(--primary))]">
              Open
            </Link>
          </div>
          <p className="mt-2 text-[12px] leading-5 text-[hsl(var(--muted-foreground))]">
            Direct referrals and active follow-up queue.
          </p>
          <div className="mt-[18px] space-y-3">
            {dashboard.directMembers.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-[hsl(var(--border))] px-4 py-5 text-[14px] text-[hsl(var(--muted-foreground))]">
                No direct members yet.
              </div>
            ) : (
              dashboard.directMembers.slice(0, 5).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 rounded-[18px] border border-[hsl(var(--border))] bg-[hsl(var(--accent))] px-[14px] py-[14px]"
                >
                  <div
                    className={
                      member.status === "joined"
                        ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.14)] text-[hsl(var(--primary))]"
                        : member.status === "invited"
                          ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--secondary)/0.18)] text-[hsl(43_76%_32%)] dark:text-[hsl(var(--secondary))]"
                          : "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
                    }
                  >
                    <UserRound size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-[hsl(var(--foreground))]">{member.name}</p>
                    <p className="truncate text-[12px] text-[hsl(var(--muted-foreground))]">
                      {member.roleTitle} - {member.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </SurfaceCard>
      </div>
      <NetworkDialog 
        isOpen={isNetworkDialogOpen} 
        onClose={() => setIsNetworkDialogOpen(false)} 
        members={dashboard.members as any}
        initialTab={initialNetworkTab}
      />
    </div>
  );
}


