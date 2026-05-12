import { query } from "./_generated/server";
import {
  CATEGORY_COLORS,
  getMobileProfileForViewerOrThrow,
} from "./mobileHelpers";

export const getStatistics = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);
    const transactions = await ctx.db
      .query("financialTransactions")
      .withIndex("by_profileId_and_occurredAt", (q) => q.eq("profileId", profile._id))
      .order("desc")
      .take(200);

    let income = 0;
    let spent = 0;
    const expensesByCategory = new Map<string, number>();

    for (const transaction of transactions) {
      if (transaction.kind === "income") {
        income += transaction.amount;
        continue;
      }

      spent += transaction.amount;
      expensesByCategory.set(
        transaction.category,
        (expensesByCategory.get(transaction.category) ?? 0) + transaction.amount,
      );
    }

    const breakdown = [...expensesByCategory.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({
        label: category,
        amount,
        color: CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other,
        percentage: spent === 0 ? 0 : Number(((amount / spent) * 100).toFixed(0)),
      }));

    return {
      spent,
      income,
      netFlow: income - spent,
      transactionCount: transactions.length,
      breakdown,
    };
  },
});
