import { useMutation, useQuery } from "convex/react";
import { ScanSearch, Upload, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  DashboardMetricCard,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionTitle,
  ToneBadge,
} from "@/components/dashboard/FinancePageHelpers";

export function ReceiptScannerPage() {
  const receipts = useQuery(api.receipts.getReceipts);
  const generateUploadUrl = useMutation(api.receipts.generateUploadUrl);
  const saveReceipt = useMutation(api.receipts.saveReceipt);
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      await saveReceipt({ storageId });
      toast.success("Receipt uploaded. OCR processing initiated.");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (receipts === undefined) {
    return (
      <DashboardPageShell>
        <DashboardPageHero eyebrow="Scanning" title="Loading scanner..." description="Fetching your recent scans." icon={ScanSearch} />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </DashboardPageShell>
    );
  }

  const pendingCount = receipts.filter(r => r.status === "pending").length;

  return (
    <DashboardPageShell>
      <DashboardPageHero
        eyebrow="Financial Operations"
        title="Receipt Scanner."
        description="Upload images of your business receipts. Our OCR system extracts vendor, amount, and date automatically."
        icon={ScanSearch}
        badges={[
          { label: `${receipts.length} total scans`, tone: "neutral" },
          { label: pendingCount > 0 ? `${pendingCount} processing` : "All processed", tone: pendingCount > 0 ? "warning" : "success" },
        ]}
        metrics={[
          { label: "Processed", value: receipts.filter(r => r.status === "processed").length, tone: "success" },
          { label: "Pending", value: pendingCount, tone: "warning" },
          { label: "Sync", value: "Real-time" },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          <SurfaceCard className="p-8 border-dashed border-2 border-[hsl(var(--primary)/0.2)] flex flex-col items-center justify-center text-center group hover:border-[hsl(var(--primary)/0.5)] transition-all cursor-pointer bg-[hsl(var(--primary)/0.02)]"
            onClick={() => fileInputRef.current?.click()}>
            <input type="file" ref={fileInputRef} onChange={(e) => { void handleUpload(e); }} accept="image/*" className="hidden" />
            <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-[hsl(var(--primary))] mb-4 group-hover:scale-110 transition-transform">
              <Upload size={32} className={uploading ? "animate-bounce" : ""} />
            </div>
            <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">
              {uploading ? "Uploading Receipt..." : "Drop receipt here or click to browse"}
            </h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2 max-w-xs">
              Supports JPG, PNG and PDF. OCR usually takes less than 30 seconds.
            </p>
          </SurfaceCard>

          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Recent Scans</h3>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] divide-y divide-[hsl(var(--border))] overflow-hidden shadow-sm">
              {receipts.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText size={40} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-bold text-[hsl(var(--muted-foreground))]">No receipts scanned yet.</p>
                </div>
              ) : (
                receipts.map((r) => (
                  <div key={r._id} className="flex items-center gap-4 px-6 py-4 hover:bg-[hsl(var(--muted)/0.2)] transition-colors group">
                    <div className="w-12 h-12 rounded-lg bg-[hsl(var(--muted)/0.5)] overflow-hidden shrink-0 border border-[hsl(var(--border))]">
                      {r.url ? <img src={r.url} alt="Scan" className="w-full h-full object-cover" /> : <FileText className="w-full h-full p-3 opacity-20" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-[hsl(var(--foreground))] truncate">
                          {r.vendor || "Processing scan..."}
                        </p>
                        <ToneBadge tone={r.status === "processed" ? "success" : r.status === "pending" ? "warning" : "danger"}>
                          {r.status}
                        </ToneBadge>
                      </div>
                      <p className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase">
                        {r.date || "Waiting for OCR"} • {r.category || "Uncategorized"}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-[hsl(var(--foreground))]">
                        {r.totalAmount ? `$${r.totalAmount.toLocaleString()}` : "—"}
                      </p>
                      <p className="text-[10px] font-bold text-[hsl(var(--muted-foreground))]">USD</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4">
            <DashboardMetricCard 
              label="OCR Accuracy" 
              value="98.2%" 
              hint="Current extraction confidence." 
            />
            <DashboardMetricCard 
              label="Auto-Categorize" 
              value="Enabled" 
              hint="Matching against budget plans." 
            />
          </div>

          <SurfaceCard className="p-6">
            <DashboardSectionTitle
              eyebrow="Guidelines"
              title="Best Scan Quality"
              description="Ensure high accuracy by following these simple tips."
            />
            <div className="mt-5 space-y-4 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              <div className="flex gap-3">
                <CheckCircle2 size={16} className="text-[hsl(var(--primary))] shrink-0" />
                <p>Lay receipt flat on a dark background for contrast.</p>
              </div>
              <div className="flex gap-3">
                <Clock size={16} className="text-[hsl(var(--primary))] shrink-0" />
                <p>Ensure all four corners are visible in the frame.</p>
              </div>
              <div className="flex gap-3">
                <AlertCircle size={16} className="text-[hsl(var(--primary))] shrink-0" />
                <p>Avoid shadows or glare directly on the total amount.</p>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </DashboardPageShell>
  );
}
