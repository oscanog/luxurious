import { useEffect, useRef, useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { BellRing, ChevronRight, RefreshCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import { Skeleton } from "@/components/ui/Skeleton";

function formatRelativeTime(timestamp: number) {
  const diffMinutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

const toneClass: Record<string, string> = {
  blue: "bg-blue-500/12 text-blue-600 dark:text-blue-300",
  gold: "bg-amber-500/12 text-amber-600 dark:text-amber-300",
  emerald: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
  amber: "bg-orange-500/12 text-orange-600 dark:text-orange-300",
  violet: "bg-violet-500/12 text-violet-600 dark:text-violet-300",
};

export function ActivityFeedPage() {
  const feed = useQuery(api.notifications.getFeed);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const markedRef = useRef(false);

  useEffect(() => {
    if (!feed || feed.unreadCount === 0 || markedRef.current) {
      return;
    }
    markedRef.current = true;
    void markAllRead({});
  }, [feed, markAllRead]);

  const [limit, setLimit] = useState(10);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMoreRef = useCallback((node: HTMLTableRowElement | null) => {
    if (!node) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setLimit((l) => l + 10);
      }
    });
    observerRef.current.observe(node);
  }, []);

  if (feed === undefined) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-48 rounded-[28px]" />
        <Skeleton className="h-28 rounded-[28px]" />
        <Skeleton className="h-28 rounded-[28px]" />
      </div>
    );
  }

  const visibleItems = feed.items.slice(0, limit);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-[#BCD2FA] bg-[#F5F8FF] dark:border-[rgb(37_99_235_/_0.42)] dark:bg-[#1E3A8A]">
        <div className="flex flex-col gap-6 px-[22px] pt-[18px] md:flex-row md:items-end md:justify-between md:gap-4 md:pr-[18px]">
          <div className="flex-1 pb-[18px]">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--background)/0.6)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--foreground))]">
                <BellRing size={13} />
                Activity Feed
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--background)/0.6)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                <RefreshCcw size={13} />
                Auto-sync
              </span>
            </div>
            <h1 className="mt-2 text-[32px] font-bold leading-[1.05] tracking-[-0.04em] text-[hsl(var(--foreground))] sm:text-[44px]">
              Alerts, rank motion, finance pulse.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[hsl(var(--foreground))] sm:text-base max-w-xl">
              Feed follows mobile behavior. Opening page clears unread badge and keeps next actions close.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatTile label="Total Events" value={feed.items.length} accentClassName="text-[hsl(var(--secondary))]" />
        <StatTile label="Unread Cleared" value={feed.unreadCount} accentClassName="text-[hsl(var(--foreground))]" />
        <SurfaceCard className="rounded-[30px] p-[18px]">
          <p className="text-[12px] font-medium text-[hsl(var(--muted-foreground))]">Promotions</p>
          <Link to="/promotions" className="mt-3 inline-flex items-center gap-2 text-[20px] font-bold text-[hsl(var(--primary))]">
            Open page
            <ChevronRight size={20} />
          </Link>
        </SurfaceCard>
      </div>

      <SurfaceCard className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
              <th className="px-6 py-4">Event</th>
              <th className="px-6 py-4">Source</th>
              <th className="px-6 py-4 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {visibleItems.map((item, index) => {
              const isLastVisible = index === visibleItems.length - 1;
              return (
                <tr
                  key={item.id}
                  ref={isLastVisible ? loadMoreRef : undefined}
                  className="transition-colors hover:bg-[hsl(var(--muted))]"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass[item.tone] ?? toneClass.blue}`}>
                        <BellRing size={16} />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-[hsl(var(--foreground))]">{item.title}</span>
                          {item.isUnread && (
                            <span className="rounded-full bg-amber-500/12 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300">
                              Unread
                            </span>
                          )}
                        </div>
                        <span className="mt-1 text-[hsl(var(--muted-foreground))]">
                          {item.body}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-[hsl(var(--secondary)/0.14)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[hsl(var(--secondary-foreground))]">
                      {item.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-[hsl(var(--foreground))] font-medium whitespace-nowrap">
                    {formatRelativeTime(item.occurredAt)}
                  </td>
                </tr>
              );
            })}
            {feed.items.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-[hsl(var(--muted-foreground))]">
                  No activity logs.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </SurfaceCard>
    </div>
  );
}

function StatTile({
  label,
  value,
  accentClassName,
}: {
  label: string;
  value: number | undefined;
  accentClassName: string;
}) {
  return (
    <SurfaceCard className="rounded-[30px] p-[18px]">
      <p className="text-[12px] font-medium text-[hsl(var(--muted-foreground))]">{label}</p>
      <p className={`mt-3 text-[40px] leading-none font-bold tabular-nums ${accentClassName}`}>{value ?? "..."}</p>
    </SurfaceCard>
  );
}
