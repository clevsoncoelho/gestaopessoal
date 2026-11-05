"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type FinanceContext } from "@/lib/finance";
import { Modal } from "@/components/ui/Modal";

interface BudgetModalProps {
  userId: string | null;
  context: FinanceContext;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}

export function BudgetModal({ userId, context, onClose, onSaved, onError }: BudgetModalProps) {
  const [categoryName, setCategoryName] = useState("");
  const [limit, setLimit] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!userId) { onError("Sua sessão expirou."); return; }
    const value = Number(limit.replace(",", "."));
    if (!categoryName.trim() || !Number.isFinite(value) || value <= 0) return;
    setBusy(true);
    try {
      const supabase = createClient();
      // Upsert the category first
      const { data: catData, error: catError } = await supabase
        .from("categories")
        .upsert({ user_id: userId, name: categoryName.trim(), context }, { onConflict: "user_id,name,context" })
        .select("id")
        .single();
      if (catError) throw catError;

      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .slice(0, 10);

      const { error } = await supabase.from("budgets").insert({
        user_id: userId,
        category_id: catData.id,
        limit_amount: value,
        month_start: monthStart,
        context,
      });
      if (error) throw error;
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Não foi possível criar o orçamento.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Novo orçamento" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <input
          autoFocus
          required
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          placeholder="Categoria (ex.: Alimentação)"
          className="field"
        />
        <input
          required
          inputMode="decimal"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          placeholder="Limite mensal (R$)"
          className="field"
        />
        <button disabled={busy} className="btn-primary w-full">
          {busy ? "Criando..." : "Criar orçamento"}
        </button>
      </form>
    </Modal>
  );
}
