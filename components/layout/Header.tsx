"use client";

import { motion } from "framer-motion";
import { type FinanceContext } from "@/lib/finance";
import { Icon } from "@/components/ui/Icon";

const TABS = ["Início", "Transações", "Análise", "Metas"] as const;

interface HeaderProps {
  mode: FinanceContext;
  setMode: (m: FinanceContext) => void;
  tab: string;
  setTab: (t: string) => void;
  userName: string;
}

export function Header({ mode, setMode, tab, setTab, userName }: HeaderProps) {
  return (
    <>
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-[0_8px_24px_rgba(99,102,241,0.35)]">
            <Icon name="pulse" size={24} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="eyebrow">olá, {userName}</p>
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
            </div>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-white">
              {tab === "Início" ? "Seu pulso financeiro" : tab}
            </h1>
          </div>
        </div>

        <button
          aria-label="Ir para Perfil"
          onClick={() => setTab("Perfil")}
          className="relative grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/05 text-sm font-bold text-white transition hover:border-indigo-500/40 hover:bg-white/10"
        >
          {userName.slice(0, 2).toUpperCase()}
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#030712] bg-emerald-400" />
        </button>
      </header>

      {/* Mode toggle */}
      <div className="mt-6 flex rounded-2xl border border-white/08 bg-black/30 p-1 backdrop-blur-xl">
        {(["personal", "professional"] as FinanceContext[]).map((item) => (
          <button
            key={item}
            onClick={() => setMode(item)}
            className={`relative flex-1 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
              mode === item ? "text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {mode === item && (
              <motion.span
                layoutId="mode-pill"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_4px_20px_rgba(99,102,241,0.35)]"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            <span className="relative flex items-center justify-center gap-2">
              <Icon name={item === "personal" ? "user" : "briefcase"} size={14} />
              {item === "personal" ? "Pessoal" : "Profissional"}
            </span>
          </button>
        ))}
      </div>

      {/* Tab pills */}
      <div className="hide-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((item) => {
          const isActive = tab === item;
          return (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${
                isActive
                  ? "border border-indigo-500/40 bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-white shadow-[0_0_16px_rgba(99,102,241,0.2)]"
                  : "border border-white/06 text-slate-400 hover:border-white/15 hover:text-slate-200"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    </>
  );
}
