import { useQuery } from "convex/react";
import { Gauge, WalletCards } from "lucide-react";
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
  formatPercent,
} from "@/components/dashboard/FinancePageHelpers";

export function BudgetsPage() {
  const budgets = useQuery(api.planning.getBudgets);

  if (budgets === undefined) {
    return <DashboardDataSkeleton rowCount={4} />;
  }

  const totalLimit = budgets.reduce((sum, budget) => sum + budget.total, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const overBudgetCount = budgets.filter((budget) => budget.isOver).length;
  const orderedBudgets = [...budgets].sort((left, right) => right.spent / right.total - left.spent / left.total);

  return (
    <DashboardPageShell>
      <DashboardPageHero
        eyebrow="Planning Budgets"
        title="Category budgets at glance."
        description="Desktop budget cards use same overview math mobile uses: current month expense rollup matched against budget limits."
        icon={WalletCards}
        badges={[
          { label: `${budgets.length} categories`, tone: "neutral" },
          { label: overBudgetCount > 0 ? `${overBudgetCount} over limit` : "On track", tone: overBudgetCount > 0 ? "warning" : "success" },
        ]}
        metrics={[
          { label: "Planned", value: formatCurrency(totalLimit) },
          { label: "Spent", value: formatCurrency(totalSpent), tone: "warning" },
          { label: "Remaining", value: formatCurrency(totalLimit - totalSpent), tone: totalLimit - totalSpent >= 0 ? "success" : "warning" },
        ]}
      />

      {budgets.length === 0 ? (
        <DashboardEmptyState
          icon={WalletCards}
          title="No budget plans yet."
          description="Budget cards come from mobile planning seed. If empty, bootstrap planning data first."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            {orderedBudgets.map((budget) => {
              const ratio = budget.total === 0 ? 0 : (budget.spent / budget.total) * 100;
              return (
                <SurfaceCard key={budget.id} className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-black text-[hsl(var(--foreground))]">{budget.category}</p>
                        <ToneBadge tone={budget.isOver ? "warning" : "success"}>
                          {budget.isOver ? "Over budget" : "Within budget"}
                        </ToneBadge>
                      </div>
                      <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                        {formatCurrency(budget.spent)} spent of {formatCurrency(budget.total)}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-lg font-black text-[hsl(var(--foreground))]">{formatPercent(ratio)}</p>
                      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                        {budget.isOver ? formatCurrency(budget.spent - budget.total) : formatCurrency(budget.total - budget.spent)}{" "}
                        {budget.isOver ? "over" : "left"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <DashboardProgressBar value={budget.spent} max={budget.total} tone={budget.isOver ? "warning" : "success"} />
                  </div>
                  <div className="mt-3 h-2 rounded-full" style={{ backgroundColor: `${budget.color}33` }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, ratio)}%`,
                        backgroundColor: budget.color,
                      }}
                    />
                  </div>
                </SurfaceCard>
              );
            })}
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <DashboardMetricCard
                label="Utilization"
                value={totalLimit === 0 ? "0%" : formatPercent((totalSpent / totalLimit) * 100)}
                hint="All categories combined."
              />
              <DashboardMetricCard
                label="Top Pressure"
                value={orderedBudgets[0]?.category ?? "None"}
                hint="Highest spend-to-limit ratio."
              />
            </div>

            <SurfaceCard className="p-6">
              <DashboardSectionTitle
                eyebrow="Pressure Board"
                title="Most stressed budgets"
                description="Sorted by utilization, not raw amount."
              />
              <div className="mt-5 space-y-3">
                {orderedBudgets.slice(0, 4).map((budget) => {
                  const ratio = budget.total === 0 ? 0 : (budget.spent / budget.total) * 100;
                  return (
                    <div
                      key={budget.id}
                      className="rounded-[22px] border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-bold text-[hsl(var(--foreground))]">{budget.category}</span>
                        <ToneBadge tone={budget.isOver ? "warning" : "neutral"}>{formatPercent(ratio)}</ToneBadge>
                      </div>
                      <div className="mt-3">
                        <DashboardProgressBar value={budget.spent} max={budget.total} tone={budget.isOver ? "warning" : "primary"} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-6">
              <DashboardSectionTitle
                eyebrow="Logic"
                title="Current month only"
                description="Spent numbers come from expense transactions inside current month window. Older expenses do not count against these cards."
              />
              <div className="mt-5 flex items-center gap-3 rounded-[22px] bg-[hsl(var(--muted))] px-4 py-3">
                <Gauge size={18} className="text-[hsl(var(--muted-foreground))]" />
                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                  Planning query already joins budget plan with expense history.
                </span>
              </div>
            </SurfaceCard>
          </div>
        </div>
      )}
    </DashboardPageShell>
  );
}
