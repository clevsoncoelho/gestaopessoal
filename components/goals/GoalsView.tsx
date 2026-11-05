"use client";

import { useState } from "react";
import { type Goal, calculateGoalProgress, requiredMonthlyContribution } from "@/lib/finance";
import { Empty } from "@/components/ui/Empty";
import { GoalSkeleton } from "@/components/ui/Skeleton";
import { ContributionModal } from "./ContributionModal";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface GoalsViewProps {
  goals: Goal[];
  loading: boolean;
  userId: string | null;
  onAdd: () => void;
  onGoalUpdated: (id: string, newAmount: number) => void;
  onError: (msg: string) => void;
}

export function GoalsView({ goals, loading, userId, onAdd, onGoalUpdated, onError }: GoalsViewProps) {
  const [contributingGoal, setContributingGoal] = useState<Goal | null>(null);

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">motor de metas</p>
          <h2 className="mt-1 text-xl font-semibold">O que você quer realizar?</h2>
        </div>
        <button onClick={onAdd} className="btn-primary rounded-2xl px-4 py-3 text-sm">
          + Meta
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          <GoalSkeleton />
        ) : goals.length ? (
          goals.map((goal) => {
            const progress = calculateGoalProgress(goal);
            const monthlyNeeded = goal.monthlyContribution || requiredMonthlyContribution(goal.current, goal.target, goal.targetDate);
            return (
              <div key={goal.id} className="glass rounded-[26px] p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/06 text-xl">
                      {goal.emoji}
                    </span>
                    <div>
                      <h3 className="font-semibold">{goal.title}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {goal.targetDate
                          ? `até ${new Date(`${goal.targetDate}T12:00:00`).toLocaleDateString("pt-BR")}`
                          : "sem prazo definido"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      progress >= 100 ? "text-emerald-400" : "text-indigo-400"
                    }`}
                  >
                    {progress.toFixed(0)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/08">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-3 flex justify-between text-xs">
                  <span className="text-slate-300">{currency.format(goal.current)} guardados</span>
                  <span className="text-slate-500">de {currency.format(goal.target)}</span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="flex-1 rounded-xl bg-indigo-500/10 px-3 py-2 text-xs text-indigo-300">
                    Aporte sugerido: <strong>{currency.format(monthlyNeeded)}/mês</strong>
                  </p>
                  <button
                    onClick={() => setContributingGoal(goal)}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
                  >
                    + Aportar
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <Empty
            title="Nenhuma meta criada"
            text="Comece com um objetivo pequeno e consistente."
          />
        )}
      </div>

      {contributingGoal && (
        <ContributionModal
          goalId={contributingGoal.id}
          goalTitle={contributingGoal.title}
          currentAmount={contributingGoal.current}
          targetAmount={contributingGoal.target}
          userId={userId}
          onClose={() => setContributingGoal(null)}
          onSaved={(newAmount) => {
            onGoalUpdated(contributingGoal.id, newAmount);
            setContributingGoal(null);
          }}
          onError={onError}
        />
      )}
    </section>
  );
}
