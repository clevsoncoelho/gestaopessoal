"use client";

import { useMemo, useState } from "react";
import { type Transaction } from "@/lib/finance";
import { type FinanceContext } from "@/lib/finance";
import { type Budget } from "@/lib/finance";
import { budgetStatus } from "@/lib/finance";
import { BillsPanel } from "./BillsPanel";
import { BudgetModal } from "./BudgetModal";
import { Empty } from "@/components/ui/Empty";
import { Icon } from "@/components/ui/Icon";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface AnalyticsViewProps {
  items: Transaction[];
  totals: { income: number; expense: number };
  budgetTotals: { used: number; limit: number };
  budgets: Budget[];
  context: FinanceContext;
  userId: string | null;
  onError: (msg: string) => void;
  onBudgetCreated: () => void;
  onRefresh?: () => void;
}

function Metric({
  label,
  value,
  tone,
  border,
  subtext,
}: {
  label: string;
  value: string;
  tone: string;
  border: string;
  subtext?: string;
}) {
  return (
    <div className={`rounded-2xl border bg-white/03 p-4 ${border}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-2 text-xl font-bold ${tone}`}>{value}</p>
      {subtext && <p className="mt-1 text-[11px] text-slate-500">{subtext}</p>}
    </div>
  );
}

export function AnalyticsView({
  items,
  totals,
  budgetTotals,
  budgets,
  context,
  userId,
  onError,
  onBudgetCreated,
  onRefresh,
}: AnalyticsViewProps) {
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  const savings = totals.income - totals.expense;
  const savingsRate = totals.income > 0 ? (savings / totals.income) * 100 : 0;

  // Breakdown por categoria
  const categories = useMemo(() => {
    return items
      .filter((i) => i.kind === "expense")
      .reduce<Record<string, number>>((acc, i) => {
        acc[i.category] = (acc[i.category] ?? 0) + Math.abs(i.amount);
        return acc;
      }, {});
  }, [items]);

  const ranked = useMemo(() => {
    return Object.entries(categories).sort((a, b) => b[1] - a[1]);
  }, [categories]);

  const maxCategory = ranked[0]?.[1] ?? 1;

  // Evolução dos últimos 6 meses
  const monthlyHistory = useMemo(() => {
    const monthsMap: Record<string, { month: string; income: number; expense: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString("pt-BR", { month: "short" });
      monthsMap[key] = { month: label, income: 0, expense: 0 };
    }

    items.forEach((t) => {
      const key = t.date.slice(0, 7);
      if (monthsMap[key]) {
        if (t.kind === "income") monthsMap[key].income += Math.abs(t.amount);
        if (t.kind === "expense") monthsMap[key].expense += Math.abs(t.amount);
      }
    });

    return Object.values(monthsMap);
  }, [items]);

  const maxMonthlyVal = useMemo(() => {
    return Math.max(
      ...monthlyHistory.flatMap((m) => [m.income, m.expense]),
      1
    );
  }, [monthlyHistory]);

  return (
    <section className="mt-6 space-y-4">
      {/* Metrics header */}
      <div className="soft-grid surface overflow-hidden rounded-[30px] p-6">
        <p className="eyebrow">inteligência financeira</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Seu mês em números</h2>
            <p className="mt-1 text-sm text-slate-400">
              Taxa de poupança atual de{" "}
              <strong className={savingsRate >= 0 ? "text-emerald-400" : "text-rose-400"}>
                {savingsRate.toFixed(1)}%
              </strong>
            </p>
          </div>
          <div className="icon-box h-12 w-12 rounded-2xl">
            <Icon name="chart" size={22} />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Metric
            label="Receitas"
            value={currency.format(totals.income)}
            tone="text-emerald-400"
            border="border-emerald-500/20"
          />
          <Metric
            label="Despesas"
            value={currency.format(totals.expense)}
            tone="text-rose-400"
            border="border-rose-500/20"
          />
          <Metric
            label="Resultado Líquido"
            value={currency.format(savings)}
            tone={savings >= 0 ? "text-emerald-400" : "text-rose-400"}
            border={savings >= 0 ? "border-emerald-500/20" : "border-rose-500/20"}
            subtext={savings >= 0 ? "Superávit no período" : "Déficit no período"}
          />
          <Metric
            label="Uso do orçamento"
            value={
              budgetTotals.limit
                ? `${Math.round((budgetTotals.used / budgetTotals.limit) * 100)}%`
                : "—"
            }
            tone="text-indigo-400"
            border="border-indigo-500/20"
            subtext={
              budgetTotals.limit
                ? `${currency.format(budgetTotals.used)} de ${currency.format(budgetTotals.limit)}`
                : "Sem teto definido"
            }
          />
        </div>
      </div>

      {/* Histórico Semestral Bar Chart */}
      <div className="glass rounded-[28px] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="eyebrow">evolução temporal</p>
            <h3 className="mt-1 text-lg font-semibold text-white">Últimos 6 meses</h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Entradas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              Saídas
            </span>
          </div>
        </div>

        <div className="flex h-36 items-end justify-between gap-3 pt-4">
          {monthlyHistory.map((m) => {
            const incHeight = Math.max(8, (m.income / maxMonthlyVal) * 100);
            const expHeight = Math.max(8, (m.expense / maxMonthlyVal) * 100);
            return (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-24 w-full items-end justify-center gap-1.5">
                  <div
                    title={`Entradas: ${currency.format(m.income)}`}
                    className="w-2.5 rounded-t-md bg-emerald-500/80 transition-all hover:bg-emerald-400"
                    style={{ height: `${incHeight}%` }}
                  />
                  <div
                    title={`Saídas: ${currency.format(m.expense)}`}
                    className="w-2.5 rounded-t-md bg-rose-500/80 transition-all hover:bg-rose-400"
                    style={{ height: `${expHeight}%` }}
                  />
                </div>
                <span className="text-[11px] font-medium text-slate-400 capitalize">
                  {m.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="glass rounded-[28px] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">distribuição de gastos</p>
            <h3 className="mt-1 text-lg font-semibold text-white">Gastos por categoria</h3>
          </div>
          <Icon name="filter" size={18} className="text-slate-500" />
        </div>
        <div className="mt-5 space-y-4">
          {ranked.length ? (
            ranked.slice(0, 7).map(([name, value]) => (
              <div key={name}>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{name}</span>
                  <strong className="text-slate-100">{currency.format(value)}</strong>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/08">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    style={{ width: `${(value / maxCategory) * 100}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <Empty
              title="Ainda não há dados suficientes"
              text="Adicione algumas transações para visualizar o ranking por categoria."
            />
          )}
        </div>
      </div>

      {/* Budgets */}
      <div className="glass rounded-[28px] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="eyebrow">limites mensais</p>
            <h3 className="mt-1 text-lg font-semibold text-white">Orçamentos por Categoria</h3>
          </div>
          <button
            onClick={() => setShowBudgetModal(true)}
            className="btn-primary rounded-xl px-3 py-2 text-xs"
          >
            + Orçamento
          </button>
        </div>
        {budgets.length ? (
          <div className="space-y-4">
            {budgets.map((budget) => {
              const pct = budget.limit > 0 ? Math.min(100, (budget.used / budget.limit) * 100) : 0;
              const state = budgetStatus(budget.used, budget.limit);
              return (
                <div key={budget.id}>
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-slate-200 font-medium">{budget.name}</span>
                    <span
                      className={`font-semibold ${
                        state === "red"
                          ? "text-rose-400"
                          : state === "yellow"
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {currency.format(budget.used)} / {currency.format(budget.limit)} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/08">
                    <div
                      className={`h-full rounded-full transition-all ${
                        state === "red"
                          ? "bg-rose-500"
                          : state === "yellow"
                          ? "bg-amber-400"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-2 text-center text-xs text-slate-500">
            Nenhum orçamento configurado para este mês.
          </p>
        )}
      </div>

      {/* Bills panel */}
      <BillsPanel context={context} onError={onError} onBillPaid={onRefresh} />

      {showBudgetModal && (
        <BudgetModal
          userId={userId}
          context={context}
          onClose={() => setShowBudgetModal(false)}
          onSaved={() => {
            setShowBudgetModal(false);
            onBudgetCreated();
          }}
          onError={onError}
        />
      )}
    </section>
  );
}
