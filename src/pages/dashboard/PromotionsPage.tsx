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
      <section className="overflow-hidden rounded-[34px] border border-[#BCD2FA] bg-[#F5F8FF] dark:border-[rgb(37_99_235_/_0.42)] dark:bg-[#1E3A8A]">
        <div className="flex flex-col gap-6 px-[22px] py-[18px] md:flex-row md:items-end md:justify-between md:gap-4 md:pr-[18px]">
          <div className="flex-1">
            <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--background)/0.6)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-amber-600 dark:text-amber-300 mb-2">
              <Sparkles size={13} />
              Promotion Board
            </span>
            <h1 className="mt-2 text-[32px] font-bold leading-[1.05] tracking-[-0.04em] text-[hsl(var(--foreground))] sm:text-[44px]">
              Active campaigns.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[hsl(var(--foreground))] sm:text-base max-w-2xl">
              Keep next follow-up visible. Cards stay action-oriented so desktop does not drift from app behavior.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        {promotions.map((promotion) => (
          <SurfaceCard key={promotion.id} className="overflow-hidden">
            <div
              className="h-2"
              style={{
                backgroundColor: promotion.accent,
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
