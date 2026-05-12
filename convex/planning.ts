import { query, QueryCtx } from "./_generated/server";
import {
  getCurrentMonthStart,
  getMobileProfileForViewerOrThrow,
} from "./mobileHelpers";

async function buildOverview(ctx: QueryCtx) {
  const profile = await getMobileProfileForViewerOrThrow(ctx);
  const [budgets, debts, installments, expenses] = await Promise.all([
    ctx.db
      .query("budgetPlans")
      .withIndex("by_profileId_and_sortOrder", (q) => q.eq("profileId", profile._id))
      .take(20),
    ctx.db
      .query("debtPlans")
      .withIndex("by_profileId_and_sortOrder", (q) => q.eq("profileId", profile._id))
      .take(20),
    ctx.db
      .query("installmentPlans")
      .withIndex("by_profileId_and_sortOrder", (q) => q.eq("profileId", profile._id))
      .take(20),
    ctx.db
      .query("financialTransactions")
      .withIndex("by_profileId_and_kind_and_occurredAt", (q) =>
        q.eq("profileId", profile._id).eq("kind", "expense"),
      )
      .order("desc")
      .take(200),
  ]);

  const monthStart = getCurrentMonthStart();
  const spentByCategory = new Map<string, number>();
  for (const expense of expenses) {
    if (expense.occurredAt < monthStart) {
      continue;
    }
    spentByCategory.set(
      expense.category,
      (spentByCategory.get(expense.category) ?? 0) + expense.amount,
    );
  }

  return {
    budgets: budgets.map((budget) => {
      const spent = spentByCategory.get(budget.category) ?? 0;
      return {
        id: budget._id,
        category: budget.category,
        spent,
        total: budget.limitAmount,
        color: budget.color,
        isOver: spent > budget.limitAmount,
      };
    }),
    debts: debts.map((debt) => ({
      id: debt._id,
      name: debt.name,
      remaining: debt.remainingAmount,
      payment: debt.paymentAmount,
      type: debt.paymentCadence,
    })),
    installments: installments.map((installment) => ({
      id: installment._id,
      item: installment.itemName,
      current: installment.currentInstallment,
      total: installment.totalInstallments,
      amount: installment.paymentAmount,
      nextDate: installment.nextDueDate,
    })),
  };
}

export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    return await buildOverview(ctx);
  },
});

export const getBudgets = query({
  args: {},
  handler: async (ctx) => {
    const overview = await buildOverview(ctx);
    return overview.budgets;
  },
});

export const getDebts = query({
  args: {},
  handler: async (ctx) => {
    const overview = await buildOverview(ctx);
    return overview.debts;
  },
});

export const getInstallments = query({
  args: {},
  handler: async (ctx) => {
    const overview = await buildOverview(ctx);
    return overview.installments;
  },
});
