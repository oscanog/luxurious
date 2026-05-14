import { useQuery } from "convex/react";
import { BadgeAlert, Landmark, WalletMinimal } from "lucide-react";
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
} from "@/components/dashboard/FinancePageHelpers";

export function DebtTrackerPage() {
  const debts = useQuery(api.planning.getDebts);

  if (debts === undefined) {
    return <DashboardDataSkeleton rowCount={4} />;
  }

  const totalRemaining = debts.reduce((sum, debt) => sum + debt.remaining, 0);
  const totalPayments = debts.reduce((sum, debt) => sum + debt.payment, 0);
  const biggestDebt = [...debts].sort((left, right) => right.remaining - left.remaining)[0];

  return (
    <DashboardPageShell>
      <DashboardPageHero
        eyebrow="Debt Tracker"
        title="Debt stack overview."
        description="Tracker mirrors mobile planning debt cards. Focus: remaining balances, payment load, and cadence."
        icon={Landmark}
        badges={[
          { label: `${debts.length} debts`, tone: "neutral" },
          { label: totalRemaining > 0 ? "Active payoff" : "Clear", tone: totalRemaining > 0 ? "warning" : "success" },
        ]}
        metrics={[
          { label: "Remaining", value: formatCurrency(totalRemaining), tone: "warning" },
          { label: "Payment Load", value: formatCurrency(totalPayments) },
          { label: "Largest", value: biggestDebt?.name ?? "None" },
        ]}
      />

      {debts.length === 0 ? (
        <DashboardEmptyState
          icon={WalletMinimal}
          title="No debts tracked."
          description="Planning bootstrap normally seeds debt plans. Empty state means no debt rows for current mobile profile."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {debts.map((debt) => {
              const monthsLeft = debt.payment > 0 ? Math.ceil(debt.remaining / debt.payment) : null;
              return (
                <SurfaceCard key={debt.id} className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-black text-[hsl(var(--foreground))]">{debt.name}</p>
                        <ToneBadge tone="warning">{debt.type}</ToneBadge>
                      </div>
                      <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                        Scheduled payment {formatCurrency(debt.payment)}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-lg font-black text-[hsl(var(--foreground))]">{formatCurrency(debt.remaining)}</p>
                      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                        {monthsLeft ? `~${monthsLeft} cycles left` : "No payoff estimate"}
                      </p>
                    </div>
                  </div>
                </SurfaceCard>
              );
            })}
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <DashboardMetricCard
                label="Average Balance"
                value={debts.length === 0 ? formatCurrency(0) : formatCurrency(totalRemaining / debts.length)}
                hint="Simple remaining balance average."
              />
              <DashboardMetricCard
                label="Fastest Clear"
                value={
                  [...debts]
                    .sort((left, right) => left.remaining / left.payment - right.remaining / right.payment)[0]?.name ?? "None"
                }
                hint="Lowest remaining-to-payment ratio."
              />
            </div>

            <SurfaceCard className="p-6">
              <DashboardSectionTitle
                eyebrow="Priority"
                title="Largest balances"
                description="Simple descending sort by remaining amount."
              />
              <div className="mt-5 space-y-3">
                {[...debts]
                  .sort((left, right) => right.remaining - left.remaining)
                  .slice(0, 4)
                  .map((debt) => (
                    <div
                      key={debt.id}
                      className="flex items-center justify-between rounded-[22px] border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-bold text-[hsl(var(--foreground))]">{debt.name}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{debt.type}</p>
                      </div>
                      <p className="text-sm font-black text-[hsl(var(--foreground))]">{formatCurrency(debt.remaining)}</p>
                    </div>
                  ))}
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-600 dark:text-amber-300">
                  <BadgeAlert size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-[hsl(var(--foreground))]">Scope note</p>
                  <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                    Current API returns name, remaining, payment, and cadence only. Lender and APR are not exposed, so desktop keeps presentation honest.
                  </p>
                </div>
              </div>
            </SurfaceCard>
          </div>
        </div>
      )}
    </DashboardPageShell>
  );
}
