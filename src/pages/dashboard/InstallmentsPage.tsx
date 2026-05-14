import { useQuery } from "convex/react";
import { CalendarClock, Layers3 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import {
  DashboardDataSkeleton,
  DashboardEmptyState,
  DashboardMetricCard,
  DashboardPageHero,
  DashboardPageShell,
  DashboardProgressBar,
  DashboardSectionTitle,
  ToneBadge,
  formatCurrency,
  formatDate,
  formatPercent,
} from "@/components/dashboard/FinancePageHelpers";

export function InstallmentsPage() {
  const installments = useQuery(api.planning.getInstallments);

  if (installments === undefined) {
    return <DashboardDataSkeleton rowCount={4} />;
  }

  const totalDue = installments.reduce((sum, item) => sum + item.amount, 0);
  const nextDue = [...installments].sort((left, right) => new Date(left.nextDate).getTime() - new Date(right.nextDate).getTime())[0];

  return (
    <DashboardPageShell>
      <DashboardPageHero
        eyebrow="Installments"
        title="Installment schedule."
        description="Desktop installment view follows mobile plan rows: progress, payment amount, and next due date."
        icon={Layers3}
        badges={[
          { label: `${installments.length} plans`, tone: "neutral" },
          { label: nextDue ? `Next ${formatDate(nextDue.nextDate)}` : "No due date", tone: "success" },
        ]}
        metrics={[
          { label: "Cycle Due", value: formatCurrency(totalDue) },
          { label: "Next Item", value: nextDue?.item ?? "None" },
          { label: "Avg Ticket", value: installments.length === 0 ? formatCurrency(0) : formatCurrency(totalDue / installments.length) },
        ]}
      />

      {installments.length === 0 ? (
        <DashboardEmptyState
          icon={CalendarClock}
          title="No installment plans."
          description="Installment rows are seeded with mobile planning data. Empty means nothing scheduled for this profile."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-4">
            {installments.map((item) => {
              const ratio = item.total === 0 ? 0 : (item.current / item.total) * 100;
              return (
                <SurfaceCard key={item.id} className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-black text-[hsl(var(--foreground))]">{item.item}</p>
                        <ToneBadge tone="primary">
                          {item.current}/{item.total}
                        </ToneBadge>
                      </div>
                      <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                        Next due {formatDate(item.nextDate)}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-lg font-black text-[hsl(var(--foreground))]">{formatCurrency(item.amount)}</p>
                      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{formatPercent(ratio)} complete</p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <DashboardProgressBar value={item.current} max={item.total} tone="primary" />
                  </div>
                </SurfaceCard>
              );
            })}
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <DashboardMetricCard
                label="Near Finish"
                value={[...installments].sort((left, right) => right.current / right.total - left.current / left.total)[0]?.item ?? "None"}
                hint="Highest completion ratio."
              />
              <DashboardMetricCard
                label="Longest Tail"
                value={[...installments].sort((left, right) => left.current / left.total - right.current / right.total)[0]?.item ?? "None"}
                hint="Lowest completion ratio."
              />
            </div>

            <SurfaceCard className="p-6">
              <DashboardSectionTitle
                eyebrow="Due Order"
                title="Upcoming payments"
                description="Sorted by next due date string from planning API."
              />
              <div className="mt-5 space-y-3">
                {[...installments]
                  .sort((left, right) => new Date(left.nextDate).getTime() - new Date(right.nextDate).getTime())
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-[22px] border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-bold text-[hsl(var(--foreground))]">{item.item}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatDate(item.nextDate)}</p>
                      </div>
                      <p className="text-sm font-black text-[hsl(var(--foreground))]">{formatCurrency(item.amount)}</p>
                    </div>
                  ))}
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-6">
              <DashboardSectionTitle
                eyebrow="Model"
                title="Progress only"
                description="API exposes installment counts and next due date. No lender or purchase metadata added on desktop."
              />
            </SurfaceCard>
          </div>
        </div>
      )}
    </DashboardPageShell>
  );
}
