import { useMutation, useQuery } from "convex/react";
import { ArrowDownLeft } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { INCOME_CATEGORIES } from "@/components/dashboard/FinancePageHelpers";
import { TransactionEntryView } from "@/components/dashboard/TransactionEntryView";

export function IncomePage() {
  const accounts = useQuery(api.financials.listAccounts);
  const createIncome = useMutation(api.transactions.createIncome);

  return (
    <TransactionEntryView
      kind="income"
      eyebrow="Income Entry"
      title="Record incoming funds."
      description="Desktop income entry writes through existing Convex mutation, then account balance updates on backend."
      icon={ArrowDownLeft}
      categories={INCOME_CATEGORIES}
      accounts={accounts}
      submit={createIncome}
    />
  );
}
