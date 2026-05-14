import { useQuery } from "convex/react";
import { ArrowDownLeft, ArrowUpRight, Clock3 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import { Skeleton } from "@/components/ui/Skeleton";

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export function HistoryPage() {
  const items = useQuery(api.transactions.listHistory, { limit: 40 });

  if (items === undefined) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-36 rounded-[28px]" />
        <Skeleton className="h-24 rounded-[28px]" />
        <Skeleton className="h-24 rounded-[28px]" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <SurfaceCard className="p-6 sm:p-8">
        <div className="flex items-center gap-3 text-[hsl(var(--muted-foreground))]">
          <Clock3 size={18} />
          <span className="text-[11px] font-black uppercase tracking-[0.18em]">History</span>
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-[hsl(var(--foreground))]">
          Finance activity log.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))] sm:text-base">
          Promotions route here when momentum needs proof. Same underlying mobile transaction history.
        </p>
      </SurfaceCard>

      <div className="space-y-4">
        {items.map((item) => {
          const isIncome = item.kind === "income";
          return (
            <SurfaceCard key={item.id} className="p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                      isIncome
                        ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300"
                        : "bg-amber-500/12 text-amber-600 dark:text-amber-300"
                    }`}
                  >
                    {isIncome ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div>
                    <p className="text-lg font-black text-[hsl(var(--foreground))]">{item.title}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      {item.accountName} • {item.category}
                    </p>
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="text-lg font-black text-[hsl(var(--foreground))]">
                    {isIncome ? "+" : "-"}
                    {formatCurrency(item.amount)}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {new Date(item.occurredAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </SurfaceCard>
          );
        })}
      </div>
    </div>
  );
}
