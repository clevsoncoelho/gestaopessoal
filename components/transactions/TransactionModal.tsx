"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type FinanceContext, type Transaction, type TransactionKind } from "@/lib/finance";
import { Modal } from "@/components/ui/Modal";

type CategoryRow = { id: string; name: string; icon: string | null; context: FinanceContext };
const DEFAULT_CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Serviços",
  "Lazer",
  "Casa",
  "Saúde",
  "Educação",
  "Transferência",
  "Outros",
];

interface TransactionModalProps {
  onClose: () => void;
  onSaved: (item: Transaction) => void;
  onError: (msg: string) => void;
  userId: string | null;
  context: FinanceContext;
  initialData?: Transaction | null;
}

export function TransactionModal({
  onClose,
  onSaved,
  onError,
  userId,
  context,
  initialData,
}: TransactionModalProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [amount, setAmount] = useState(
    initialData ? String(initialData.amount) : ""
  );
  const [kind, setKind] = useState<TransactionKind>(
    initialData?.kind ?? "expense"
  );
  const [category, setCategory] = useState(
    initialData?.category ?? "Alimentação"
  );
  const [date, setDate] = useState(
    initialData?.date ?? new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");
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
          if (!initialData) {
            setCategory((data[0] as CategoryRow).name);
          }
        }
      });
  }, [userId, initialData]);

  const categoryOptions =
    dbCategories.length > 0
      ? dbCategories.map((c) => c.name)
      : DEFAULT_CATEGORIES;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!userId) {
      onError("Sua sessão expirou. Entre novamente.");
      return;
    }
    const value = Number(amount.replace(",", "."));
    if (!title.trim() || !Number.isFinite(value) || value <= 0 || !notes.trim()) {
      onError("Preencha todos os campos e descreva o motivo da transação.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const dbCat = dbCategories.find((c) => c.name === category);

      if (initialData) {
        // Modo Edição
        const { error } = await supabase
          .from("transactions")
          .update({
            category_id: dbCat?.id ?? null,
            description: title.trim(),
            amount: value,
            kind,
            context,
            notes: notes.trim(),
            occurred_on: date,
          })
          .eq("id", initialData.id)
          .eq("user_id", userId);

        if (error) throw error;

        onSaved({
          ...initialData,
          title: title.trim(),
          category,
          date,
          amount: value,
          kind,
          context,
          icon: dbCat?.icon ?? (kind === "income" ? "↑" : kind === "transfer" ? "⇄" : "•"),
          notes: notes.trim(),
        });
      } else {
        // Modo Criação
        const { data, error } = await supabase
          .from("transactions")
          .insert({
            user_id: userId,
            category_id: dbCat?.id ?? null,
            description: title.trim(),
            amount: value,
            kind,
            context,
            notes: notes.trim(),
            occurred_on: date,
          })
          .select("id")
          .single();

        if (error) throw error;

        const item: Transaction = {
          id: data?.id ?? crypto.randomUUID(),
          title: title.trim(),
          category,
          date,
          amount: value,
          kind,
          context,
          icon: dbCat?.icon ?? (kind === "income" ? "↑" : kind === "transfer" ? "⇄" : "•"),
          notes: notes.trim(),
        };
        onSaved(item);
      }
    } catch (err) {
      onError(
        err instanceof Error
          ? `Não foi possível salvar: ${err.message}`
          : "Não foi possível salvar."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={initialData ? "Editar movimentação" : "Nova transação"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-3.5">
        <div>
          <label className="mb-1 block text-xs text-slate-400">Descrição</label>
          <input
            autoFocus
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Mercado, Salário, Aluguel"
            className="field"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Valor (R$)</label>
            <input
              required
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="field"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Tipo</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as TransactionKind)}
              className="field"
            >
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
              <option value="transfer">Transferência</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="field"
            >
              {categoryOptions.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Data</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="field text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400">
            Justificativa / Motivo da transação
            <textarea
              required
              minLength={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Compra semanal de alimentos para a família"
              className="field mt-1.5 min-h-20 resize-y"
            />
          </label>
        </div>

        <button disabled={busy} className="btn-primary w-full disabled:opacity-50">
          {busy
            ? "Gravando..."
            : initialData
            ? "Atualizar transação"
            : "Salvar transação"}
        </button>
      </form>
    </Modal>
  );
}
