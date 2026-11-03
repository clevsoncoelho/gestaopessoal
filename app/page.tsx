"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useState, type ReactNode, type TouchEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { budgetStatus, calculateGoalProgress, requiredMonthlyContribution, sumByKind, type Bill, type Budget, type FinanceContext, type Goal, type Transaction } from "@/lib/finance";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
type CategoryRecord = { name: string | null; icon?: string | null };
type DatabaseTransaction = { id: string; description: string; amount: number | string; kind: Transaction["kind"]; context: FinanceContext; occurred_on: string; categories: CategoryRecord | CategoryRecord[] | null };
type DatabaseGoal = { id: string; title: string; current_amount: number | string; target_amount: number | string; target_date: string | null; monthly_contribution: number | string; context: FinanceContext };
type DatabaseBill = { id: string; title: string; amount: number | string; due_on: string; status: Bill["status"]; context: FinanceContext };
type DatabaseBudget = { id: string; limit_amount: number | string; context: FinanceContext; categories: CategoryRecord | CategoryRecord[] | null };
type DatabaseProfile = { default_context: FinanceContext; hide_balance: boolean };

function firstCategory(category: CategoryRecord | CategoryRecord[] | null): CategoryRecord | null {
  return Array.isArray(category) ? category[0] || null : category;
}

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<FinanceContext>("personal");
  const [tab, setTab] = useState("Início");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [hideBalance, setHideBalance] = useState(false);
  const [modal, setModal] = useState<"transaction" | "goal" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("Usuário");
  const [pullStart, setPullStart] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        if (!active) return;
        if (!auth.user) {
          router.replace("/login");
          return;
        }
        setUserId(auth.user.id);
        setUserName(auth.user.user_metadata?.full_name || auth.user.email?.split("@")[0] || "Usuário");
        setTransactions([]);
        setGoals([]);
        setBills([]);
        setBudgets([]);
        const monthStart = new Date();
        monthStart.setDate(1);
        const monthStartValue = monthStart.toISOString().slice(0, 10);
        const [profileResult, transactionsResult, goalsResult, billsResult, budgetsResult] = await Promise.all([
          supabase.from("profiles").select("default_context, hide_balance").eq("id", auth.user.id).maybeSingle(),
          supabase.from("transactions").select("id, description, amount, kind, context, occurred_on, categories(name, icon)").order("occurred_on", { ascending: false }).limit(30),
          supabase.from("goals").select("id, title, current_amount, target_amount, target_date, monthly_contribution, context").order("created_at", { ascending: false }),
          supabase.from("bills").select("id, title, amount, due_on, status, context").order("due_on", { ascending: true }),
          supabase.from("budgets").select("id, limit_amount, context, categories(name)").eq("month_start", monthStartValue)
        ]);
        const firstError = profileResult.error || transactionsResult.error || goalsResult.error || billsResult.error || budgetsResult.error;
        if (firstError) throw firstError;
        if (!active) return;
        const profile = profileResult.data as DatabaseProfile | null;
        setMode(profile?.default_context || "personal");
        setHideBalance(profile?.hide_balance || false);
        setTransactions((transactionsResult.data as DatabaseTransaction[]).map((row) => { const category = firstCategory(row.categories); return { id: row.id, title: row.description, category: category?.name || "Sem categoria", date: row.occurred_on, amount: Number(row.amount), kind: row.kind, context: row.context, icon: category?.icon || "•" }; }));
        setGoals((goalsResult.data as DatabaseGoal[]).map((row) => ({ id: row.id, title: row.title, emoji: "◇", current: Number(row.current_amount), target: Number(row.target_amount), targetDate: row.target_date || undefined, monthlyContribution: Number(row.monthly_contribution), context: row.context })));
        setBills((billsResult.data as DatabaseBill[]).map((row) => ({ id: row.id, title: row.title, amount: Number(row.amount), dueOn: row.due_on, status: row.status, context: row.context })));
        setBudgets((budgetsResult.data as DatabaseBudget[]).map((row) => ({
          id: row.id,
          name: firstCategory(row.categories)?.name || "Sem categoria",
          used: 0,
          limit: Number(row.limit_amount),
          context: row.context
        })));
      } catch (error) {
        if (active) notify(error instanceof Error ? `Não foi possível carregar os dados: ${error.message}` : "Não foi possível carregar os dados.");
      }
    }
    load();
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    async function persistProfile() {
      const { error } = await supabase.from("profiles").upsert({ id: userId, default_context: mode, hide_balance: hideBalance }, { onConflict: "id" });
      if (error) notify(`Não foi possível salvar as preferências: ${error.message}`);
    }
    void persistProfile();
  }, [hideBalance, mode, userId]);

  const visibleTransactions = transactions.filter((item) => item.context === mode || item.kind === "income");
  const visibleGoals = goals.filter((item) => item.context === mode);
  const visibleBills = bills.filter((item) => item.context === mode);
  const totals = sumByKind(visibleTransactions);
  const balance = totals.income - totals.expense;
  const visibleBudgets = budgets.filter((budget) => budget.context === mode).map((budget) => ({
    ...budget,
    used: visibleTransactions.filter((transaction) => transaction.category === budget.name && transaction.kind === "expense").reduce((total, transaction) => total + Math.abs(transaction.amount), 0)
  }));
  const budgetTotals = visibleBudgets.reduce((total, budget) => ({ used: total.used + budget.used, limit: total.limit + budget.limit }), { used: 0, limit: 0 });
  const featuredGoal = visibleGoals[0];
  function notify(message: string) { setNotice(message); window.setTimeout(() => setNotice(null), 2800); }
  async function refresh() { setLoading(true); window.location.reload(); }
  function onTouchStart(event: TouchEvent) { setPullStart(event.touches[0].clientY); }
  function onTouchEnd(event: TouchEvent) { if (pullStart !== null && event.changedTouches[0].clientY - pullStart > 100) refresh(); setPullStart(null); }

  return <main className="app-shell" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
    <div className="mx-auto min-h-dvh max-w-6xl px-5 pb-8 pt-6 sm:px-8">
      <Header mode={mode} setMode={setMode} tab={tab} setTab={setTab} userName={userName} />
      {loading && <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full w-1/3 rounded-full bg-mint" animate={{ x: [0, 300] }} transition={{ repeat: Infinity, duration: .8 }} /></div>}
      <AnimatePresence mode="wait"><motion.div className="dashboard-content" key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>{tab === "Início" && <Dashboard balance={balance} hideBalance={hideBalance} setHideBalance={setHideBalance} totals={totals} featuredGoal={featuredGoal}  visibleBills={visibleBills} budgetTotals={budgetTotals} setTab={setTab} />}{tab === "Transações" && <TransactionsView items={visibleTransactions} onDelete={async (id) => { try { if (userId) { const { error } = await createClient().from("transactions").delete().eq("id", id).eq("user_id", userId); if (error) throw error; } setTransactions((items) => items.filter((item) => item.id !== id)); notify("Transação removida"); } catch (error) { notify(error instanceof Error ? `Não foi possível remover: ${error.message}` : "Não foi possível remover a transação."); } }} onAdd={() => setModal("transaction")} />}{tab === "Análise" && <AnalyticsView items={visibleTransactions} totals={totals} budgetTotals={budgetTotals} />}{tab === "Metas" && <GoalsView goals={visibleGoals} onAdd={() => setModal("goal")} />}{tab === "Perfil" && <ProfileView userId={userId} userName={userName} mode={mode} setMode={setMode} hideBalance={hideBalance} setHideBalance={setHideBalance} />}</motion.div></AnimatePresence>
      <div className="safe-bottom" />
    </div>
    <BottomNav tab={tab} setTab={setTab} onAdd={() => setModal("transaction")} />
    <AnimatePresence>{modal === "transaction" && <TransactionModal onClose={() => setModal(null)} onSaved={(item) => { setTransactions((items) => [item, ...items]); setModal(null); notify("Transação adicionada"); }} onError={notify} userId={userId} context={mode} />}{modal === "goal" && <GoalModal onClose={() => setModal(null)} onSaved={(item) => { setGoals((items) => [item, ...items]); setModal(null); notify("Meta criada"); }} onError={notify} userId={userId} context={mode} />}{notice && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-28 left-1/2 z-40 -translate-x-1/2 rounded-full border border-mint/20 bg-[#172238] px-4 py-3 text-xs text-mint shadow-xl">{notice}</motion.div>}</AnimatePresence>
  </main>;
}

function Header({ mode, setMode, tab, setTab, userName }: { mode: FinanceContext; setMode: (mode: FinanceContext) => void; tab: string; setTab: (tab: string) => void; userName: string }) { return <><header className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="icon-box h-12 w-12 rounded-2xl bg-gradient-to-br from-mint/90 to-violet/90 text-ink shadow-glow"><Icon name="pulse" /></div><div><p className="eyebrow">olá, {userName}</p><h1 className="mt-1 text-2xl font-bold tracking-tight">{tab === "Início" ? "Seu pulso financeiro" : tab}</h1></div></div><button aria-label="Perfil" onClick={() => setTab("Perfil")} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/10 text-sm font-bold text-mint">{userName.slice(0, 2).toUpperCase()}</button></header><div className="mt-7 flex rounded-2xl border border-white/10 bg-black/10 p-1">{(["personal", "professional"] as FinanceContext[]).map((item) => <button key={item} onClick={() => setMode(item)} className={`relative flex-1 rounded-xl py-2.5 text-sm font-medium transition ${mode === item ? "text-ink" : "text-slate-400"}`}>{mode === item && <motion.span layoutId="mode" className="absolute inset-0 rounded-xl bg-mint shadow-[0_8px_24px_rgba(141,245,197,.18)]" />}<span className="relative flex items-center justify-center gap-2"><Icon name={item === "personal" ? "user" : "briefcase"} size={15} />{item === "personal" ? "Pessoal" : "Profissional"}</span></button>)}</div><div className="hide-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">{["Início", "Transações", "Análise", "Metas"].map((item) => <button key={item} onClick={() => setTab(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition ${tab === item ? "bg-white text-slate-900" : "border border-white/10 text-slate-400 hover:bg-white/5"}`}>{item}</button>)}</div></>; }

function Dashboard({ balance, hideBalance, setHideBalance, totals, featuredGoal, visibleBills, budgetTotals, setTab }: { balance: number; hideBalance: boolean; setHideBalance: (value: boolean) => void; totals: { income: number; expense: number }; featuredGoal?: Goal; visibleBills: Bill[]; budgetTotals: { used: number; limit: number }; setTab: (tab: string) => void }) { const due = visibleBills.find((bill) => bill.status === "pending"); const budgetPercent = budgetTotals.limit > 0 ? Math.min(100, (budgetTotals.used / budgetTotals.limit) * 100) : 0; const budgetState = budgetStatus(budgetTotals.used, budgetTotals.limit); return <><section className="glass mt-5 overflow-hidden rounded-[28px] p-6"><div className="flex items-start justify-between"><div><p className="text-xs text-slate-400">Saldo disponível</p><div className="mt-2 flex items-center gap-3"><p className="text-3xl font-semibold tracking-tight">{hideBalance ? "••••••" : currency.format(balance)}</p><button onClick={() => setHideBalance(!hideBalance)} className="text-slate-400" aria-label="Ocultar saldo">{hideBalance ? "◉" : "◌"}</button></div></div><span className="rounded-full border border-mint/20 bg-mint/10 px-3 py-1 text-xs text-mint">Fluxo real</span></div><div className="mt-7 flex items-center gap-6"><Donut totals={totals} /><div className="space-y-3 text-xs text-slate-300"><p><i className="mr-2 inline-block h-2 w-2 rounded-full bg-mint" />Entradas <strong className="ml-3 text-white">{currency.format(totals.income)}</strong></p><p><i className="mr-2 inline-block h-2 w-2 rounded-full bg-coral" />Saídas <strong className="ml-3 text-white">{currency.format(totals.expense)}</strong></p></div></div></section><div className="mt-6 flex items-end justify-between"><div><p className="text-xs uppercase tracking-[.2em] text-slate-500">Visão geral</p><h2 className="mt-1 text-lg font-semibold">Atalhos inteligentes</h2></div><button onClick={() => setTab("Transações")} className="text-xs font-medium text-mint">Ver transações →</button></div><section className="mt-3 grid grid-cols-2 gap-3"><button onClick={() => setTab("Metas")} className="glass rounded-2xl p-4 text-left"><p className="text-xs text-slate-500">Meta em destaque</p><p className="mt-2 truncate text-sm font-semibold">{featuredGoal?.title || "Crie sua primeira meta"}</p>{featuredGoal && <><div className="mt-3 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-mint to-violet" style={{ width: `${calculateGoalProgress(featuredGoal)}%` }} /></div><p className="mt-2 text-[11px] text-mint">{calculateGoalProgress(featuredGoal).toFixed(0)}% concluído</p></>}</button><button onClick={() => setTab("Perfil")} className="glass rounded-2xl p-4 text-left"><p className="text-xs text-slate-500">Próxima conta</p><p className="mt-2 text-lg font-semibold">{due ? currency.format(due.amount) : "Tudo em dia"}</p><p className="mt-2 text-[11px] text-coral">{due ? `vence em ${new Date(`${due.dueOn}T12:00:00`).toLocaleDateString("pt-BR")}` : "nenhuma pendência"}</p></button></section><section className="glass mt-6 rounded-[26px] p-5"><div className="flex items-end justify-between"><div><p className="text-xs text-slate-400">Orçamento mensal</p><h2 className="mt-1 text-lg font-semibold">{budgetTotals.limit > 0 ? "Essenciais" : "Nenhum orçamento"}</h2></div><span className={`text-sm font-semibold ${budgetState === "red" ? "text-coral" : budgetState === "yellow" ? "text-amber-200" : "text-mint"}`}>{budgetTotals.limit > 0 ? `${budgetPercent.toFixed(0)}%` : "—"}</span></div><div className="mt-4 h-2 rounded-full bg-white/10"><div className={`h-full rounded-full ${budgetState === "red" ? "bg-coral" : budgetState === "yellow" ? "bg-amber-300" : "bg-mint"}`} style={{ width: `${budgetPercent}%` }} /></div><p className="mt-3 text-xs text-slate-500">{budgetTotals.limit > 0 ? `${currency.format(budgetTotals.used)} usados de ${currency.format(budgetTotals.limit)}` : "Crie um orçamento no Supabase para acompanhar seus limites."}</p></section></>; }
function Donut({ totals }: { totals: { income: number; expense: number } }) {
  const total = totals.income + totals.expense;
  const incomeShare = total > 0 ? totals.income / total : 0;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const incomeLength = circumference * incomeShare;
  const expenseLength = circumference - incomeLength;
  const result = totals.income - totals.expense;
  return <div className="relative grid h-44 w-44 shrink-0 place-items-center">
    <svg viewBox="0 0 140 140" className="-rotate-90" aria-label="Distribuição entre entradas e saídas">
      <circle cx="70" cy="70" r={radius} fill="none" stroke="#292929" strokeWidth="13" />
      {total > 0 && <><circle cx="70" cy="70" r={radius} fill="none" stroke="#f5f5f5" strokeWidth="13" strokeLinecap="round" strokeDasharray={`${incomeLength} ${circumference}`} /><circle cx="70" cy="70" r={radius} fill="none" stroke="#737373" strokeWidth="13" strokeLinecap="round" strokeDasharray={`${expenseLength} ${circumference}`} strokeDashoffset={-incomeLength} /></>}
      <circle cx="70" cy="70" r="44" fill="#171717" stroke="#3b3b3b" strokeWidth="1" />
    </svg>
    <div className="absolute inset-0 grid place-items-center text-center"><span className="eyebrow !text-[9px]">resultado</span><strong className={`mt-1 max-w-[116px] truncate text-base ${result >= 0 ? "text-white" : "text-red-300"}`}>{currency.format(result)}</strong><span className="mt-1 text-[10px] text-neutral-500">{total > 0 ? "este período" : "sem dados"}</span></div>
  </div>;
}

function TransactionsView({ items, onDelete, onAdd }: { items: Transaction[]; onDelete: (id: string) => void; onAdd: () => void }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | "income" | "expense">("all");
  const [period, setPeriod] = useState<"all" | "month">("month");
  const month = new Date().toISOString().slice(0, 7);
  const filtered = items.filter((item) => {
    const matchesQuery = `${item.title} ${item.category}`.toLowerCase().includes(query.toLowerCase());
    const matchesKind = kind === "all" || item.kind === kind;
    const matchesPeriod = period === "all" || item.date === "Agora" || item.date.startsWith(month);
    return matchesQuery && matchesKind && matchesPeriod;
  });
  return <section className="mt-6"><div className="flex gap-3"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar movimentações" className="glass min-w-0 flex-1 rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-mint/40" /><button onClick={onAdd} className="rounded-2xl bg-mint px-4 text-sm font-semibold text-ink">＋</button></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3"><select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)} className="field text-xs"><option value="all">Todos os tipos</option><option value="income">Receitas</option><option value="expense">Despesas</option></select><select value={period} onChange={(event) => setPeriod(event.target.value as typeof period)} className="field text-xs"><option value="month">Este mês</option><option value="all">Todo o período</option></select><div className="hidden items-center justify-center rounded-2xl border border-white/10 px-3 text-xs text-neutral-500 sm:flex">{filtered.length} resultado(s)</div></div><div className="mt-5 space-y-3">{filtered.length ? filtered.map((item) => <SwipeRow key={item.id} item={item} onDelete={onDelete} />) : <Empty title="Nenhuma transação encontrada" text="Ajuste os filtros ou adicione uma movimentação." />}</div></section>;
}
function SwipeRow({ item, onDelete }: { item: Transaction; onDelete: (id: string) => void }) { return <div className="relative overflow-hidden rounded-2xl"><div className="absolute inset-y-0 right-0 grid w-24 place-items-center bg-coral text-sm font-semibold text-ink">Excluir</div><motion.div drag="x" dragConstraints={{ left: -96, right: 0 }} onDragEnd={(_, info) => { if (info.offset.x < -70) onDelete(item.id); }} className="glass relative flex items-center gap-3 rounded-2xl p-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/[.07] text-lg">{item.icon}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.category} · {item.date}</p></div><p className={`text-sm font-semibold ${item.kind === "income" ? "text-mint" : "text-white"}`}>{item.kind === "income" ? "+" : "-"}{currency.format(item.amount)}</p></motion.div></div>; }

