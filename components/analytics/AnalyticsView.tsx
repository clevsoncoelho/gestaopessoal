"use client";

import { useState } from "react";
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
}

function Metric({ label, value, tone, border }: { label: string; value: string; tone: string; border: string }) {
  return (
    <div className={`rounded-2xl border bg-white/03 p-4 ${border}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-2 text-xl font-bold ${tone}`}>{value}</p>
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
}: AnalyticsViewProps) {
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  const savings = totals.income - totals.expense;
  const categories = items
    .filter((i) => i.kind === "expense")
    .reduce<Record<string, number>>((acc, i) => {
      acc[i.category] = (acc[i.category] ?? 0) + Math.abs(i.amount);
      return acc;
    }, {});
  const ranked = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  const max = ranked[0]?.[1] ?? 1;

  return (
    <section className="mt-6 space-y-4">
      {/* Metrics header */}
      <div className="soft-grid surface overflow-hidden rounded-[30px] p-6">
        <p className="eyebrow">inteligência financeira</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Seu mês em números</h2>
            <p className="mt-2 text-sm text-slate-400">
              Uma leitura rápida do seu comportamento financeiro.
            </p>
          </div>
          <div className="icon-box h-12 w-12 rounded-2xl">
            <Icon name="chart" size={22} />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Metric label="Receitas" value={currency.format(totals.income)} tone="text-emerald-400" border="border-emerald-500/20" />
          <Metric label="Despesas" value={currency.format(totals.expense)} tone="text-rose-400" border="border-rose-500/20" />
          <Metric
            label="Resultado"
            value={currency.format(savings)}
            tone={savings >= 0 ? "text-emerald-400" : "text-rose-400"}
            border={savings >= 0 ? "border-emerald-500/20" : "border-rose-500/20"}
          />
          <Metric
            label="Uso do orçamento"
            value={budgetTotals.limit ? `${Math.round((budgetTotals.used / budgetTotals.limit) * 100)}%` : "—"}
            tone="text-indigo-400"
            border="border-indigo-500/20"
          />
        </div>
      </div>

      {/* Category breakdown */}
      <div className="glass rounded-[28px] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">onde seu dinheiro vai</p>
            <h3 className="mt-1 text-lg font-semibold">Gastos por categoria</h3>
          </div>
          <Icon name="filter" size={18} className="text-slate-500" />
        </div>
        <div className="mt-5 space-y-4">
          {ranked.length ? (
            ranked.slice(0, 7).map(([name, value]) => (
              <div key={name}>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-slate-300">{name}</span>
                  <strong className="text-slate-100">{currency.format(value)}</strong>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/08">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    style={{ width: `${(value / max) * 100}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <Empty
              title="Ainda não há dados suficientes"
              text="Adicione algumas transações para ver seus padrões."
            />
          )}
        </div>
      </div>

      {/* Budgets */}
      <div className="glass rounded-[28px] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="eyebrow">limites mensais</p>
            <h3 className="mt-1 text-lg font-semibold">Orçamentos</h3>
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
                    <span className="text-slate-300">{budget.name}</span>
                    <span
                      className={`font-semibold ${
                        state === "red" ? "text-rose-400" : state === "yellow" ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {currency.format(budget.used)} / {currency.format(budget.limit)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/08">
                    <div
                      className={`h-full rounded-full ${
                        state === "red" ? "bg-rose-500" : state === "yellow" ? "bg-amber-400" : "bg-emerald-500"
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
            Nenhum orçamento para este mês. Crie um para controlar seus gastos.
          </p>
        )}
      </div>

      {/* Bills */}
      <BillsPanel context={context} onError={onError} />

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
