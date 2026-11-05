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
    <nav className="fixed bottom-3 left-3 right-3 z-20 nav-glass rounded-3xl px-3 pb-[calc(9px+env(safe-area-inset-bottom))] pt-3">
      <div className="mx-auto flex max-w-xl items-end justify-between">
        {NAV_ITEMS.slice(0, 2).map((item) => (
          <NavButton
            key={item.tab}
            label={item.label}
            icon={item.icon}
            active={tab === item.tab}
            onClick={() => setTab(item.tab)}
          />
        ))}

        {/* Central add button */}
        <button
          onClick={onAdd}
          aria-label="Nova transação"
          className="-mt-9 grid h-16 w-16 place-items-center rounded-[22px] border-4 border-[#030712] bg-gradient-to-br from-indigo-500 to-violet-500 text-3xl text-white shadow-[0_10px_40px_rgba(99,102,241,0.4)] transition hover:shadow-[0_10px_50px_rgba(99,102,241,0.6)]"
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
      className={`flex w-16 flex-col items-center gap-1 text-[10px] font-medium transition ${
        active ? "text-indigo-400" : "text-slate-500"
      }`}
    >
      <span
        className={`grid h-8 w-8 place-items-center rounded-xl transition ${
          active ? "bg-indigo-500/15" : ""
        }`}
      >
        <Icon name={icon} size={18} />
      </span>
      {label}
    </button>
  );
}
