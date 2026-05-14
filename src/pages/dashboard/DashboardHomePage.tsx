import { useMemo } from "react";
import { useQuery } from "convex/react";
import { Star, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import owlFrontLeft from "@/assets/brand/owl-front-left.png";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import { Skeleton } from "@/components/ui/Skeleton";

const HERO_STATS = [
  { key: "joinedCount", label: "Joined", accentClassName: "text-[hsl(var(--secondary))]" },
  { key: "invitedCount", label: "Invited", accentClassName: "text-[hsl(var(--foreground))]" },
  { key: "toInviteCount", label: "To Invite", accentClassName: "text-[hsl(var(--secondary))]" },
  { key: "pendingCount", label: "Pending", accentClassName: "text-[hsl(var(--foreground))]" },
] as const;

function StatTile({
  label,
  value,
  accentClassName,
}: {
  label: string;
  value: number;
  accentClassName: string;
}) {
  return (
    <SurfaceCard className="rounded-[30px] p-[18px]">
      <p className="text-[12px] font-medium text-[hsl(var(--muted-foreground))]">{label}</p>
      <p className={`mt-3 text-[40px] leading-none font-bold tabular-nums ${accentClassName}`}>{value}</p>
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
    <div className="rounded-[20px] border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-4">
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
  status: "joined" | "invited" | "pending";
  isViewer: boolean;
}) {
  const toneClassName =
    status === "joined"
      ? "bg-[hsl(var(--primary)/0.14)] text-[hsl(var(--primary))]"
      : status === "invited"
        ? "bg-[hsl(var(--secondary)/0.18)] text-[hsl(43_76%_32%)] dark:text-[hsl(var(--foreground))]"
        : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]";

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] px-3 py-2 text-[12px] font-semibold ${toneClassName}`}>
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

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(new Date()),
    [],
  );

  if (dashboard === undefined) {
    return <DashboardSkeleton />;
  }

  const heroSummary = `${dashboard.stats.joinedCount} joined, ${dashboard.stats.invitedCount} invited, ${dashboard.stats.pendingCount} pending.`;

  return (
    <div className="mx-auto max-w-[1160px] space-y-5 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-[14px] font-medium text-[hsl(var(--muted-foreground))]">{dateLabel}</p>
        <h1 className="mt-2 text-[32px] font-bold leading-[1.05] tracking-[-0.04em] text-[hsl(var(--foreground))] sm:text-[44px]">
          Build the network.
        </h1>
      </div>

      <section className="overflow-hidden rounded-[34px] border border-[#BCD2FA] bg-[linear-gradient(135deg,#F5F8FF,#DDE9FF)] dark:border-[rgb(37_99_235_/_0.42)] dark:bg-[linear-gradient(135deg,#26459E,#1E3A8A)]">
        <div className="flex flex-col gap-6 px-[22px] pt-[18px] md:flex-row md:items-end md:justify-between md:gap-4 md:pr-[18px]">
          <div className="flex-1 pb-[18px]">
            <div className="max-w-[260px] rounded-[20px] border border-[#D6E4FF] bg-white px-[14px] py-[10px] dark:border-white/10 dark:bg-[rgb(15_42_107_/_0.9)]">
              <p className="text-[15px] leading-[1.35] font-normal text-[hsl(var(--foreground))]">{heroSummary}</p>
            </div>
            <p className="mt-[18px] text-[24px] font-bold leading-[1.08] text-[hsl(var(--foreground))]">
              {dashboard.viewer?.name ?? "Trader"}
            </p>
            <p className="mt-1 text-[14px] font-medium text-[hsl(43_76%_40%)] dark:text-[hsl(var(--secondary))]">
              {dashboard.viewer?.roleTitle ?? "Network Lead"}
            </p>
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

      <div className="grid grid-cols-2 gap-4 lg:max-w-[760px]">
        {HERO_STATS.map((item) => (
          <StatTile
            key={item.key}
            label={item.label}
            value={dashboard.stats[item.key]}
            accentClassName={item.accentClassName}
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
    </div>
  );
}
