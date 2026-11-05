"use client";

import { useState, useRef, type ChangeEvent, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { type FinanceContext } from "@/lib/finance";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface ExtractedItem {
  id: string;
  selected: boolean;
  date: string;
  description: string;
  amount: number;
  kind: "income" | "expense";
  category: string;
  notes: string;
}

interface PdfImportModalProps {
  userId: string | null;
  context: FinanceContext;
  onClose: () => void;
  onSuccess: (count: number) => void;
  onError: (msg: string) => void;
}

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

export function PdfImportModal({
  userId,
  context,
  onClose,
  onSuccess,
  onError,
}: PdfImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [step, setStep] = useState<"upload" | "review">("upload");
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  }

  async function handleExtract(e: FormEvent) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/extract/pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao processar o extrato.");
      }

      if (!data.transactions || data.transactions.length === 0) {
        throw new Error(
          "Nenhuma transação no formato esperado foi detectada. Verifique se o PDF contém texto de extrato bancário."
        );
      }

      setItems(
        data.transactions.map((t: Omit<ExtractedItem, "selected">) => ({
          ...t,
          selected: true,
        }))
      );
      setStep("review");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Falha na leitura do extrato.");
    } finally {
      setUploading(false);
    }
  }

  function toggleSelectAll(selectAll: boolean) {
    setItems((cur) => cur.map((item) => ({ ...item, selected: selectAll })));
  }

  function toggleItem(id: string) {
    setItems((cur) =>
      cur.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  }

  function updateItem(id: string, patch: Partial<ExtractedItem>) {
    setItems((cur) =>
      cur.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  async function handleSaveSelected() {
    if (!userId) {
      onError("Sua sessão expirou. Entre novamente.");
      return;
    }

    const selectedItems = items.filter((i) => i.selected);
    if (selectedItems.length === 0) {
      onError("Selecione pelo menos uma movimentação para importar.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();

      // Busca categorias cadastradas do usuário para mapear os IDs
      const { data: dbCategories } = await supabase
        .from("categories")
        .select("id, name")
        .eq("user_id", userId);

      const catMap = new Map((dbCategories || []).map((c) => [c.name, c.id]));

      const payload = selectedItems.map((item) => ({
        user_id: userId,
        category_id: catMap.get(item.category) ?? null,
        description: item.description.trim(),
        amount: Math.abs(item.amount),
        kind: item.kind,
        context,
        occurred_on: item.date,
        notes: item.notes.trim() || `Importado de extrato bancário em ${new Date().toLocaleDateString("pt-BR")}`,
      }));

      const { error } = await supabase.from("transactions").insert(payload);
      if (error) throw error;

      onSuccess(selectedItems.length);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Erro ao salvar transações.");
    } finally {
      setSaving(false);
    }
  }

  const selectedCount = items.filter((i) => i.selected).length;
  const totalIncome = items
    .filter((i) => i.selected && i.kind === "income")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = items
    .filter((i) => i.selected && i.kind === "expense")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <Modal
      title={step === "upload" ? "Importar extrato em PDF" : "Revisar movimentações do extrato"}
      onClose={onClose}
    >
      {step === "upload" ? (
        <form onSubmit={handleExtract} className="space-y-4">
          <div
            onClick={() => inputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-white/03 p-8 text-center transition hover:border-indigo-500/40 hover:bg-white/05"
          >
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-400">
              <Icon name="chart" size={26} />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-200">
              {file ? file.name : "Clique para selecionar o extrato bancário"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Extrato em PDF do Banco Inter, Nubank, Itaú, Bradesco, Santander ou C6
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/05 p-3 text-xs text-indigo-200">
            💡 <strong>Dica:</strong> O Pulse Finance lê os lançamentos, detecta datas, valores, descrições e sugere as categorias automaticamente para você revisar antes de salvar.
          </div>

          <button
            type="submit"
            disabled={!file || uploading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {uploading ? "Analisando extrato..." : "Processar Extrato PDF"}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Header metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/05 p-3 text-center">
              <p className="text-[11px] font-medium uppercase text-slate-400">Total Receitas</p>
              <p className="mt-1 text-base font-bold text-emerald-400">{currency.format(totalIncome)}</p>
            </div>
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/05 p-3 text-center">
              <p className="text-[11px] font-medium uppercase text-slate-400">Total Despesas</p>
              <p className="mt-1 text-base font-bold text-rose-400">{currency.format(totalExpense)}</p>
            </div>
          </div>

          {/* Select all bar */}
          <div className="flex items-center justify-between border-b border-white/08 pb-2 text-xs text-slate-400">
            <span>
              <strong>{selectedCount}</strong> de {items.length} itens selecionados
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => toggleSelectAll(true)}
                className="text-indigo-400 hover:text-indigo-300"
              >
                Marcar todos
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => toggleSelectAll(false)}
                className="text-slate-500 hover:text-slate-400"
              >
                Desmarcar todos
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border p-3 transition ${
                  item.selected
                    ? "border-white/10 bg-white/04"
                    : "border-white/04 bg-white/01 opacity-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => toggleItem(item.id)}
                    className="mt-1 h-4 w-4 rounded accent-indigo-500"
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        className="field !py-1 text-xs font-medium text-slate-200"
                      />
                      <span
                        className={`text-xs font-bold whitespace-nowrap ${
                          item.kind === "income" ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {item.kind === "income" ? "+" : "-"}
                        {currency.format(item.amount)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="date"
                        value={item.date}
                        onChange={(e) => updateItem(item.id, { date: e.target.value })}
                        className="field !py-1 text-[11px]"
                      />
                      <select
                        value={item.kind}
                        onChange={(e) =>
                          updateItem(item.id, { kind: e.target.value as "income" | "expense" })
                        }
                        className="field !py-1 text-[11px]"
                      >
                        <option value="expense">Despesa</option>
                        <option value="income">Receita</option>
                      </select>
                      <select
                        value={item.category}
                        onChange={(e) => updateItem(item.id, { category: e.target.value })}
                        className="field !py-1 text-[11px]"
                      >
                        {DEFAULT_CATEGORIES.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep("upload")}
              className="flex-1 rounded-2xl border border-white/10 bg-white/05 py-3 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
            >
              Voltar
            </button>
            <button
              type="button"
              disabled={selectedCount === 0 || saving}
              onClick={handleSaveSelected}
              className="btn-primary flex-[2] disabled:opacity-50"
            >
              {saving
                ? "Importando..."
                : `Importar ${selectedCount} movimentação(ões)`}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
