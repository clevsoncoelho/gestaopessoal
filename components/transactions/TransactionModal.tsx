"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type FinanceContext, type Transaction } from "@/lib/finance";
import { Modal } from "@/components/ui/Modal";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type CategoryRow = { id: string; name: string; icon: string | null; context: FinanceContext };
const DEFAULT_CATEGORIES = ["Alimentação", "Transporte", "Serviços", "Lazer", "Casa", "Saúde", "Educação", "Outros"];

interface TransactionModalProps {
  onClose: () => void;
  onSaved: (item: Transaction) => void;
  onError: (msg: string) => void;
  userId: string | null;
  context: FinanceContext;
}

export function TransactionModal({ onClose, onSaved, onError, userId, context }: TransactionModalProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState("Alimentação");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [dbCategories, setDbCategories] = useState<CategoryRow[]>([]);

  useEffect(() => {
    if (!userId) return;
    createClient()
      .from("categories")
      .select("id, name, icon, context")
      .eq("user_id", userId)
      .order("name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setDbCategories(data as CategoryRow[]);
          setCategory((data[0] as CategoryRow).name);
        }
      });
  }, [userId]);

  const categoryOptions =
    dbCategories.length > 0
      ? dbCategories.map((c) => c.name)
      : DEFAULT_CATEGORIES;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!userId) { onError("Sua sessão expirou. Entre novamente."); return; }
    const value = Number(amount.replace(",", "."));
    if (!title.trim() || !Number.isFinite(value) || value <= 0 || !notes.trim()) {
      onError("Preencha todos os campos e descreva o motivo da transação.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const dbCat = dbCategories.find((c) => c.name === category);
      const { error } = await supabase.from("transactions").insert({
        user_id: userId,
        category_id: dbCat?.id ?? null,
        description: title.trim(),
        amount: value,
        kind,
        context,
        notes: notes.trim(),
        occurred_on: new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;

      const item: Transaction = {
        id: crypto.randomUUID(),
        title: title.trim(),
        category,
        date: new Date().toISOString().slice(0, 10),
        amount: value,
        kind,
        context,
        icon: dbCat?.icon ?? (kind === "income" ? "↑" : "•"),
        notes: notes.trim(),
      };
      onSaved(item);
    } catch (err) {
      onError(err instanceof Error ? `Não foi possível salvar: ${err.message}` : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Nova transação" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <input
          autoFocus
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Mercado, cliente, aluguel"
          className="field"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            required
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Valor (R$)"
            className="field"
          />
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as "expense" | "income")}
            className="field"
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="field"
        >
          {categoryOptions.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <label className="block text-xs text-slate-500">
          Por que essa transação aconteceu?
          <textarea
            required
            minLength={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex.: compra do mercado da semana"
            className="field mt-2 min-h-20 resize-y"
          />
        </label>
        <button disabled={busy} className="btn-primary w-full">
          {busy ? "Salvando..." : "Salvar transação"}
        </button>
      </form>
    </Modal>
  );
}