function GoalsView({ goals, onAdd }: { goals: Goal[]; onAdd: () => void }) { return <section className="mt-6"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[.2em] text-slate-500">Motor de metas</p><h2 className="mt-1 text-xl font-semibold">O que você quer realizar?</h2></div><button onClick={onAdd} className="rounded-2xl bg-mint px-4 py-3 text-sm font-semibold text-ink">＋ Meta</button></div><div className="mt-5 space-y-3">{goals.length ? goals.map((goal) => { const progress = calculateGoalProgress(goal); return <div key={goal.id} className="glass rounded-[26px] p-5"><div className="flex justify-between"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[.07] text-xl">{goal.emoji}</span><div><h3 className="font-semibold">{goal.title}</h3><p className="mt-1 text-xs text-slate-500">{goal.targetDate ? `até ${new Date(`${goal.targetDate}T12:00:00`).toLocaleDateString("pt-BR")}` : "sem prazo definido"}</p></div></div><span className="text-sm font-semibold text-mint">{progress.toFixed(0)}%</span></div><div className="mt-5 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-mint to-violet" style={{ width: `${progress}%` }} /></div><div className="mt-3 flex justify-between text-xs"><span>{currency.format(goal.current)} guardados</span><span className="text-slate-500">de {currency.format(goal.target)}</span></div><p className="mt-3 rounded-xl bg-mint/10 px-3 py-2 text-xs text-mint">Aporte recomendado: {currency.format(goal.monthlyContribution || requiredMonthlyContribution(goal.current, goal.target, goal.targetDate))}/mês</p></div>; }) : <Empty title="Nenhuma meta criada" text="Comece com um objetivo pequeno e consistente." />}</div></section>; }

