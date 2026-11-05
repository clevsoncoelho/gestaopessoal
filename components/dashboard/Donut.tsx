"use client";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface DonutProps {
  totals: { income: number; expense: number };
}

export function Donut({ totals }: DonutProps) {
  const total = totals.income + totals.expense;
  const incomeShare = total > 0 ? totals.income / total : 0;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const incomeLength = circumference * incomeShare;
  const expenseLength = circumference - incomeLength;
  const result = totals.income - totals.expense;

  return (
    <div className="relative grid h-44 w-44 shrink-0 place-items-center">
      <svg
        viewBox="0 0 140 140"
        className="-rotate-90"
        aria-label="Distribuição entre entradas e saídas"
      >
        {/* Track */}
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="13" />
        {total > 0 && (
          <>
            {/* Income arc – emerald */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#10b981"
              strokeWidth="13"
              strokeLinecap="round"
              strokeDasharray={`${incomeLength} ${circumference}`}
            />
            {/* Expense arc – rose */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="13"
              strokeLinecap="round"
              strokeDasharray={`${expenseLength} ${circumference}`}
              strokeDashoffset={-incomeLength}
            />
          </>
        )}
        {/* Inner circle */}
        <circle cx="70" cy="70" r="44" fill="rgba(15,15,30,0.95)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <span className="eyebrow !text-[9px]">resultado</span>
        <strong
          className={`mt-1 max-w-[116px] truncate text-sm font-bold ${
            result >= 0 ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {currency.format(result)}
        </strong>
        <span className="mt-1 text-[10px] text-slate-600">
          {total > 0 ? "este período" : "sem dados"}
        </span>
      </div>
    </div>
  );
}
