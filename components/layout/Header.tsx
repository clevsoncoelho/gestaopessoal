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
        <div className="flex items-center gap-3">
          <div className="icon-box flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/80 to-violet-500/80 shadow-glow">
            <Icon name="pulse" size={22} className="text-white" />
          </div>
          <div>
            <p className="eyebrow">olá, {userName}</p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight">
              {tab === "Início" ? "Seu pulso financeiro" : tab}
            </h1>
          </div>
        </div>
        <button
          aria-label="Ir para Perfil"
          onClick={() => setTab("Perfil")}
          className="grid h-11 w-11 place-items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 text-sm font-bold text-indigo-400 transition hover:bg-indigo-500/20"
        >
          {userName.slice(0, 2).toUpperCase()}
        </button>
      </header>

      {/* Mode toggle */}
      <div className="mt-6 flex rounded-2xl border border-white/08 bg-black/20 p-1">
        {(["personal", "professional"] as FinanceContext[]).map((item) => (
          <button
            key={item}
            onClick={() => setMode(item)}
            className={`relative flex-1 rounded-xl py-2.5 text-sm font-medium transition ${
              mode === item ? "text-white" : "text-slate-500"
            }`}
          >
            {mode === item && (
              <motion.span
                layoutId="mode-pill"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/80 to-violet-500/80 shadow-glow"
              />
            )}
            <span className="relative flex items-center justify-center gap-2">
              <Icon name={item === "personal" ? "user" : "briefcase"} size={15} />
              {item === "personal" ? "Pessoal" : "Profissional"}
            </span>
          </button>
        ))}
      </div>

      {/* Tab pills */}
      <div className="hide-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition ${
              tab === item
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "border border-white/08 text-slate-500 hover:border-white/15 hover:text-slate-300"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </>
  );
}
