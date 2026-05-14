import { useMutation, useQuery } from "convex/react";
import { ArrowUpRight } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { EXPENSE_CATEGORIES } from "@/components/dashboard/FinancePageHelpers";
import { TransactionEntryView } from "@/components/dashboard/TransactionEntryView";

export function ExpensePage() {
  const accounts = useQuery(api.financials.listAccounts);
  const createExpense = useMutation(api.transactions.createExpense);

  return (
    <TransactionEntryView
      kind="expense"
      eyebrow="Expense Entry"
      title="Record outgoing spend."
      description="Desktop expense entry hits existing Convex mutation, then backend adjusts chosen default account balance."
      icon={ArrowUpRight}
      categories={EXPENSE_CATEGORIES}
      accounts={accounts}
      submit={createExpense}
    />
  );
}
