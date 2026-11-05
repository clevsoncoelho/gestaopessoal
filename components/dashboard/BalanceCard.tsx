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
  return (
    <section className="relative mt-5 overflow-hidden rounded-[28px] p-6 glass">
      {/* Subtle gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[28px] opacity-30"
        style={{
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.10) 50%, transparent 100%)",
        }}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
            Saldo disponível
          </p>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-[42px] font-bold leading-none tracking-tight">
              {hideBalance ? "••••••" : currency.format(balance)}
            </p>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              aria-label={hideBalance ? "Mostrar saldo" : "Ocultar saldo"}
              className="text-slate-500 transition hover:text-slate-300"
            >
              <Icon name={hideBalance ? "eye-off" : "eye"} size={18} />
            </button>
          </div>
        </div>
        <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
          Fluxo real
        </span>
      </div>

      <div className="relative mt-7 flex items-center gap-6">
        <Donut totals={totals} />
        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
            <span className="text-xs text-slate-400">Entradas</span>
            <strong className="ml-2 text-white">{currency.format(totals.income)}</strong>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/20" />
            <span className="text-xs text-slate-400">Saídas</span>
            <strong className="ml-2 text-white">{currency.format(totals.expense)}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
