import { useQuery } from "convex/react";
import { BadgeDollarSign, Globe2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import {
  DashboardDataSkeleton,
  DashboardMetricCard,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionTitle,
  ToneBadge,
} from "@/components/dashboard/FinancePageHelpers";

export function CurrencyPage() {
  const currencies = useQuery(api.financials.listCurrencies);
  const accounts = useQuery(api.financials.listAccounts);

  if (currencies === undefined || accounts === undefined) {
    return <DashboardDataSkeleton rowCount={4} />;
  }

  const accountCountByCode = accounts.reduce<Record<string, number>>((summary, account) => {
    summary[account.currencyCode] = (summary[account.currencyCode] ?? 0) + 1;
    return summary;
  }, {});
  const activeCodes = Object.keys(accountCountByCode);

  return (
    <DashboardPageShell>
      <DashboardPageHero
        eyebrow="Currency Reference"
        title="Supported currency list."
        description="Reference table comes from Convex seed data. Good for parity check and account coverage, not live FX trading."
        icon={Globe2}
        badges={[
          { label: "Reference only", tone: "neutral" },
          { label: `${activeCodes.length} active`, tone: "success" },
        ]}
        metrics={[
          { label: "Supported", value: currencies.length },
          { label: "Account Codes", value: activeCodes.length, tone: "success" },
          { label: "Base Rate", value: "USD 1.00" },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                <th className="px-6 py-4">Currency</th>
                <th className="px-6 py-4">Rate vs USD</th>
                <th className="px-6 py-4">Usage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {currencies.map((currency) => {
                const usageCount = accountCountByCode[currency.code] ?? 0;
                return (
                  <tr key={currency.code} className="transition-colors hover:bg-[hsl(var(--muted))]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
                          <BadgeDollarSign size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[hsl(var(--foreground))]">{currency.code}</span>
                          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))]">{currency.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-[hsl(var(--foreground))] tabular-nums">
                      {currency.rate}
                    </td>
                    <td className="px-6 py-4">
                      <ToneBadge tone={usageCount > 0 ? "success" : "neutral"}>
                        {usageCount > 0 ? `${usageCount} account` : "Unused"}
                      </ToneBadge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </SurfaceCard>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <DashboardMetricCard
              label="Unused Codes"
              value={currencies.length - activeCodes.length}
              hint="Available in reference list, but not tied to any current account."
            />
            <DashboardMetricCard
              label="Most Used"
              value={
                activeCodes.sort((left, right) => (accountCountByCode[right] ?? 0) - (accountCountByCode[left] ?? 0))[0] ??
                "None"
              }
              hint="Based on current account payload only."
            />
          </div>

          <SurfaceCard className="p-6">
            <DashboardSectionTitle
              eyebrow="Coverage"
              title="Active desktop codes"
              description="Highlights currencies already present in authenticated viewer accounts."
            />
            <div className="mt-5 flex flex-wrap gap-2">
              {activeCodes.length === 0 ? (
                <ToneBadge tone="warning">No active currencies</ToneBadge>
              ) : (
                activeCodes.map((code) => (
                  <ToneBadge key={code} tone="primary">
                    {code}
                  </ToneBadge>
                ))
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <DashboardSectionTitle
              eyebrow="Note"
              title="Rate usage"
              description="Current frontend only displays reference rates. No conversion logic or multi-book aggregation added here."
            />
          </SurfaceCard>
        </div>
      </div>
    </DashboardPageShell>
  );
}
