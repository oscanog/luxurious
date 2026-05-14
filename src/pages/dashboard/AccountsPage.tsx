import { useQuery } from "convex/react";
import { Landmark, Wallet } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { PageIntro, formatUsd } from "@/components/dashboard/PageIntro";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import { Skeleton } from "@/components/ui/Skeleton";

export function AccountsPage() {
  const accounts = useQuery(api.financials.listAccounts);

  if (accounts === undefined) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-40 rounded-[28px]" />
        <Skeleton className="h-28 rounded-[28px]" />
        <Skeleton className="h-28 rounded-[28px]" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageIntro
        eyebrow="Finance"
        title="Accounts"
        description="Desktop view of the same mobile-backed account list, balances, and institutions."
      />

      <SurfaceCard className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
              <th className="px-6 py-4">Account</th>
              <th className="px-6 py-4">Institution</th>
              <th className="px-6 py-4 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {accounts.map((account) => (
              <tr key={account.id} className="transition-colors hover:bg-[hsl(var(--muted))]">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
                      {account.type === "credit" ? <Wallet size={16} /> : <Landmark size={16} />}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-[hsl(var(--foreground))]">{account.name}</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))]">{account.type}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-[hsl(var(--muted-foreground))]">
                  {account.bank}
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="text-lg font-black text-[hsl(var(--foreground))] tabular-nums">{formatUsd(account.balance)}</p>
                  <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))]">{account.currencyCode}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SurfaceCard>
    </div>
  );
}
