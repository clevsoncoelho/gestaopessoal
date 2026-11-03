export type FinanceContext = "personal" | "professional";
export type TransactionKind = "income" | "expense" | "transfer";
export type Transaction = { id: string; title: string; category: string; date: string; amount: number; kind: TransactionKind; context: FinanceContext; icon: string; notes: string };
export type Goal = { id: string; title: string; emoji: string; current: number; target: number; targetDate?: string; monthlyContribution: number; context: FinanceContext };
export type Bill = { id: string; title: string; amount: number; dueOn: string; status: "pending" | "paid" | "overdue" | "cancelled"; context: FinanceContext };
export type Budget = { id: string; name: string; used: number; limit: number; context: FinanceContext };
export function calculateGoalProgress(goal: Pick<Goal, "current" | "target">) {
  if (goal.target <= 0) return 0;
  return Math.min(100, Math.max(0, (goal.current / goal.target) * 100));
}

export function requiredMonthlyContribution(current: number, target: number, targetDate?: string, now = new Date()) {
  if (!targetDate || target <= current) return 0;
  const parsedTargetDate = new Date(`${targetDate}T12:00:00`);
  if (Number.isNaN(parsedTargetDate.getTime()) || parsedTargetDate <= now) return target - current;

  const months = Math.max(
    1,
    (parsedTargetDate.getFullYear() - now.getFullYear()) * 12
      + parsedTargetDate.getMonth() - now.getMonth()
      - (parsedTargetDate.getDate() <= now.getDate() ? 1 : 0)
  );
  return (target - current) / months;
}
export function sumByKind(items: Pick<Transaction, "amount" | "kind">[]) { return items.reduce((acc, item) => { if (item.kind === "income") acc.income += Math.abs(item.amount); if (item.kind === "expense") acc.expense += Math.abs(item.amount); return acc; }, { income: 0, expense: 0 }); }
export function budgetStatus(used: number, limit: number) { const ratio = limit <= 0 ? 1 : used / limit; if (ratio >= 1) return "red" as const; if (ratio >= .75) return "yellow" as const; return "green" as const; }
