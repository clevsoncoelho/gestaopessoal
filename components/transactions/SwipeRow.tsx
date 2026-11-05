"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { type Transaction } from "@/lib/finance";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface SwipeRowProps {
  item: Transaction;
  onDelete: (id: string) => void;
}

export function SwipeRow({ item, onDelete }: SwipeRowProps) {
  const [pendingDelete, setPendingDelete] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -70) {
      setPendingDelete(true);
      timerRef.current = setTimeout(() => {
        onDelete(item.id);
      }, 5000);
    }
  }

  function handleUndo() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPendingDelete(false);
  }

  if (pendingDelete) {
    return (
      <div className="glass flex items-center justify-between rounded-2xl p-3 opacity-50">
        <p className="text-sm text-slate-400 line-through">{item.title}</p>
        <button
          onClick={handleUndo}
          className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 transition hover:bg-indigo-500/20"
        >
          Desfazer
        </button>
      </div>
    );
  }

  const formattedDate = (() => {
    try {
      return new Date(`${item.date}T12:00:00`).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      });
    } catch {
      return item.date;
    }
  })();

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="swipe-row-delete">Excluir</div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -96, right: 0 }}
        onDragEnd={handleDragEnd}
        className="glass relative flex items-center gap-3 rounded-2xl p-3"
      >
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/06 text-lg">
          {item.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.title}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {item.category} · {formattedDate}
          </p>
          {item.notes && (
            <p className="mt-0.5 truncate text-xs text-slate-600">
              {item.notes}
            </p>
          )}
        </div>
        <p
          className={`shrink-0 text-sm font-semibold ${
            item.kind === "income" ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {item.kind === "income" ? "+" : "-"}
          {currency.format(item.amount)}
        </p>
      </motion.div>
    </div>
  );
}
