"use client";

import { useState } from "react";
import { type Goal, calculateGoalProgress, requiredMonthlyContribution } from "@/lib/finance";
import { Empty } from "@/components/ui/Empty";
import { GoalSkeleton } from "@/components/ui/Skeleton";
import { ContributionModal } from "./ContributionModal";
import { createClient } from "@/lib/supabase/client";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface GoalsViewProps {
  goals: Goal[];
  loading: boolean;
  userId: string | null;
  onAdd: () => void;
  onEdit: (goal: Goal) => void;
  onGoalUpdated: (id: string, newAmount: number) => void;
  onGoalDeleted: (id: string) => void;
  onError: (msg: string) => void;
}

export function GoalsView({
  goals,
  loading,
  userId,
  onAdd,
  onEdit,
  onGoalUpdated,
  onGoalDeleted,
  onError,
}: GoalsViewProps) {
  const [contributingGoal, setContributingGoal] = useState<Goal | null>(null);

  async function handleDeleteGoal(goal: Goal) {
    if (!userId) return;
    if (!window.confirm(`Tem certeza que deseja excluir a meta "${goal.title}"?`)) {
      return;
    }
    try {
      const { error } = await createClient()
        .from("goals")
        .delete()
        .eq("id", goal.id)
        .eq("user_id", userId);
      if (error) throw error;
      onGoalDeleted(goal.id);
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "Não foi possível excluir a meta."
      );
    }
  }

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">motor de metas</p>
          <h2 className="mt-1 text-xl font-semibold text-white">O que você quer realizar?</h2>
        </div>
        <button onClick={onAdd} className="btn-primary rounded-2xl px-4 py-3 text-sm">
          + Nova Meta
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {loading ? (
          <GoalSkeleton />
        ) : goals.length ? (
          goals.map((goal) => {
            const progress = calculateGoalProgress(goal);
            const monthlyNeeded =
              goal.monthlyContribution ||
              requiredMonthlyContribution(goal.current, goal.target, goal.targetDate);
            const isCompleted = progress >= 100;

            return (
              <div key={goal.id} className="glass rounded-[26px] p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/06 text-xl text-indigo-300">
                      {goal.emoji}
                    </span>
                    <div>
                      <h3 className="font-semibold text-white">{goal.title}</h3>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {goal.targetDate
                          ? `Prazo: ${new Date(`${goal.targetDate}T12:00:00`).toLocaleDateString("pt-BR")}`
                          : "Sem prazo estipulado"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${
                        isCompleted ? "text-emerald-400" : "text-indigo-400"
                      }`}
                    >
                      {progress.toFixed(0)}%
                    </span>
                    <button
                      onClick={() => onEdit(goal)}
                      title="Editar meta"
                      className="rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal)}
                      title="Excluir meta"
                      className="rounded-lg p-1 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/08">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isCompleted
                        ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                        : "bg-gradient-to-r from-emerald-500 to-indigo-500"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-3 flex justify-between text-xs">
                  <span className="font-medium text-slate-200">
                    {currency.format(goal.current)} guardados
                  </span>
                  <span className="text-slate-400">
                    alvo: {currency.format(goal.target)}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/06 pt-3">
                  <p className="flex-1 rounded-xl bg-indigo-500/10 px-3 py-2 text-xs text-indigo-300">
                    Aporte recomendado: <strong>{currency.format(monthlyNeeded)}/mês</strong>
                  </p>
                  <button
                    onClick={() => setContributingGoal(goal)}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20 shadow-sm"
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
            text="Defina metas para sua reserva de emergência, viagens ou aquisições futuras."
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