function ProfileView({ userId, userName, mode, setMode, hideBalance, setHideBalance }: { userId: string | null; userName: string; mode: FinanceContext; setMode: (mode: FinanceContext) => void; hideBalance: boolean; setHideBalance: (value: boolean) => void }) { return <section className="mt-6"><div className="glass rounded-[28px] p-6 text-center"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-mint to-violet text-2xl font-bold text-ink">{userName.slice(0, 2).toUpperCase()}</div><h2 className="mt-4 text-xl font-semibold">{userName}</h2><p className="mt-1 text-xs text-slate-500">Conta conectada ao Supabase</p></div>{userId && <div className="glass mt-4 divide-y divide-white/10 rounded-[26px]"><button onClick={() => setHideBalance(!hideBalance)} className="flex w-full items-center justify-between p-4 text-left text-sm"><span>Ocultar saldo</span><span className={`h-6 w-11 rounded-full p-1 transition ${hideBalance ? "bg-mint" : "bg-white/10"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${hideBalance ? "translate-x-5" : ""}`} /></span></button><div className="flex items-center justify-between p-4 text-sm"><span>Contexto padrão</span><select value={mode} onChange={(event) => setMode(event.target.value as FinanceContext)} className="rounded-lg bg-white/10 px-2 py-1 text-xs"><option value="personal">Pessoal</option><option value="professional">Profissional</option></select></div><button onClick={async () => { const { error } = await createClient().auth.signOut(); if (error) return; window.location.reload(); }} className="w-full p-4 text-left text-sm text-coral">Sair da conta</button></div>}</section>; }
function AnalyticsView({ items, totals, budgetTotals }: { items: Transaction[]; totals: { income: number; expense: number }; budgetTotals: { used: number; limit: number } }) {
  const [bills, setBills] = useState<DatabaseBill[]>([]);
  const [newBill, setNewBill] = useState({ title: "", amount: "", dueOn: "" });
  const [billMessage, setBillMessage] = useState("");
  const categories = items.filter((item) => item.kind === "expense").reduce<Record<string, number>>((acc, item) => { acc[item.category] = (acc[item.category] || 0) + Math.abs(item.amount); return acc; }, {});
  const ranked = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  const max = ranked[0]?.[1] || 1;
  const savings = totals.income - totals.expense;

  useEffect(() => {
    let active = true;
    createClient().from("bills").select("id, title, amount, due_on, status, context").order("due_on", { ascending: true }).limit(8).then(({ data, error }) => {
      if (active && !error) setBills((data || []) as DatabaseBill[]);
    });
    return () => { active = false; };
  }, []);

  async function addBill(event: FormEvent) {
    event.preventDefault();
    const amount = Number(newBill.amount.replace(",", "."));
    if (!newBill.title.trim() || !newBill.dueOn || !Number.isFinite(amount) || amount <= 0) return;
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setBillMessage("Sua sessão expirou. Entre novamente."); return; }
    const { data, error } = await supabase.from("bills").insert({ user_id: auth.user.id, title: newBill.title.trim(), amount, due_on: newBill.dueOn, context: "personal" }).select("id, title, amount, due_on, status, context").single();
    if (error) { setBillMessage(`Não foi possível criar a conta: ${error.message}`); return; }
    if (data) setBills((current) => [...current, data as DatabaseBill].sort((a, b) => a.due_on.localeCompare(b.due_on)));
    setNewBill({ title: "", amount: "", dueOn: "" });
    setBillMessage("Conta adicionada.");
  }

  async function toggleBill(bill: DatabaseBill) {
    const status = bill.status === "paid" ? "pending" : "paid";
    const { error } = await createClient().from("bills").update({ status, paid_on: status === "paid" ? new Date().toISOString().slice(0, 10) : null }).eq("id", bill.id);
    if (error) { setBillMessage(`Não foi possível atualizar a conta: ${error.message}`); return; }
    setBills((current) => current.map((item) => item.id === bill.id ? { ...item, status } : item));
  }

  return <section className="mt-6 space-y-4">
    <div className="soft-grid surface overflow-hidden rounded-[30px] p-6"><p className="eyebrow">inteligência financeira</p><div className="mt-2 flex items-end justify-between gap-4"><div><h2 className="text-2xl font-bold">Seu mês em números</h2><p className="mt-2 text-sm text-slate-400">Uma leitura rápida do seu comportamento financeiro.</p></div><div className="icon-box h-12 w-12 rounded-2xl bg-white/10"><Icon name="chart" /></div></div><div className="mt-6 grid grid-cols-2 gap-3"><Metric label="Receitas" value={currency.format(totals.income)} tone="mint" /><Metric label="Despesas" value={currency.format(totals.expense)} tone="coral" /><Metric label="Resultado" value={currency.format(savings)} tone={savings >= 0 ? "mint" : "coral"} /><Metric label="Uso do orçamento" value={budgetTotals.limit ? `${Math.round((budgetTotals.used / budgetTotals.limit) * 100)}%` : "—"} tone="violet" /></div></div>
    <div className="glass rounded-[28px] p-5"><div className="flex items-center justify-between"><div><p className="eyebrow">onde seu dinheiro vai</p><h3 className="mt-1 text-lg font-semibold">Gastos por categoria</h3></div><Icon name="filter" size={18} /></div><div className="mt-5 space-y-4">{ranked.length ? ranked.slice(0, 5).map(([name, value]) => <div key={name}><div className="mb-2 flex justify-between text-xs"><span className="text-slate-300">{name}</span><strong>{currency.format(value)}</strong></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-white" style={{ width: `${(value / max) * 100}%` }} /></div></div>) : <Empty title="Ainda não há dados suficientes" text="Adicione algumas transações para ver seus padrões." />}</div></div>
    <div className="glass rounded-[28px] p-5"><div className="flex items-center justify-between"><div><p className="eyebrow">controle de vencimentos</p><h3 className="mt-1 text-lg font-semibold">Contas recorrentes</h3></div><span className="text-xs text-neutral-500">{bills.filter((bill) => bill.status === "pending").length} pendentes</span></div><form onSubmit={addBill} className="mt-4 grid gap-2 sm:grid-cols-[1fr_120px_150px_auto]"><input className="field" placeholder="Nome da conta" value={newBill.title} onChange={(event) => setNewBill({ ...newBill, title: event.target.value })} /><input className="field" inputMode="decimal" placeholder="Valor" value={newBill.amount} onChange={(event) => setNewBill({ ...newBill, amount: event.target.value })} /><input className="field" type="date" value={newBill.dueOn} onChange={(event) => setNewBill({ ...newBill, dueOn: event.target.value })} /><button className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black">Adicionar</button></form>{billMessage && <p className="mt-2 text-xs text-neutral-400">{billMessage}</p>}<div className="mt-4 space-y-2">{bills.length ? bills.map((bill) => <button key={bill.id} onClick={() => toggleBill(bill)} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[.03] p-3 text-left hover:bg-white/[.06]"><span><strong className={bill.status === "paid" ? "text-neutral-500 line-through" : ""}>{bill.title}</strong><small className="mt-1 block text-xs text-neutral-500">vence em {new Date(`${bill.due_on}T12:00:00`).toLocaleDateString("pt-BR")}</small></span><span className="text-sm font-semibold">{currency.format(Number(bill.amount))}</span></button>) : <p className="py-3 text-center text-xs text-neutral-500">Nenhuma conta cadastrada.</p>}</div></div>
  </section>;
}
function Metric({ label, value, tone }: { label: string; value: string; tone: "mint" | "coral" | "violet" }) { return <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><p className="text-xs text-slate-500">{label}</p><p className={`mt-2 text-lg font-bold ${tone === "mint" ? "text-mint" : tone === "coral" ? "text-coral" : "text-violet-200"}`}>{value}</p></div>; }

