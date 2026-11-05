"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type FinanceContext } from "@/lib/finance";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type DbBill = {
  id: string;
  title: string;
  amount: number | string;
  due_on: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  context: FinanceContext;
};

interface BillsPanelProps {
  context: FinanceContext;
  onError?: (msg: string) => void;
  onBillPaid?: () => void;
}

export function BillsPanel({ context, onError, onBillPaid }: BillsPanelProps) {
  const [bills, setBills] = useState<DbBill[]>([]);
  const [newBill, setNewBill] = useState({ title: "", amount: "", dueOn: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    createClient()
      .from("bills")
      .select("id, title, amount, due_on, status, context")
      .eq("context", context)
      .order("due_on", { ascending: true })
      .limit(10)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          onError?.(error.message);
          return;
        }
        setBills((data ?? []) as DbBill[]);
      });
    return () => {
      active = false;
    };
  }, [context, onError]);

  async function addBill(event: FormEvent) {
    event.preventDefault();
    const amount = Number(newBill.amount.replace(",", "."));
    if (!newBill.title.trim() || !newBill.dueOn || !Number.isFinite(amount) || amount <= 0) return;
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setMessage("Sua sessão expirou. Entre novamente.");
      return;
    }
    const { data, error } = await supabase
      .from("bills")
      .insert({
        user_id: auth.user.id,
        title: newBill.title.trim(),
        amount,
        due_on: newBill.dueOn,
        context,
      })
      .select("id, title, amount, due_on, status, context")
      .single();
    if (error) {
      setMessage(`Erro: ${error.message}`);
      return;
    }
    if (data) setBills((cur) => [...cur, data as DbBill].sort((a, b) => a.due_on.localeCompare(b.due_on)));
    setNewBill({ title: "", amount: "", dueOn: "" });
    setMessage("Conta agendada com sucesso!");
    setTimeout(() => setMessage(""), 2500);
  }

  async function toggleBill(bill: DbBill) {
    const supabase = createClient();
    const nextStatus = bill.status === "paid" ? "pending" : "paid";
    const today = new Date().toISOString().slice(0, 10);

    const { error } = await supabase
      .from("bills")
      .update({
        status: nextStatus,
        paid_on: nextStatus === "paid" ? today : null,
      })
      .eq("id", bill.id);

    if (error) {
      setMessage(`Erro: ${error.message}`);
      return;
    }

    // Se marcou como paga, registra opcionalmente na tabela de transações
    if (nextStatus === "paid") {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        // Busca categoria de contas/casa se existir
        const { data: catData } = await supabase
          .from("categories")
          .select("id")
          .eq("user_id", auth.user.id)
          .eq("name", "Casa")
          .maybeSingle();

        await supabase.from("transactions").insert({
          user_id: auth.user.id,
          category_id: catData?.id ?? null,
          description: `Pagamento: ${bill.title}`,
          amount: Number(bill.amount),
          kind: "expense",
          context: bill.context,
          occurred_on: today,
          notes: `Quitação da conta agendada para ${bill.due_on}`,
        });
        onBillPaid?.();
      }
    }

    setBills((cur) =>
      cur.map((b) => (b.id === bill.id ? { ...b, status: nextStatus } : b))
    );
    setMessage(
      nextStatus === "paid"
        ? "Conta quitada e registrada no fluxo!"
        : "Conta reaberta como pendente."
    );
    setTimeout(() => setMessage(""), 3000);
  }

  async function deleteBill(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const { error } = await createClient().from("bills").delete().eq("id", id);
    if (error) {
      setMessage(`Erro ao remover: ${error.message}`);
      return;
    }
    setBills((cur) => cur.filter((b) => b.id !== id));
  }

  const pending = bills.filter((b) => b.status === "pending").length;

  return (
    <div className="glass rounded-[28px] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">controle de vencimentos</p>
          <h3 className="mt-1 text-lg font-semibold text-white">Contas e Despesas Fixas</h3>
        </div>
        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
          {pending} pendente{pending !== 1 ? "s" : ""}
        </span>
      </div>

      <form onSubmit={addBill} className="mt-4 grid gap-2 sm:grid-cols-[1fr_110px_140px_auto]">
        <input
          className="field text-sm"
          placeholder="Nome da conta (ex.: Luz)"
          value={newBill.title}
          onChange={(e) => setNewBill({ ...newBill, title: e.target.value })}
        />
        <input
          className="field text-sm"
          inputMode="decimal"
          placeholder="Valor (R$)"
          value={newBill.amount}
          onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
        />
        <input
          className="field text-sm"
          type="date"
          value={newBill.dueOn}
          onChange={(e) => setNewBill({ ...newBill, dueOn: e.target.value })}
        />
        <button className="btn-primary rounded-2xl px-4 py-2 text-sm whitespace-nowrap">
          + Agendar
        </button>
      </form>

      {message && (
        <p className="mt-2 text-xs font-medium text-indigo-300 transition-all">
          {message}
        </p>
      )}

      <div className="mt-4 space-y-2">
        {bills.length ? (
          bills.map((bill) => {
            const isPaid = bill.status === "paid";
            return (
              <div
                key={bill.id}
                onClick={() => toggleBill(bill)}
                className={`flex w-full cursor-pointer items-center justify-between rounded-2xl border p-3.5 text-left transition ${
                  isPaid
                    ? "border-white/05 bg-white/02 opacity-60"
                    : "border-white/08 bg-white/03 hover:border-white/15 hover:bg-white/06"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`grid h-6 w-6 place-items-center rounded-lg border text-xs transition ${
                      isPaid
                        ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                        : "border-white/20 bg-white/05 text-transparent"
                    }`}
                  >
                    ✓
                  </div>
                  <div>
                    <strong
                      className={`text-sm ${
                        isPaid ? "text-slate-500 line-through" : "text-slate-100"
                      }`}
                    >
                      {bill.title}
                    </strong>
                    <small className="mt-0.5 block text-xs text-slate-500">
                      vence em{" "}
                      {new Date(`${bill.due_on}T12:00:00`).toLocaleDateString("pt-BR")}
                    </small>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-bold ${
                      isPaid ? "text-slate-500" : "text-amber-400"
                    }`}
                  >
                    {currency.format(Number(bill.amount))}
                  </span>
                  <button
                    onClick={(e) => deleteBill(e, bill.id)}
                    title="Remover conta"
                    className="rounded-lg p-1 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="py-3 text-center text-xs text-slate-500">
            Nenhuma conta cadastrada para este contexto.
          </p>
        )}
      </div>
    </div>
  );
}
