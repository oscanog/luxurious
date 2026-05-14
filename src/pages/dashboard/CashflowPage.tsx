import { useQuery } from "convex/react";
import { ArrowDownLeft, ArrowUpRight, Waves } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import {
  DashboardDataSkeleton,
  DashboardEmptyState,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionTitle,
  formatCurrency,
} from "@/components/dashboard/FinancePageHelpers";

export function CashflowPage() {
  const cashflow = useQuery(api.financials.getCashflow);

  if (cashflow === undefined) {
    return <DashboardDataSkeleton rowCount={3} />;
  }

  const netFlow = cashflow.totalInflow - cashflow.totalOutflow;
  const maxMonthlyValue = Math.max(1, ...cashflow.monthly.flatMap((item) => [item.inflow, item.outflow]));

  return (
    <DashboardPageShell>
      <DashboardPageHero
        eyebrow="Cashflow"
        title="Inflow versus outflow."
        description="Monthly rollup comes straight from Convex transaction history. Desktop stays summary-first, with quick read on trend and swing."
        icon={Waves}
        badges={[
          { label: `${cashflow.monthly.length} months`, tone: "neutral" },
          { label: netFlow >= 0 ? "Net positive" : "Net negative", tone: netFlow >= 0 ? "success" : "warning" },
        ]}
        metrics={[
          { label: "Inflow", value: formatCurrency(cashflow.totalInflow), tone: "success" },
          { label: "Outflow", value: formatCurrency(cashflow.totalOutflow), tone: "warning" },
          { label: "Net Flow", value: formatCurrency(netFlow), tone: netFlow >= 0 ? "success" : "warning" },
        ]}
      />

      {cashflow.monthly.length === 0 ? (
        <DashboardEmptyState
          icon={Waves}
          title="No monthly cashflow yet."
          description="Post income or expense entries first. Monthly aggregation fills from transaction history."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SurfaceCard className="p-6 sm:p-7">
            <DashboardSectionTitle
              eyebrow="Trend"
              title="Four-month snapshot"
              description="Green shows inflow. Amber shows outflow. Heights scale inside current window only."
            />

            <div className="mt-8 grid gap-5 md:grid-cols-4">
              {cashflow.monthly.map((item) => (
                <div key={item.label} className="rounded-[24px] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4">
                  <div className="flex h-44 items-end justify-center gap-3">
                    <div className="flex w-14 flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-[18px] bg-emerald-500/80"
                        style={{ height: `${Math.max(14, (item.inflow / maxMonthlyValue) * 150)}px` }}
                      />
                      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-300">
                        In
                      </span>
                    </div>
                    <div className="flex w-14 flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-[18px] bg-amber-500/80"
                        style={{ height: `${Math.max(14, (item.outflow / maxMonthlyValue) * 150)}px` }}
                      />
                      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300">
                        Out
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 text-center text-lg font-black text-[hsl(var(--foreground))]">{item.label}</p>
                  <p className="mt-2 text-center text-xs text-[hsl(var(--muted-foreground))]">
                    {formatCurrency(item.inflow)} in • {formatCurrency(item.outflow)} out
                  </p>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <div className="space-y-6">
            <SurfaceCard className="p-6">
              <DashboardSectionTitle
                eyebrow="Month Detail"
                title="Rollup list"
                description="Useful when chart impression is not enough."
              />
              <div className="mt-5 space-y-3">
                {cashflow.monthly.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[22px] border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-[hsl(var(--foreground))]">{item.label}</p>
                        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                          Net {formatCurrency(item.inflow - item.outflow)}
                        </p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-300">
                          + {formatCurrency(item.inflow)}
                        </p>
                        <p className="text-sm font-bold text-amber-600 dark:text-amber-300">
                          - {formatCurrency(item.outflow)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-6">
              <DashboardSectionTitle
                eyebrow="Read"
                title="What changed"
                description="Net flow swings when recent expenses catch up or fresh income lands."
              />
              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-3 rounded-[22px] bg-emerald-500/8 px-4 py-3 text-emerald-700 dark:text-emerald-300">
                  <ArrowDownLeft size={18} />
                  <span className="text-sm font-bold">Inflow total: {formatCurrency(cashflow.totalInflow)}</span>
                </div>
                <div className="flex items-center gap-3 rounded-[22px] bg-amber-500/8 px-4 py-3 text-amber-700 dark:text-amber-300">
                  <ArrowUpRight size={18} />
                  <span className="text-sm font-bold">Outflow total: {formatCurrency(cashflow.totalOutflow)}</span>
                </div>
              </div>
            </SurfaceCard>
          </div>
        </div>
      )}
    </DashboardPageShell>
  );
}
