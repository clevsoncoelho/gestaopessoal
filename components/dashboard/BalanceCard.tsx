"use client";

import { Icon } from "@/components/ui/Icon";
import { Donut } from "./Donut";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface BalanceCardProps {
  balance: number;
  hideBalance: boolean;
  setHideBalance: (v: boolean) => void;
  totals: { income: number; expense: number };
}

export function BalanceCard({ balance, hideBalance, setHideBalance, totals }: BalanceCardProps) {
  // Separa o valor formatado para renderizar R$, inteiros e centavos com hierarquia tipográfica
  const formattedParts = (() => {
    if (hideBalance) {
      return { symbol: "R$", integer: "••••••", cents: "" };
    }
    const absVal = Math.abs(balance);
    const parts = absVal.toFixed(2).split(".");
    const intFormatted = Number(parts[0]).toLocaleString("pt-BR");
    const sign = balance < 0 ? "-" : "";
    return {
      symbol: `${sign}R$`,
      integer: intFormatted,
      cents: `,${parts[1]}`,
    };
  })();

  const isPositive = balance >= 0;

  return (
    <section className="relative mt-5 overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-transparent p-6 sm:p-8 backdrop-blur-2xl shadow-[0_24px_50px_-12px_rgba(0,0,0,0.7)]">
      {/* Luz ambiente de fundo */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #6366f1 0%, #8b5cf6 100%)" }}
      />
      <div
        className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, #10b981 0%, transparent 70%)" }}
      />

      {/* Top Header */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Saldo Disponível
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHideBalance(!hideBalance)}
            aria-label={hideBalance ? "Mostrar saldo" : "Ocultar saldo"}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/05 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <Icon name={hideBalance ? "eye-off" : "eye"} size={16} />
          </button>
          <span className="rounded-full border border-indigo-500/30 bg-indigo-500/15 px-3 py-1 text-[11px] font-semibold text-indigo-300">
            Tempo Real
          </span>
        </div>
      </div>

      {/* Big Balance Number */}
      <div className="relative mt-4 flex items-baseline gap-1.5">
        <span className="text-xl font-medium text-slate-400">
          {formattedParts.symbol}
        </span>
        <span
          className={`text-4xl sm:text-5xl font-black tracking-tight ${
            isPositive ? "text-white" : "text-rose-400"
          }`}
        >
          {formattedParts.integer}
        </span>
        {formattedParts.cents && (
          <span className="text-2xl font-bold text-slate-400">
            {formattedParts.cents}
          </span>
        )}
      </div>

      {/* Flow metrics & Donut */}
      <div className="relative mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-white/08 pt-6">
        <div className="grid grid-cols-2 gap-3 flex-1">
          {/* Income mini-card */}
          <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/05 p-3.5 transition hover:border-emerald-500/30">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-500/20 text-[10px] font-bold">
                ↑
              </span>
              <span>Entradas</span>
            </div>
            <p className="mt-2 text-base sm:text-lg font-bold text-white">
              {currency.format(totals.income)}
            </p>
          </div>

          {/* Expense mini-card */}
          <div className="rounded-2xl border border-rose-500/15 bg-rose-500/05 p-3.5 transition hover:border-rose-500/30">
            <div className="flex items-center gap-2 text-xs font-medium text-rose-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-rose-500/20 text-[10px] font-bold">
                ↓
              </span>
              <span>Saídas</span>
            </div>
            <p className="mt-2 text-base sm:text-lg font-bold text-white">
              {currency.format(totals.expense)}
            </p>
          </div>
        </div>

        {/* Donut chart */}
        <div className="flex justify-center sm:justify-end">
          <Donut totals={totals} />
        </div>
      </div>
    </section>
  );
}
