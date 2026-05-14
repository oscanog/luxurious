import { useState } from "react";
import { useQuery } from "convex/react";
import { ArrowDownLeft, ArrowUpRight, Clock3 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export function HistoryPage() {
  const [search, setSearch] = useState("");
  const items = useQuery(api.transactions.listHistory, { limit: 100 });

  if (items === undefined) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-36 rounded-[28px]" />
        <Skeleton className="h-24 rounded-[28px]" />
        <Skeleton className="h-24 rounded-[28px]" />
      </div>
    );
  }

  const filteredItems = items.filter((item) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return (
      item.title.toLowerCase().includes(needle) ||
      item.accountName.toLowerCase().includes(needle) ||
      item.category.toLowerCase().includes(needle)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-[hsl(210_40%_90%)] bg-[linear-gradient(135deg,hsl(210_40%_99%),hsl(210_40%_96%))] dark:border-[rgb(37_99_235_/_0.42)] dark:bg-[linear-gradient(135deg,#26459E,#1E3A8A)]">
        <div className="flex flex-col gap-6 px-[22px] py-[18px] md:flex-row md:items-end md:justify-between md:gap-4 md:pr-[18px]">
          <div className="flex-1 pb-[18px]">
            <div className="flex items-center gap-3 text-[hsl(var(--muted-foreground))] dark:text-blue-100/60 mb-2">
              <Clock3 size={16} />
              <span className="text-[11px] font-black uppercase tracking-[0.18em]">History</span>
            </div>
            <h1 className="mt-2 text-[32px] font-bold leading-[1.05] tracking-[-0.04em] text-[hsl(var(--foreground))] dark:text-white sm:text-[44px]">
              Activity log.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))] dark:text-blue-100/80 sm:text-base max-w-2xl">
              Promotions route here when momentum needs proof. Same underlying mobile transaction history.
            </p>
          </div>
        </div>
      </section>


      
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div />
        <DashboardSearch 
          value={search} 
          onChange={setSearch} 
          placeholder="Search transactions..." 
        />
      </div>

      <SurfaceCard className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
              <th className="px-6 py-4">Transaction</th>
              <th className="px-6 py-4">Details</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {filteredItems.map((item) => {
              const isIncome = item.kind === "income";
              return (
                <tr key={item.id} className="transition-colors hover:bg-[hsl(var(--muted))]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          isIncome
                            ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300"
                            : "bg-amber-500/12 text-amber-600 dark:text-amber-300"
                        }`}
                      >
                        {isIncome ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <span className="font-bold text-[hsl(var(--foreground))]">{item.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[hsl(var(--muted-foreground))]">
                    {item.accountName} • {item.category}
                  </td>
                  <td className={`px-6 py-4 text-right font-black tabular-nums ${isIncome ? "text-emerald-600 dark:text-emerald-300" : "text-amber-600 dark:text-amber-300"}`}>
                    {isIncome ? "+" : "-"}
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-6 py-4 text-right text-[hsl(var(--muted-foreground))] tabular-nums whitespace-nowrap">
                    {new Date(item.occurredAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SurfaceCard>
    </div>
  );
}
