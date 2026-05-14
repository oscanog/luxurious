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

      <div className="grid gap-4 xl:grid-cols-2">
        {accounts.map((account) => (
          <SurfaceCard key={account.id} className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
                  {account.type === "credit" ? <Wallet size={18} /> : <Landmark size={18} />}
                </div>
                <div>
                  <p className="text-lg font-black text-[hsl(var(--foreground))]">{account.name}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {account.bank} • {account.type}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-[hsl(var(--foreground))]">{formatUsd(account.balance)}</p>
                <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">{account.currencyCode}</p>
              </div>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
