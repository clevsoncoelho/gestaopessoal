"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { type Transaction } from "@/lib/finance";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface SwipeRowProps {
  item: Transaction;
  onDelete: (id: string) => void;
  onEdit?: (item: Transaction) => void;
}

function getCategoryTheme(category: string, kind: string, defaultIcon?: string) {
  const cat = category.toLowerCase();
  if (kind === "income") {
    return {
      bg: "bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400",
      icon: "↑",
    };
  }
  if (kind === "transfer") {
    return {
      bg: "bg-gradient-to-br from-indigo-500/20 to-violet-500/10 border-indigo-500/30 text-indigo-300",
      icon: "⇄",
    };
  }
  if (cat.includes("aliment") || cat.includes("merc") || cat.includes("rest") || cat.includes("ifood")) {
    return {
      bg: "bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400",
      icon: "🛒",
    };
  }
  if (cat.includes("transp") || cat.includes("uber") || cat.includes("combust") || cat.includes("posto")) {
    return {
      bg: "bg-gradient-to-br from-sky-500/20 to-blue-500/10 border-sky-500/30 text-sky-400",
      icon: "🚗",
    };
  }
  if (cat.includes("casa") || cat.includes("moradia") || cat.includes("luz") || cat.includes("aluguel")) {
    return {
      bg: "bg-gradient-to-br from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400",
      icon: "⌂",
    };
  }
  if (cat.includes("lazer") || cat.includes("viag") || cat.includes("cinema") || cat.includes("netflix")) {
    return {
      bg: "bg-gradient-to-br from-pink-500/20 to-rose-500/10 border-pink-500/30 text-pink-400",
      icon: "♫",
    };
  }
  if (cat.includes("saude") || cat.includes("farm") || cat.includes("medic")) {
    return {
      bg: "bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border-teal-500/30 text-teal-400",
      icon: "✦",
    };
  }
  return {
    bg: "bg-gradient-to-br from-slate-500/15 to-slate-600/05 border-white/10 text-slate-300",
    icon: defaultIcon || "•",
  };
}

export function SwipeRow({ item, onDelete, onEdit }: SwipeRowProps) {
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
      <div className="glass flex items-center justify-between rounded-2xl p-4 opacity-60 border-rose-500/20">
        <p className="text-sm text-slate-400 line-through">{item.title}</p>
        <button
          onClick={handleUndo}
          className="rounded-full border border-indigo-500/40 bg-indigo-500/15 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/25"
        >
          Desfazer exclusão
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

  const isIncome = item.kind === "income";
  const isTransfer = item.kind === "transfer";
  const theme = getCategoryTheme(item.category, item.kind, item.icon);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="swipe-row-delete">Excluir</div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -96, right: 0 }}
        onDragEnd={handleDragEnd}
        onClick={() => onEdit?.(item)}
        className="glass-card-interactive relative flex cursor-pointer items-center gap-3.5 rounded-2xl p-3.5 sm:p-4"
      >
        {/* Category icon with themed gradient */}
        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border text-xl shadow-inner ${theme.bg}`}
        >
          {theme.icon}
        </div>

        {/* Description & metadata */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-white tracking-tight">
              {item.title}
            </p>
            {isTransfer && (
              <span className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-300">
                Transf.
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
            <span className="font-medium text-slate-300">{item.category}</span>
            <span>·</span>
            <span>{formattedDate}</span>
          </div>
          {item.notes && (
            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              {item.notes}
            </p>
          )}
        </div>

        {/* Amount */}
        <div className="text-right">
          <p
            className={`text-sm sm:text-base font-extrabold tracking-tight ${
              isIncome
                ? "text-emerald-400"
                : isTransfer
                ? "text-indigo-400"
                : "text-white"
            }`}
          >
            {isIncome ? "+" : isTransfer ? "⇄ " : "-"}
            {currency.format(item.amount)}
          </p>
          <span className="block text-[10px] text-slate-500 opacity-60">toque p/ editar</span>
        </div>
      </motion.div>
    </div>
  );
}
