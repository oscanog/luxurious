import { useQuery } from "convex/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import { Skeleton } from "@/components/ui/Skeleton";

function resolveRoute(ctaLabel: string) {
  if (ctaLabel === "Open members") return "/members";
  if (ctaLabel === "Open feed") return "/activity-feed";
  if (ctaLabel === "Review history") return "/history";
  return "/";
}

export function PromotionsPage() {
  const promotions = useQuery(api.notifications.listPromotions);
  const navigate = useNavigate();

  if (promotions === undefined) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-44 rounded-[28px]" />
        <Skeleton className="h-52 rounded-[28px]" />
        <Skeleton className="h-52 rounded-[28px]" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <SurfaceCard className="relative overflow-hidden p-6 sm:p-8">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(circle at top right, hsl(43 96% 48% / 0.22), transparent 28%), radial-gradient(circle at bottom left, hsl(221 83% 53% / 0.18), transparent 34%)",
          }}
        />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--secondary)/0.14)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-amber-600 dark:text-amber-300">
            <Sparkles size={13} />
            Promotion Board
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-[hsl(var(--foreground))]">
            Active campaigns from mobile, now on desktop.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))] sm:text-base">
            Keep next follow-up visible. Cards stay action-oriented so desktop does not drift from app behavior.
          </p>
        </div>
      </SurfaceCard>

      <div className="grid gap-6 xl:grid-cols-3">
        {promotions.map((promotion) => (
          <SurfaceCard key={promotion.id} className="overflow-hidden">
            <div
              className="h-2"
              style={{
                background: `linear-gradient(90deg, ${promotion.accent}, hsl(221 83% 53%))`,
              }}
            />
            <div className="p-6">
              <span className="inline-flex rounded-full bg-[hsl(var(--muted))] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                {promotion.badge}
              </span>
              <h2 className="mt-4 text-xl font-black leading-tight text-[hsl(var(--foreground))]">
                {promotion.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{promotion.body}</p>
              <button
                type="button"
                onClick={() => {
                  void navigate(resolveRoute(promotion.ctaLabel));
                }}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90"
              >
                {promotion.ctaLabel}
                <ArrowRight size={14} />
              </button>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
