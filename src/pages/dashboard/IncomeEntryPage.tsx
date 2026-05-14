import { useState } from "react";
import { useMutation } from "convex/react";
import toast from "react-hot-toast";
import { api } from "../../../convex/_generated/api";
import { PageIntro } from "@/components/dashboard/PageIntro";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";

export function IncomeEntryPage() {
  return <TransactionEntryPage kind="income" title="Income" description="Manual income entry backed by mobile transactions." />;
}

export function ExpenseEntryPage() {
  return <TransactionEntryPage kind="expense" title="Expense" description="Manual expense entry backed by mobile transactions." />;
}

function TransactionEntryPage({
  kind,
  title,
  description,
}: {
  kind: "income" | "expense";
  title: string;
  description: string;
}) {
  const createIncome = useMutation(api.transactions.createIncome);
  const createExpense = useMutation(api.transactions.createExpense);
  const [form, setForm] = useState({ amount: "0", category: "", note: "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        amount: Number.parseFloat(form.amount),
        category: form.category.trim(),
        note: form.note.trim(),
      };
      if (kind === "income") {
        await createIncome(payload);
      } else {
        await createExpense(payload);
      }
      toast.success(`${title} saved`);
      setForm({ amount: "0", category: "", note: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to save ${title.toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageIntro eyebrow="Transactions" title={title} description={description} />
      <SurfaceCard className="p-6 sm:p-7 max-w-2xl">
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <Field label="Amount">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm outline-none focus:border-[hsl(var(--primary))]"
            />
          </Field>
          <Field label="Category">
            <input
              type="text"
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm outline-none focus:border-[hsl(var(--primary))]"
            />
          </Field>
          <Field label="Note">
            <textarea
              value={form.note}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
              rows={4}
              className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm outline-none focus:border-[hsl(var(--primary))]"
            />
          </Field>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[hsl(var(--primary))] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white disabled:opacity-50"
          >
            {saving ? "Saving" : `Save ${title}`}
          </button>
        </form>
      </SurfaceCard>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
        {label}
      </span>
      {children}
    </label>
  );
}
