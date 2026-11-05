"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface ContributionModalProps {
  goalId: string;
  goalTitle: string;
  currentAmount: number;
  targetAmount: number;
  userId: string | null;
  onClose: () => void;
  onSaved: (newAmount: number) => void;
  onError: (msg: string) => void;
}

export function ContributionModal({
  goalId,
  goalTitle,
  currentAmount,
  targetAmount,
  userId,
  onClose,
  onSaved,
  onError,
}: ContributionModalProps) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!userId) { onError("Sua sessão expirou."); return; }
    const value = Number(amount.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) return;
    setBusy(true);
    try {
      const supabase = createClient();
      // Insert into goal_contributions
      const { error: contribError } = await supabase.from("goal_contributions").insert({
        goal_id: goalId,
        user_id: userId,
        amount: value,
        contributed_on: new Date().toISOString().slice(0, 10),
      });
      if (contribError) throw contribError;
      // Update goal current_amount
      const newAmount = currentAmount + value;
      const { error: updateError } = await supabase
        .from("goals")
        .update({ current_amount: newAmount })
        .eq("id", goalId);
      if (updateError) throw updateError;
      onSaved(newAmount);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Não foi possível registrar o aporte.");
    } finally {
      setBusy(false);
    }
  }

  const remaining = Math.max(0, targetAmount - currentAmount);

  return (
    <Modal title={`Aportar em: ${goalTitle}`} onClose={onClose}>
      <div className="mb-4 flex items-center justify-between rounded-2xl bg-white/04 p-4">
        <div>
          <p className="text-xs text-slate-500">Saldo atual</p>
          <p className="text-lg font-bold text-emerald-400">{currency.format(currentAmount)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Faltam</p>
          <p className="text-lg font-bold text-slate-200">{currency.format(remaining)}</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <input
          autoFocus
          required
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Valor do aporte (R$)"
          className="field"
        />
        <button disabled={busy} className="btn-primary w-full">
          {busy ? "Registrando..." : "Registrar aporte"}
        </button>
      </form>
    </Modal>
  );
}
