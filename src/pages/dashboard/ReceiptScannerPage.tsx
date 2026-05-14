import { ScanSearch } from "lucide-react";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import {
  DashboardMetricCard,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionTitle,
  ToneBadge,
} from "@/components/dashboard/FinancePageHelpers";

export function ReceiptScannerPage() {
  return (
    <DashboardPageShell>
      <DashboardPageHero
        eyebrow="Support Scanner"
        title="Receipt scanner placeholder."
        description="Screen scaffold exists, but OCR and upload pipeline are not exposed by current Convex APIs. Manual expense entry stays source of truth."
        icon={ScanSearch}
        badges={[
          { label: "Placeholder", tone: "warning" },
          { label: "Manual capture only", tone: "neutral" },
        ]}
        metrics={[
          { label: "Upload Flow", value: "Missing" },
          { label: "OCR", value: "Missing" },
          { label: "Fallback", value: "Expense page" },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SurfaceCard className="p-6 sm:p-7">
          <DashboardSectionTitle
            eyebrow="Suggested Next Step"
            title="Backend before UI tricks"
            description="Need file upload, OCR extraction, and mutation target before desktop scanner can do real work."
          />
          <div className="mt-5 flex flex-wrap gap-2">
            <ToneBadge tone="primary">Upload endpoint</ToneBadge>
            <ToneBadge tone="primary">OCR action</ToneBadge>
            <ToneBadge tone="primary">Expense draft mutation</ToneBadge>
          </div>
        </SurfaceCard>

        <div className="grid gap-4 sm:grid-cols-2">
          <DashboardMetricCard label="Current Input" value="Manual note" hint="Use expense page note field for receipt details." />
          <DashboardMetricCard label="Current Audit" value="History page" hint="Verify recorded spend after manual entry." />
          <DashboardMetricCard label="Design Choice" value="No fake upload" hint="Placeholder avoids dead buttons." />
          <DashboardMetricCard label="Parity Goal" value="Future support" hint="Desktop shell ready for real pipeline." />
        </div>
      </div>
    </DashboardPageShell>
  );
}
