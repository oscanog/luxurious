import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import toast from "react-hot-toast";
import { CircleAlert, Landmark, Send } from "lucide-react";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import {
  DashboardDataSkeleton,
  DashboardDateTimeField,
  DashboardMetricCard,
  DashboardPageHero,
  DashboardPageShell,
  DashboardSectionTitle,
  DashboardSelectField,
  DashboardTextAreaField,
  DashboardTextField,
  ToneBadge,
  formatCurrency,
  formatDateTimeInputValue,
} from "@/components/dashboard/FinancePageHelpers";

type TransactionArgs = {
  amount: number;
  category: string;
  note?: string;
  occurredAt?: number;
};

type AccountView = {
  id: string;
  name: string;
  bank: string;
  balance: number;
  type: string;
  currencyCode: string;
};

export function TransactionEntryView({
  kind,
  eyebrow,
  title,
  description,
  icon: Icon,
  categories,
  accounts,
  submit,
}: {
  kind: "income" | "expense";
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  categories: readonly string[];
  accounts: AccountView[] | undefined;
  submit: (args: TransactionArgs) => Promise<unknown>;
}) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "Other");
  const [note, setNote] = useState("");
  const [occurredAt, setOccurredAt] = useState(formatDateTimeInputValue());
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (accounts === undefined) {
    return <DashboardDataSkeleton rowCount={2} />;
  }

  const defaultAccount =
    accounts.find((account) =>
      kind === "income"
        ? account.type !== "credit"
        : account.type === "cash" || account.type === "checking",
    ) ?? accounts[0];

  async function handleSubmit() {
    const parsedAmount = Number.parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter valid amount");
      return;
    }
    if (!defaultAccount) {
      toast.error("No account available");
      return;
    }

    setIsSubmitting(true);
    try {
      await submit({
        amount: parsedAmount,
        category,
        note: note.trim() || undefined,
        occurredAt: occurredAt ? new Date(occurredAt).getTime() : undefined,
      });
      toast.success(kind === "income" ? "Income saved" : "Expense saved");
      setAmount("");
      setNote("");
      setOccurredAt(formatDateTimeInputValue());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardPageShell>
      <DashboardPageHero
        eyebrow={eyebrow}
        title={title}
        description={description}
        icon={Icon}
        badges={[
          { label: kind === "income" ? "Credits default account" : "Debits default account", tone: "neutral" },
          { label: defaultAccount ? defaultAccount.name : "No account", tone: defaultAccount ? "success" : "warning" },
        ]}
        metrics={[
          { label: "Route", value: defaultAccount?.bank ?? "Waiting", tone: "primary" },
          {
            label: "Balance",
            value: defaultAccount ? formatCurrency(defaultAccount.balance, defaultAccount.currencyCode) : "--",
            tone: kind === "income" ? "success" : "warning",
          },
          { label: "Categories", value: categories.length },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SurfaceCard className="p-6 sm:p-7">
          <DashboardSectionTitle
            eyebrow="Entry Form"
            title={kind === "income" ? "Post incoming cash" : "Post outgoing cash"}
            description="Desktop uses same Convex mutation flow as mobile. Server picks default account."
          />

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <DashboardTextField
              label="Amount"
              type="number"
              value={amount}
              onChange={setAmount}
              placeholder="0.00"
            />
            <DashboardSelectField label="Category" value={category} options={[...categories]} onChange={setCategory} />
            <DashboardDateTimeField label="Occurred At" value={occurredAt} onChange={setOccurredAt} />
            <div className="rounded-[24px] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                Destination Account
              </p>
              <p className="mt-2 text-lg font-black text-[hsl(var(--foreground))]">
                {defaultAccount?.name ?? "None"}
              </p>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                {defaultAccount ? `${defaultAccount.bank} • ${defaultAccount.type}` : "Create or unarchive account first."}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <DashboardTextAreaField
              label="Note"
              value={note}
              onChange={setNote}
              rows={5}
              placeholder={kind === "income" ? "Salary, freelance, bonus..." : "Groceries, bills, transport..."}
            />
          </div>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Send size={15} />
            {isSubmitting ? "Saving" : kind === "income" ? "Record income" : "Record expense"}
          </button>
        </SurfaceCard>

        <div className="space-y-6">
          <DashboardMetricCard
            label="Posting Rule"
            value={defaultAccount?.name ?? "No account"}
            hint={
              kind === "income"
                ? "Income prefers first non-credit account. Fallback: first available account."
                : "Expense prefers cash/checking. Fallback: first available account."
            }
          />

          <SurfaceCard className="p-6 sm:p-7">
            <DashboardSectionTitle
              eyebrow="Quick Tags"
              title="Category set"
              description="Keep desktop labels aligned with mobile seed data."
            />
            <div className="mt-5 flex flex-wrap gap-2">
              {categories.map((entry) => (
                <ToneBadge
                  key={entry}
                  tone={entry === category ? (kind === "income" ? "success" : "warning") : "neutral"}
                >
                  {entry}
                </ToneBadge>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
                <Landmark size={18} />
              </div>
              <DashboardSectionTitle
                eyebrow="Available Accounts"
                title="Posting targets"
                description="Read only. Mutation still decides final account server-side."
              />
            </div>
            <div className="mt-5 space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-[22px] border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-bold text-[hsl(var(--foreground))]">{account.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {account.bank} • {account.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[hsl(var(--foreground))]">
                      {formatCurrency(account.balance, account.currencyCode)}
                    </p>
                    {defaultAccount?.id === account.id ? <ToneBadge tone="primary">Default</ToneBadge> : null}
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-600 dark:text-amber-300">
                <CircleAlert size={18} />
              </div>
              <div>
                <p className="text-sm font-black text-[hsl(var(--foreground))]">Behavior note</p>
                <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                  Account picker not exposed by current mutation API. This screen mirrors current backend rule instead of
                  inventing client-only state.
                </p>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </DashboardPageShell>
  );
}
