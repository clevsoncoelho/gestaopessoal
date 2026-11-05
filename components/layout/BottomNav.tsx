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
    <nav className="fixed bottom-3.5 left-3.5 right-3.5 z-30 nav-glass rounded-[28px] px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-3">
      <div className="mx-auto flex max-w-lg items-end justify-between">
        {NAV_ITEMS.slice(0, 2).map((item) => (
          <NavButton
            key={item.tab}
            label={item.label}
            icon={item.icon}
            active={tab === item.tab}
            onClick={() => setTab(item.tab)}
          />
        ))}

        {/* Central Add Button */}
        <button
          onClick={onAdd}
          aria-label="Nova movimentação"
          className="-mt-8 grid h-15 w-15 place-items-center rounded-2xl border-2 border-white/20 bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-500 text-3xl font-light text-white shadow-[0_12px_32px_rgba(99,102,241,0.5)] transition hover:scale-105 hover:shadow-[0_16px_40px_rgba(99,102,241,0.7)] active:scale-95"
        >
          +
        </button>

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
      className={`flex w-16 flex-col items-center gap-1.5 text-[10px] font-semibold tracking-wide transition ${
        active ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
      }`}
    >
      <span
        className={`grid h-8 w-8 place-items-center rounded-xl transition ${
          active ? "bg-indigo-500/15 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.3)]" : ""
        }`}
      >
        <Icon name={icon} size={18} />
      </span>
      {label}
    </button>
  );
}