function AuthCard() { const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [message, setMessage] = useState(""); async function signIn(event: FormEvent) { event.preventDefault(); try { const supabase = createClient(); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; window.location.reload(); } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível entrar"); } } async function signUp() { try { const supabase = createClient(); const { error } = await supabase.auth.signUp({ email, password }); if (error) throw error; setMessage("Conta criada. Confira seu e-mail para confirmar o acesso."); } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível criar a conta"); } } return <div className="glass mt-4 rounded-[26px] p-5"><p className="text-sm font-semibold">Conectar conta</p><p className="mt-1 text-xs text-slate-500">Use o Supabase Auth para sincronizar seus dados.</p><form onSubmit={signIn} className="mt-4 space-y-3"><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Seu e-mail" className="field" /><input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha" className="field" /><button className="w-full rounded-2xl bg-mint py-3 text-sm font-semibold text-ink">Entrar</button></form><button onClick={signUp} className="mt-3 w-full rounded-2xl border border-white/10 py-3 text-sm text-slate-300">Criar conta</button>{message && <p className="mt-3 text-xs text-amber-200">{message}</p>}</div>; }

function Icon({ name, size = 20 }: { name: "pulse" | "user" | "briefcase" | "chart" | "filter" | "home" | "list" | "target" | "settings"; size?: number }) { const paths: Record<string, string> = { pulse: "M4 13h4l2-7 4 14 2-7h4", user: "M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8", briefcase: "M4 7h16v13H4zM8 7V4h8v3M4 12h16", chart: "M4 19V5m0 14h16M8 16v-5m4 5V7m4 9v-8", filter: "M4 6h16M7 12h10m-7 6h4", home: "m3 11 9-8 9 8v9H3z", list: "M5 6h14M5 12h14M5 18h14", target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-5a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-5h.01", settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.6h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.6v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2.6h-.2a1.7 1.7 0 0 0-1.6 1Z" }; return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>; }
function BottomNav({ tab, setTab, onAdd }: { tab: string; setTab: (tab: string) => void; onAdd: () => void }) { return <nav className="fixed bottom-3 left-3 right-3 z-20 nav-glass rounded-3xl px-3 pb-[calc(9px+env(safe-area-inset-bottom))] pt-3"><div className="mx-auto flex max-w-xl items-end justify-between"><NavButton label="Início" icon="home" active={tab === "Início"} onClick={() => setTab("Início")} /><NavButton label="Movimentos" icon="list" active={tab === "Transações"} onClick={() => setTab("Transações")} /><button onClick={onAdd} aria-label="Nova transação" className="-mt-9 grid h-16 w-16 place-items-center rounded-[22px] border-4 border-[#0b1220] bg-gradient-to-br from-mint to-violet text-3xl text-ink shadow-[0_10px_40px_rgba(141,245,197,.3)]">＋</button><NavButton label="Análise" icon="chart" active={tab === "Análise"} onClick={() => setTab("Análise")} /><NavButton label="Perfil" icon="settings" active={tab === "Perfil"} onClick={() => setTab("Perfil")} /></div></nav>; }
function NavButton({ label, icon, active, onClick }: { label: string; icon: "home" | "list" | "target" | "settings" | "chart"; active: boolean; onClick: () => void }) { return <button onClick={onClick} className={`flex w-16 flex-col items-center gap-1 text-[10px] font-medium transition ${active ? "text-mint" : "text-slate-500"}`}><span className={`grid h-8 w-8 place-items-center rounded-xl ${active ? "bg-mint/10" : ""}`}><Icon name={icon} size={18} /></span>{label}</button>; }
function Empty({ title, text }: { title: string; text: string }) { return <div className="glass rounded-2xl p-7 text-center"><p className="text-sm font-medium">{title}</p><p className="mt-2 text-xs text-slate-500">{text}</p></div>; }

