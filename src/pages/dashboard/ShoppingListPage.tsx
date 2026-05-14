import { ShoppingBasket } from "lucide-react";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import {
  DashboardMetricCard,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionTitle,
  ToneBadge,
} from "@/components/dashboard/FinancePageHelpers";

export function ShoppingListPage() {
  return (
    <DashboardPageShell>
      <DashboardPageHero
        eyebrow="Support Shopping"
        title="Shopping list placeholder."
        description="Desktop scaffold only. No dedicated shopping-list API exists in current Convex surface, so this page stays honest."
        icon={ShoppingBasket}
        badges={[
          { label: "Placeholder", tone: "warning" },
          { label: "Manual flow today", tone: "neutral" },
        ]}
        metrics={[
          { label: "Status", value: "Ready shell" },
          { label: "Best current page", value: "Budgets" },
          { label: "Best current action", value: "Expense entry" },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SurfaceCard className="p-6 sm:p-7">
          <DashboardSectionTitle
            eyebrow="Use Instead"
            title="Current desktop path"
            description="Track planned spend with budgets, then post actual purchases through expense entry."
          />
          <div className="mt-5 flex flex-wrap gap-2">
            <ToneBadge tone="primary">Budgets</ToneBadge>
            <ToneBadge tone="warning">Expense entry</ToneBadge>
            <ToneBadge tone="neutral">History</ToneBadge>
          </div>
        </SurfaceCard>

        <div className="grid gap-4 sm:grid-cols-2">
          <DashboardMetricCard label="Needed API" value="List items" hint="Add create/update/check-off flow later." />
          <DashboardMetricCard label="Needed API" value="Categories" hint="Pair items with budget buckets." />
          <DashboardMetricCard label="Current Risk" value="No persistence" hint="Avoid fake local-only checklist state." />
          <DashboardMetricCard label="Parity Goal" value="Mobile support" hint="Scaffold ready when backend arrives." />
        </div>
      </div>
    </DashboardPageShell>
  );
}
