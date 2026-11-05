"use client";

import { useState } from "react";
import { type Transaction } from "@/lib/finance";
import { SwipeRow } from "./SwipeRow";
import { Empty } from "@/components/ui/Empty";
import { Icon } from "@/components/ui/Icon";
import { TransactionSkeleton } from "@/components/ui/Skeleton";

interface TransactionsViewProps {
  items: Transaction[];
  loading: boolean;
  onDelete: (id: string) => void;
  onAdd: () => void;
  period: "month" | "3months" | "all";
  setPeriod: (p: "month" | "3months" | "all") => void;
}

export function TransactionsView({
  items,
  loading,
  onDelete,
  onAdd,
  period,
  setPeriod,
}: TransactionsViewProps) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | "income" | "expense">("all");

  const filtered = items.filter((item) => {
    const matchesQuery = `${item.title} ${item.category}`.toLowerCase().includes(query.toLowerCase());
    const matchesKind = kind === "all" || item.kind === kind;
    return matchesQuery && matchesKind;
  });

  return (
    <section className="mt-6">
      <div className="flex gap-3">
        <div className="relative min-w-0 flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar movimentações"
            className="field pl-10"
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            <Icon name="filter" size={16} />
          </span>
        </div>
        <button
          onClick={onAdd}
          className="btn-primary rounded-2xl px-4 text-sm"
        >
          <Icon name="plus" size={16} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
          className="field text-xs"
        >
          <option value="all">Todos os tipos</option>
          <option value="income">Receitas</option>
          <option value="expense">Despesas</option>
        </select>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as typeof period)}
          className="field text-xs"
        >
          <option value="month">Este mês</option>
          <option value="3months">Últimos 3 meses</option>
          <option value="all">Todo o período</option>
        </select>
        <div className="hidden items-center justify-center rounded-2xl border border-white/08 px-3 text-xs text-slate-500 sm:flex">
          {filtered.length} resultado(s)
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          <TransactionSkeleton />
        ) : filtered.length ? (
          filtered.map((item) => (
            <SwipeRow key={item.id} item={item} onDelete={onDelete} />
          ))
        ) : (
          <Empty
            title="Nenhuma transação encontrada"
            text="Ajuste os filtros ou adicione uma movimentação."
          />
        )}
      </div>
    </section>
  );
}
