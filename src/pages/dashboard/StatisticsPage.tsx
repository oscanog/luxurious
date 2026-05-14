import { useQuery } from "convex/react";
import { BarChart3, CircleDollarSign } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import {
  DashboardDataSkeleton,
  DashboardEmptyState,
  DashboardMetricCard,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionTitle,
  ToneBadge,
  formatCurrency,
  formatPercent,
} from "@/components/dashboard/FinancePageHelpers";

export function StatisticsPage() {
  const statistics = useQuery(api.analytics.getStatistics);

  if (statistics === undefined) {
    return <DashboardDataSkeleton metricCount={4} rowCount={3} />;
  }

  return (
    <DashboardPageShell>
      <DashboardPageHero
        eyebrow="Statistics"
        title="Finance pulse board."
        description="Convex analytics query aggregates recent mobile transaction history into summary numbers and expense-category breakdown."
        icon={BarChart3}
        badges={[
          { label: `${statistics.transactionCount} transactions`, tone: "neutral" },
          { label: statistics.netFlow >= 0 ? "Positive net" : "Negative net", tone: statistics.netFlow >= 0 ? "success" : "warning" },
        ]}
        metrics={[
          { label: "Income", value: formatCurrency(statistics.income), tone: "success" },
          { label: "Spent", value: formatCurrency(statistics.spent), tone: "warning" },
          { label: "Net", value: formatCurrency(statistics.netFlow), tone: statistics.netFlow >= 0 ? "success" : "warning" },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard label="Income" value={formatCurrency(statistics.income)} hint="Recent transaction window only." />
        <DashboardMetricCard label="Spent" value={formatCurrency(statistics.spent)} hint="Expense rows only." />
        <DashboardMetricCard label="Net Flow" value={formatCurrency(statistics.netFlow)} hint="Income minus spent." />
        <DashboardMetricCard label="Transactions" value={statistics.transactionCount} hint="Last 200 max from query." />
      </div>

      {statistics.breakdown.length === 0 ? (
        <DashboardEmptyState
          icon={CircleDollarSign}
          title="No expense breakdown yet."
          description="Statistics card needs expense transactions before category distribution appears."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <SurfaceCard className="p-6 sm:p-7">
            <DashboardSectionTitle
              eyebrow="Breakdown"
              title="Expense categories"
              description="Sorted by amount descending. Percentages are rounded whole numbers from analytics query."
            />
            <div className="mt-6 space-y-4">
              {statistics.breakdown.map((item) => (
                <div key={item.label} className="rounded-[24px] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <p className="text-sm font-black text-[hsl(var(--foreground))]">{item.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-[hsl(var(--foreground))]">{formatCurrency(item.amount)}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatPercent(item.percentage)}</p>
                    </div>
                  </div>

                  <div className="mt-4 h-3 rounded-full bg-[hsl(var(--muted))]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(6, item.percentage)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <div className="space-y-6">
            <SurfaceCard className="p-6">
              <DashboardSectionTitle
                eyebrow="Highlights"
                title="Top pressure points"
                description="Fast read for parity audit and UI smoke checks."
              />
              <div className="mt-5 space-y-3">
                {statistics.breakdown.slice(0, 3).map((item, index) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-[22px] border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-[hsl(var(--foreground))]">
                        {index + 1}. {item.label}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatPercent(item.percentage)} of spending</p>
                    </div>
                    <ToneBadge tone={index === 0 ? "warning" : "neutral"}>{formatCurrency(item.amount)}</ToneBadge>
                  </div>
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-6">
              <DashboardSectionTitle
                eyebrow="Interpretation"
                title="How to read net flow"
                description="Positive means income exceeds expense across current analytics window. Negative means spend outran incoming cash."
              />
            </SurfaceCard>
          </div>
        </div>
      )}
    </DashboardPageShell>
  );
}
