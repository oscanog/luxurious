import { CalendarDays } from "lucide-react";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import {
  DashboardMetricCard,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionTitle,
  ToneBadge,
} from "@/components/dashboard/FinancePageHelpers";

export function CalendarPage() {
  return (
    <DashboardPageShell>
      <DashboardPageHero
        eyebrow="Support Calendar"
        title="Calendar placeholder."
        description="Desktop shell ready. Scheduling workflows still need dedicated backend surface before this becomes interactive."
        icon={CalendarDays}
        badges={[
          { label: "Placeholder", tone: "warning" },
          { label: "No Convex API yet", tone: "neutral" },
        ]}
        metrics={[
          { label: "Status", value: "Scaffolded" },
          { label: "Sync", value: "Pending", tone: "warning" },
          { label: "Focus", value: "Planning" },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SurfaceCard className="p-6 sm:p-7">
          <DashboardSectionTitle
            eyebrow="Future Scope"
            title="Likely desktop jobs"
            description="Once API exists, this page can cover due dates, reminders, and timeline grouping."
          />
          <div className="mt-5 flex flex-wrap gap-2">
            <ToneBadge tone="primary">Budget reminders</ToneBadge>
            <ToneBadge tone="primary">Installment due dates</ToneBadge>
            <ToneBadge tone="primary">Debt payment cadence</ToneBadge>
          </div>
        </SurfaceCard>

        <div className="grid gap-4 sm:grid-cols-2">
          <DashboardMetricCard label="Current Workaround" value="Installments" hint="Use installment page for near-term due dates." />
          <DashboardMetricCard label="Current Workaround" value="History" hint="Use history page for past finance events." />
          <DashboardMetricCard label="Desktop State" value="Safe placeholder" hint="No fake data added." />
          <DashboardMetricCard label="Next API Need" value="Events CRUD" hint="Calendar becomes useful only after event model exists." />
        </div>
      </div>
    </DashboardPageShell>
  );
}