function TransactionModal({ onClose, onSaved, onError, userId, context }: { onClose: () => void; onSaved: (item: Transaction) => void; onError: (message: string) => void; userId: string | null; context: FinanceContext }) { const [title, setTitle] = useState(""); const [amount, setAmount] = useState(""); const [kind, setKind] = useState<"expense" | "income">("expense"); const [category, setCategory] = useState("Alimentação"); async function submit(event: FormEvent) { event.preventDefault(); const value = Number(amount.replace(",", ".")); if (!userId) { onError("Sua sessão expirou. Entre novamente."); return; } if (!title.trim() || !Number.isFinite(value) || value <= 0) return; const item: Transaction = { id: crypto.randomUUID(), title: title.trim(), category, date: "Agora", amount: value, kind, context, icon: kind === "income" ? "↑" : "•" }; try { const supabase = createClient(); const { data: categoryRow, error: categoryError } = await supabase.from("categories").select("id").eq("user_id", userId).eq("name", category).eq("context", context).maybeSingle(); if (categoryError) throw categoryError; const { error } = await supabase.from("transactions").insert({ user_id: userId, category_id: categoryRow?.id || null, description: item.title, amount: value, kind, context, occurred_on: new Date().toISOString().slice(0, 10) }); if (error) throw error; onSaved(item); } catch (error) { onError(error instanceof Error ? `Não foi possível salvar: ${error.message}` : "Não foi possível salvar a transação."); } } return <Modal title="Nova transação" onClose={onClose}><form onSubmit={submit} className="space-y-3"><input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Mercado, cliente, aluguel" className="field" /><div className="grid grid-cols-2 gap-3"><input required inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Valor" className="field" /><select value={kind} onChange={(event) => setKind(event.target.value as "expense" | "income")} className="field"><option value="expense">Despesa</option><option value="income">Receita</option></select></div><select value={category} onChange={(event) => setCategory(event.target.value)} className="field"><option>Alimentação</option><option>Transporte</option><option>Serviços</option><option>Lazer</option><option>Casa</option></select><button className="w-full rounded-2xl bg-mint py-3 text-sm font-semibold text-ink">Salvar transação</button></form></Modal>; }
function GoalModal({ onClose, onSaved, onError, userId, context }: { onClose: () => void; onSaved: (item: Goal) => void; onError: (message: string) => void; userId: string | null; context: FinanceContext }) { const [title, setTitle] = useState(""); const [target, setTarget] = useState(""); const [date, setDate] = useState(""); async function submit(event: FormEvent) { event.preventDefault(); const value = Number(target.replace(",", ".")); if (!userId) { onError("Sua sessão expirou. Entre novamente."); return; } if (!title.trim() || !Number.isFinite(value) || value <= 0) return; const item: Goal = { id: crypto.randomUUID(), title: title.trim(), emoji: "◇", current: 0, target: value, targetDate: date || undefined, monthlyContribution: requiredMonthlyContribution(0, value, date || undefined), context }; try { const { error } = await createClient().from("goals").insert({ user_id: userId, title: item.title, target_amount: value, target_date: date || null, monthly_contribution: item.monthlyContribution, context }); if (error) throw error; onSaved(item); } catch (error) { onError(error instanceof Error ? `Não foi possível criar a meta: ${error.message}` : "Não foi possível criar a meta."); } } return <Modal title="Nova meta" onClose={onClose}><form onSubmit={submit} className="space-y-3"><input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Reserva, viagem, carro" className="field" /><input required inputMode="decimal" value={target} onChange={(event) => setTarget(event.target.value)} placeholder="Valor alvo" className="field" /><label className="block text-xs text-slate-500">Prazo (opcional)<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="field mt-2" /></label><button className="w-full rounded-2xl bg-mint py-3 text-sm font-semibold text-ink">Criar meta</button></form></Modal>; }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) { return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm"><motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }} onClick={(event) => event.stopPropagation()} className="glass w-full max-w-lg rounded-[28px] p-5"><div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" /><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2><button onClick={onClose} className="text-slate-500">✕</button></div>{children}</motion.div></motion.div>; }
