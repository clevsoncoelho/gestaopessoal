"use client";

import { type Bill, type Goal, budgetStatus, calculateGoalProgress } from "@/lib/finance";
import { BalanceCard } from "./BalanceCard";
import { Icon } from "@/components/ui/Icon";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface DashboardProps {
  balance: number;
  hideBalance: boolean;
  setHideBalance: (v: boolean) => void;
  totals: { income: number; expense: number };
  featuredGoal?: Goal;
  visibleBills: Bill[];
  budgetTotals: { used: number; limit: number };
  setTab: (t: string) => void;
  onImportPdf?: () => void;
}

export function Dashboard({
  balance,
  hideBalance,
  setHideBalance,
  totals,
  featuredGoal,
  visibleBills,
  budgetTotals,
  setTab,
  onImportPdf,
}: DashboardProps) {
  const due = visibleBills.find((b) => b.status === "pending");
  const budgetPercent =
    budgetTotals.limit > 0 ? Math.min(100, (budgetTotals.used / budgetTotals.limit) * 100) : 0;
  const budgetState = budgetStatus(budgetTotals.used, budgetTotals.limit);

  return (
    <>
      <BalanceCard
        balance={balance}
        hideBalance={hideBalance}
        setHideBalance={setHideBalance}
        totals={totals}
      />

      {/* PDF Import Banner */}
      {onImportPdf && (
        <div className="glass mt-4 flex items-center justify-between rounded-2xl border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/20 text-indigo-400">
              <Icon name="chart" size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Importar Extrato em PDF</p>
              <p className="text-[11px] text-slate-400">
                Suba o PDF do seu banco e importe todas as transações em segundos.
              </p>
            </div>
          </div>
          <button
            onClick={onImportPdf}
            className="btn-primary rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap"
          >
            Importar PDF
          </button>
        </div>
      )}

      {/* Quick shortcuts header */}
      <div className="mt-7 flex items-end justify-between">
        <div>
          <p className="eyebrow">visão geral</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Atalhos inteligentes</h2>
        </div>
        <button
          onClick={() => setTab("Transações")}
          className="flex items-center gap-1 text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
        >
          Ver transações
          <Icon name="arrow-right" size={13} />
        </button>
      </div>

      {/* Quick cards */}
      <section className="mt-3 grid grid-cols-2 gap-3">
        {/* Featured goal */}
        <button
          onClick={() => setTab("Metas")}
          className="glass rounded-2xl p-4 text-left transition hover:border-indigo-500/20"
        >
          <p className="eyebrow">meta em destaque</p>
          <p className="mt-2 truncate text-sm font-semibold text-white">
            {featuredGoal?.title ?? "Crie sua primeira meta"}
          </p>
          {featuredGoal && (
            <>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/08">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500"
                  style={{ width: `${calculateGoalProgress(featuredGoal)}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-emerald-400">
                {calculateGoalProgress(featuredGoal).toFixed(0)}% concluído
              </p>
            </>
          )}
        </button>

        {/* Next bill */}
        <button
          onClick={() => setTab("Análise")}
          className="glass rounded-2xl p-4 text-left transition hover:border-amber-500/20"
        >
          <p className="eyebrow">próxima conta</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {due ? currency.format(due.amount) : "Tudo em dia"}
          </p>
          <p className="mt-2 text-[11px] text-amber-400">
            {due
              ? `vence ${new Date(`${due.dueOn}T12:00:00`).toLocaleDateString("pt-BR")}`
              : "nenhuma pendência"}
          </p>
        </button>
      </section>

      {/* Budget summary */}
      <section className="glass mt-6 rounded-[26px] p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">orçamento mensal</p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              {budgetTotals.limit > 0 ? "Essenciais" : "Nenhum orçamento"}
            </h2>
          </div>
          <span
            className={`text-sm font-bold ${
              budgetState === "red"
                ? "text-rose-400"
                : budgetState === "yellow"
                ? "text-amber-400"
                : "text-emerald-400"
            }`}
          >
            {budgetTotals.limit > 0 ? `${budgetPercent.toFixed(0)}%` : "—"}
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/08">
          <div
            className={`h-full rounded-full transition-all ${
              budgetState === "red"
                ? "bg-rose-500"
                : budgetState === "yellow"
                ? "bg-amber-400"
                : "bg-emerald-500"
            }`}
            style={{ width: `${budgetPercent}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {budgetTotals.limit > 0
            ? `${currency.format(budgetTotals.used)} usados de ${currency.format(budgetTotals.limit)}`
            : "Crie um orçamento para acompanhar seus limites."}
        </p>
      </section>
    </>
  );
}
