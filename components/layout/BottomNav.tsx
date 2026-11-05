"use client";

import { Icon, type IconName } from "@/components/ui/Icon";

type NavTab = "Início" | "Transações" | "Análise" | "Metas" | "Perfil";
interface NavItem {
  label: string;
  icon: IconName;
  tab: NavTab;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Início", icon: "home", tab: "Início" },
  { label: "Movimentos", icon: "list", tab: "Transações" },
  { label: "Análise", icon: "chart", tab: "Análise" },
  { label: "Perfil", icon: "settings", tab: "Perfil" },
];

interface BottomNavProps {
  tab: string;
  setTab: (t: string) => void;
  onAdd: () => void;
}

export function BottomNav({ tab, setTab, onAdd }: BottomNavProps) {
  return (
    <div className="fixed bottom-4 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto nav-glass w-full max-w-md sm:max-w-lg rounded-full px-4 sm:px-6 py-2 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] border border-white/12">
        <div className="flex items-center justify-between">
          {NAV_ITEMS.slice(0, 2).map((item) => (
            <NavButton
              key={item.tab}
              label={item.label}
              icon={item.icon}
              active={tab === item.tab}
              onClick={() => setTab(item.tab)}
            />
          ))}

          {/* Central Action Button com espaçamento equilibrado */}
          <div className="px-2 sm:px-3">
            <button
              onClick={onAdd}
              aria-label="Nova movimentação"
              className="grid h-13 w-13 sm:h-14 sm:w-14 place-items-center rounded-full border-2 border-white/20 bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-500 text-2xl font-light text-white shadow-[0_8px_28px_rgba(99,102,241,0.55)] transition-all hover:scale-105 hover:shadow-[0_12px_36px_rgba(99,102,241,0.7)] active:scale-95"
            >
              +
            </button>
          </div>

          {NAV_ITEMS.slice(2).map((item) => (
            <NavButton
              key={item.tab}
              label={item.label}
              icon={item.icon}
              active={tab === item.tab}
              onClick={() => setTab(item.tab)}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}

function NavButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: IconName;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1 py-1 px-2 rounded-2xl transition-all ${
        active ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
      }`}
    >
      <span
        className={`grid h-8 w-8 place-items-center rounded-xl transition-all ${
          active
            ? "bg-indigo-500/15 text-indigo-300 shadow-[0_0_14px_rgba(99,102,241,0.35)]"
            : "hover:bg-white/05"
        }`}
      >
        <Icon name={icon} size={19} />
      </span>
      <span className="text-[10px] font-semibold tracking-wide">{label}</span>
    </button>
  );
}
