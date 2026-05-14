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
        <div className="grid gap-4 md:grid-cols-2">
          {currencies.map((currency) => {
            const usageCount = accountCountByCode[currency.code] ?? 0;
            return (
              <SurfaceCard key={currency.code} className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-[hsl(var(--foreground))]">{currency.code}</p>
                    <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{currency.name}</p>
                  </div>
                  <ToneBadge tone={usageCount > 0 ? "success" : "neutral"}>
                    {usageCount > 0 ? `${usageCount} account` : "Unused"}
                  </ToneBadge>
                </div>

                <div className="mt-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                      Rate vs USD
                    </p>
                    <p className="mt-2 text-3xl font-black text-[hsl(var(--foreground))]">{currency.rate}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
                    <BadgeDollarSign size={18} />
                  </div>
                </div>
              </SurfaceCard>
            );
          })}
        </div>

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
