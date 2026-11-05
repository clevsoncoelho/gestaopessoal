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
  onEdit: (item: Transaction) => void;
  onAdd: () => void;
  period: "month" | "3months" | "all";
  setPeriod: (p: "month" | "3months" | "all") => void;
}

export function TransactionsView({
  items,
  loading,
  onDelete,
  onEdit,
  onAdd,
  period,
  setPeriod,
}: TransactionsViewProps) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | "income" | "expense" | "transfer">("all");

  const filtered = items.filter((item) => {
    const matchesQuery = `${item.title} ${item.category} ${item.notes ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesKind = kind === "all" || item.kind === kind;
    return matchesQuery && matchesKind;
  });

  function exportCSV() {
    if (!filtered.length) return;
    const headers = ["Data", "Descrição", "Categoria", "Tipo", "Valor", "Justificativa", "Contexto"];
    const rows = filtered.map((t) => [
      t.date,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.category.replace(/"/g, '""')}"`,
      t.kind,
      t.amount.toFixed(2),
      `"${(t.notes || "").replace(/"/g, '""')}"`,
      t.context,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `extrato-pulse-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <section className="mt-6">
      {/* Search and add */}
      <div className="flex gap-3">
        <div className="relative min-w-0 flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por descrição, categoria ou nota..."
            className="field pl-10"
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            <Icon name="filter" size={16} />
          </span>
        </div>
        <button
          onClick={exportCSV}
          title="Exportar para CSV"
          className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/05 px-3.5 text-slate-300 transition hover:bg-white/10"
        >
          <Icon name="chart" size={16} />
        </button>
        <button
          onClick={onAdd}
          className="btn-primary rounded-2xl px-4 text-sm"
        >
          <Icon name="plus" size={16} />
        </button>
      </div>

      {/* Filters */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
          className="field text-xs"
        >
          <option value="all">Todos os tipos</option>
          <option value="income">Receitas (+)</option>
          <option value="expense">Despesas (-)</option>
          <option value="transfer">Transferências (⇄)</option>
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
        <div className="hidden items-center justify-center rounded-2xl border border-white/08 px-3 text-xs text-slate-400 sm:flex">
          {filtered.length} movimentação(ões)
        </div>
      </div>

      {/* Transactions list */}
      <div className="mt-5 space-y-3">
        {loading ? (
          <TransactionSkeleton />
        ) : filtered.length ? (
          filtered.map((item) => (
            <SwipeRow
              key={item.id}
              item={item}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))
        ) : (
          <Empty
            title="Nenhuma movimentação encontrada"
            text="Ajuste os filtros de busca ou cadastre uma nova transação."
          />
        )}
      </div>
    </section>
  );
}
