"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type FinanceContext, type Goal, requiredMonthlyContribution } from "@/lib/finance";
import { Modal } from "@/components/ui/Modal";

interface GoalModalProps {
  onClose: () => void;
  onSaved: (item: Goal) => void;
  onError: (msg: string) => void;
  userId: string | null;
  context: FinanceContext;
  initialData?: Goal | null;
}

export function GoalModal({
  onClose,
  onSaved,
  onError,
  userId,
  context,
  initialData,
}: GoalModalProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [target, setTarget] = useState(
    initialData ? String(initialData.target) : ""
  );
  const [date, setDate] = useState(initialData?.targetDate ?? "");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!userId) {
      onError("Sua sessão expirou. Entre novamente.");
      return;
    }
    const value = Number(target.replace(",", "."));
    if (!title.trim() || !Number.isFinite(value) || value <= 0) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const current = initialData?.current ?? 0;
      const monthlyContrib = requiredMonthlyContribution(
        current,
        value,
        date || undefined
      );

      if (initialData) {
        // Atualizar
        const { error } = await supabase
          .from("goals")
          .update({
            title: title.trim(),
            target_amount: value,
            target_date: date || null,
            monthly_contribution: monthlyContrib,
          })
          .eq("id", initialData.id)
          .eq("user_id", userId);

        if (error) throw error;

        onSaved({
          ...initialData,
          title: title.trim(),
          target: value,
          targetDate: date || undefined,
          monthlyContribution: monthlyContrib,
        });
      } else {
        // Criar
        const { data, error } = await supabase
          .from("goals")
          .insert({
            user_id: userId,
            title: title.trim(),
            target_amount: value,
            target_date: date || null,
            monthly_contribution: monthlyContrib,
            context,
          })
          .select("id")
          .single();

        if (error) throw error;

        onSaved({
          id: data?.id ?? crypto.randomUUID(),
          title: title.trim(),
          emoji: "◇",
          current: 0,
          target: value,
          targetDate: date || undefined,
          monthlyContribution: monthlyContrib,
          context,
        });
      }
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "Não foi possível salvar a meta."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={initialData ? "Editar meta financeira" : "Nova meta financeira"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-3.5">
        <div>
          <label className="mb-1 block text-xs text-slate-400">Título do objetivo</label>
          <input
            autoFocus
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Reserva de Emergência, Viagem, Carro"
            className="field"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-400">Valor Alvo (R$)</label>
          <input
            required
            inputMode="decimal"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="0,00"
            className="field"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-400">
            Prazo para realização (opcional)
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="field text-sm"
          />
        </div>

        <button disabled={busy} className="btn-primary w-full disabled:opacity-50">
          {busy
            ? "Gravando..."
            : initialData
            ? "Atualizar meta"
            : "Criar meta"}
        </button>
      </form>
    </Modal>
  );
}
