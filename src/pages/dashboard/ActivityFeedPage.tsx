import { useEffect, useRef } from "react";
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

  if (feed === undefined) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-48 rounded-[28px]" />
        <Skeleton className="h-28 rounded-[28px]" />
        <Skeleton className="h-28 rounded-[28px]" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <SurfaceCard className="overflow-hidden">
        <div
          className="p-6 sm:p-8"
          style={{
            background:
              "radial-gradient(circle at top left, hsl(221 83% 53% / 0.22), transparent 36%), linear-gradient(155deg, hsl(var(--card)), hsl(var(--card)), hsl(43 96% 48% / 0.08))",
          }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary)/0.12)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--primary))]">
              <BellRing size={13} />
              Activity Feed
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--muted))] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
              <RefreshCcw size={13} />
              Auto-sync
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-[hsl(var(--foreground))]">
            Alerts, rank motion, finance pulse.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))] sm:text-base">
            Feed follows mobile behavior. Opening page clears unread badge and keeps next actions close.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <SurfaceCard className="rounded-[24px] bg-[hsl(var(--background)/0.82)] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                Total Events
              </p>
              <p className="mt-2 text-3xl font-black text-[hsl(var(--foreground))]">{feed.items.length}</p>
            </SurfaceCard>
            <SurfaceCard className="rounded-[24px] bg-[hsl(var(--background)/0.82)] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                Unread Cleared
              </p>
              <p className="mt-2 text-3xl font-black text-[hsl(var(--foreground))]">{feed.unreadCount}</p>
            </SurfaceCard>
            <SurfaceCard className="rounded-[24px] bg-[hsl(var(--background)/0.82)] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                Promotions
              </p>
              <Link to="/promotions" className="mt-2 inline-flex items-center gap-2 text-sm font-black text-[hsl(var(--primary))]">
                Open page
                <ChevronRight size={16} />
              </Link>
            </SurfaceCard>
          </div>
        </div>
      </SurfaceCard>

      <div className="space-y-4">
        {feed.items.map((item) => (
          <SurfaceCard key={item.id} className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass[item.tone] ?? toneClass.blue}`}>
                  <BellRing size={18} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black text-[hsl(var(--foreground))]">{item.title}</h2>
                    {item.isUnread && (
                      <span className="rounded-full bg-amber-500/12 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300">
                        Unread
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{item.body}</p>
                </div>
              </div>
              <div className="sm:text-right">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  {item.source}
                </p>
                <p className="mt-1 text-sm font-semibold text-[hsl(var(--foreground))]">
                  {formatRelativeTime(item.occurredAt)}
                </p>
              </div>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
