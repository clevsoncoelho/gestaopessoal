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
}

export function GoalModal({ onClose, onSaved, onError, userId, context }: GoalModalProps) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!userId) { onError("Sua sessão expirou. Entre novamente."); return; }
    const value = Number(target.replace(",", "."));
    if (!title.trim() || !Number.isFinite(value) || value <= 0) return;
    setBusy(true);
    try {
      const monthlyContrib = requiredMonthlyContribution(0, value, date || undefined);
      const { error } = await createClient().from("goals").insert({
        user_id: userId,
        title: title.trim(),
        target_amount: value,
        target_date: date || null,
        monthly_contribution: monthlyContrib,
        context,
      });
      if (error) throw error;
      onSaved({
        id: crypto.randomUUID(),
        title: title.trim(),
        emoji: "◇",
        current: 0,
        target: value,
        targetDate: date || undefined,
        monthlyContribution: monthlyContrib,
        context,
      });
    } catch (err) {
      onError(err instanceof Error ? err.message : "Não foi possível criar a meta.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Nova meta" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <input
          autoFocus
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Reserva, viagem, carro"
          className="field"
        />
        <input
          required
          inputMode="decimal"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Valor alvo (R$)"
          className="field"
        />
        <label className="block text-xs text-slate-500">
          Prazo (opcional)
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="field mt-2"
          />
        </label>
        <button disabled={busy} className="btn-primary w-full">
          {busy ? "Criando..." : "Criar meta"}
        </button>
      </form>
    </Modal>
  );
}
