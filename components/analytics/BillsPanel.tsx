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
}

export function BillsPanel({ context, onError }: BillsPanelProps) {
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
        if (error) { onError?.(error.message); return; }
        setBills((data ?? []) as DbBill[]);
      });
    return () => { active = false; };
  }, [context, onError]);

  async function addBill(event: FormEvent) {
    event.preventDefault();
    const amount = Number(newBill.amount.replace(",", "."));
    if (!newBill.title.trim() || !newBill.dueOn || !Number.isFinite(amount) || amount <= 0) return;
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setMessage("Sua sessão expirou. Entre novamente."); return; }
    const { data, error } = await supabase
      .from("bills")
      .insert({ user_id: auth.user.id, title: newBill.title.trim(), amount, due_on: newBill.dueOn, context })
      .select("id, title, amount, due_on, status, context")
      .single();
    if (error) { setMessage(`Erro: ${error.message}`); return; }
    if (data) setBills((cur) => [...cur, data as DbBill].sort((a, b) => a.due_on.localeCompare(b.due_on)));
    setNewBill({ title: "", amount: "", dueOn: "" });
    setMessage("Conta adicionada.");
    setTimeout(() => setMessage(""), 2500);
  }

  async function toggleBill(bill: DbBill) {
    const status = bill.status === "paid" ? "pending" : "paid";
    const { error } = await createClient()
      .from("bills")
      .update({ status, paid_on: status === "paid" ? new Date().toISOString().slice(0, 10) : null })
      .eq("id", bill.id);
    if (error) { setMessage(`Erro: ${error.message}`); return; }
    setBills((cur) => cur.map((b) => (b.id === bill.id ? { ...b, status } : b)));
  }

  const pending = bills.filter((b) => b.status === "pending").length;

  return (
    <div className="glass rounded-[28px] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">controle de vencimentos</p>
          <h3 className="mt-1 text-lg font-semibold">Contas recorrentes</h3>
        </div>
        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-400">
          {pending} pendente{pending !== 1 ? "s" : ""}
        </span>
      </div>

      <form onSubmit={addBill} className="mt-4 grid gap-2 sm:grid-cols-[1fr_110px_140px_auto]">
        <input
          className="field text-sm"
          placeholder="Nome da conta"
          value={newBill.title}
          onChange={(e) => setNewBill({ ...newBill, title: e.target.value })}
        />
        <input
          className="field text-sm"
          inputMode="decimal"
          placeholder="Valor"
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
          Adicionar
        </button>
      </form>

      {message && <p className="mt-2 text-xs text-indigo-300">{message}</p>}

      <div className="mt-4 space-y-2">
        {bills.length ? (
          bills.map((bill) => (
            <button
              key={bill.id}
              onClick={() => toggleBill(bill)}
              className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition ${
                bill.status === "paid"
                  ? "border-white/05 bg-white/02 opacity-50"
                  : "border-white/08 bg-white/03 hover:bg-white/06"
              }`}
            >
              <span>
                <strong
                  className={`text-sm ${
                    bill.status === "paid" ? "text-slate-500 line-through" : "text-slate-100"
                  }`}
                >
                  {bill.title}
                </strong>
                <small className="mt-0.5 block text-xs text-slate-500">
                  vence{" "}
                  {new Date(`${bill.due_on}T12:00:00`).toLocaleDateString("pt-BR")}
                </small>
              </span>
              <span
                className={`text-sm font-semibold ${
                  bill.status === "paid" ? "text-slate-500" : "text-amber-400"
                }`}
              >
                {currency.format(Number(bill.amount))}
              </span>
            </button>
          ))
        ) : (
          <p className="py-3 text-center text-xs text-slate-500">Nenhuma conta cadastrada.</p>
        )}
      </div>
    </div>
  );
}
