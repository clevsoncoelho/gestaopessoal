"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, type TouchEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { sumByKind, type Goal, type Transaction } from "@/lib/finance";
import { useFinanceData } from "@/lib/hooks/useFinanceData";
import { useToast } from "@/lib/hooks/useToast";

import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { TransactionsView } from "@/components/transactions/TransactionsView";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { PdfImportModal } from "@/components/transactions/PdfImportModal";
import { GoalsView } from "@/components/goals/GoalsView";
import { GoalModal } from "@/components/goals/GoalModal";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { ProfileView } from "@/components/profile/ProfileView";
import { Toast } from "@/components/ui/Toast";
import { Icon } from "@/components/ui/Icon";

export default function Home() {
  const {
    userId,
    userName,
    mode,
    setMode,
    hideBalance,
    setHideBalance,
    transactions,
    goals,
    bills,
    budgets,
    loading,
    error,
    period,
    setPeriod,
    refresh,
  } = useFinanceData();

  const { toast, show: showToast } = useToast();
  const [tab, setTab] = useState("Início");
  const [modal, setModal] = useState<"transaction" | "goal" | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isImportingPdf, setIsImportingPdf] = useState(false);
  const [pullStart, setPullStart] = useState<number | null>(null);

  // Pull-to-refresh without window.location.reload()
  function onTouchStart(event: TouchEvent) {
    setPullStart(event.touches[0].clientY);
  }

  function onTouchEnd(event: TouchEvent) {
    if (pullStart !== null && event.changedTouches[0].clientY - pullStart > 100) {
      refresh();
    }
    setPullStart(null);
  }

  // Filtered views based on mode
  const visibleTransactions = transactions.filter(
    (item) => item.context === mode || item.kind === "income"
  );
  const visibleGoals = goals.filter((item) => item.context === mode);
  const visibleBills = bills.filter((item) => item.context === mode);

  const totals = sumByKind(visibleTransactions);
  const balance = totals.income - totals.expense;

  const visibleBudgets = budgets.filter((b) => b.context === mode);
  const budgetTotals = visibleBudgets.reduce(
    (total, budget) => ({
      used: total.used + budget.used,
      limit: total.limit + budget.limit,
    }),
    { used: 0, limit: 0 }
  );

  const featuredGoal = visibleGoals[0];

  async function handleDeleteTransaction(id: string) {
    try {
      if (userId) {
        const { error } = await createClient()
          .from("transactions")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);
        if (error) throw error;
      }
      refresh();
      showToast("Transação removida com sucesso");
    } catch (err) {
      showToast(
        err instanceof Error
          ? `Não foi possível remover: ${err.message}`
          : "Não foi possível remover a transação."
      );
    }
  }

  return (
    <main className="app-shell" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="mx-auto min-h-dvh max-w-6xl px-5 pb-8 pt-6 sm:px-8">
        <Header
          mode={mode}
          setMode={setMode}
          tab={tab}
          setTab={setTab}
          userName={userName}
        />

        {/* Global loading indicator bar */}
        {loading && (
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/05">
            <motion.div
              className="h-full w-1/3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
              animate={{ x: [-100, 450] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            />
          </div>
        )}

        {/* Persistent Error with Retry */}
        {error && !loading && (
          <div className="glass mt-4 flex items-center justify-between rounded-2xl border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <Icon name="x" size={16} className="text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={refresh}
              className="rounded-xl border border-rose-500/40 bg-rose-500/20 px-3 py-1.5 font-semibold text-rose-200 transition hover:bg-rose-500/30"
            >
              Tentar novamente
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            className="dashboard-content"
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {tab === "Início" && (
              <Dashboard
                balance={balance}
                hideBalance={hideBalance}
                setHideBalance={setHideBalance}
                totals={totals}
                featuredGoal={featuredGoal}
                visibleBills={visibleBills}
                budgetTotals={budgetTotals}
                setTab={setTab}
                onImportPdf={() => setIsImportingPdf(true)}
              />
            )}

            {tab === "Transações" && (
              <TransactionsView
                items={visibleTransactions}
                loading={loading}
                onDelete={handleDeleteTransaction}
                onEdit={(item) => setEditingTransaction(item)}
                onAdd={() => {
                  setEditingTransaction(null);
                  setModal("transaction");
                }}
                onImportPdf={() => setIsImportingPdf(true)}
                period={period}
                setPeriod={setPeriod}
              />
            )}

            {tab === "Análise" && (
              <AnalyticsView
                items={visibleTransactions}
                totals={totals}
                budgetTotals={budgetTotals}
                budgets={visibleBudgets}
                context={mode}
                userId={userId}
                onError={showToast}
                onBudgetCreated={() => {
                  refresh();
                  showToast("Orçamento criado com sucesso!");
                }}
                onRefresh={refresh}
              />
            )}

            {tab === "Metas" && (
              <GoalsView
                goals={visibleGoals}
                loading={loading}
                userId={userId}
                onAdd={() => {
                  setEditingGoal(null);
                  setModal("goal");
                }}
                onEdit={(goal) => setEditingGoal(goal)}
                onGoalUpdated={() => {
                  refresh();
                  showToast("Aporte registrado com sucesso!");
                }}
                onGoalDeleted={() => {
                  refresh();
                  showToast("Meta removida com sucesso");
                }}
                onError={showToast}
              />
            )}

            {tab === "Perfil" && (
              <ProfileView
                userId={userId}
                userName={userName}
                mode={mode}
                setMode={setMode}
                hideBalance={hideBalance}
                setHideBalance={setHideBalance}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="safe-bottom" />
      </div>

      <BottomNav
        tab={tab}
        setTab={setTab}
        onAdd={() => {
          setEditingTransaction(null);
          setModal("transaction");
        }}
      />

      {/* Modals */}
      <AnimatePresence>
        {(modal === "transaction" || editingTransaction !== null) && (
          <TransactionModal
            initialData={editingTransaction}
            onClose={() => {
              setModal(null);
              setEditingTransaction(null);
            }}
            onSaved={() => {
              setModal(null);
              setEditingTransaction(null);
              refresh();
              showToast(
                editingTransaction
                  ? "Transação atualizada com sucesso!"
                  : "Transação adicionada com sucesso!"
              );
            }}
            onError={showToast}
            userId={userId}
            context={mode}
          />
        )}

        {(modal === "goal" || editingGoal !== null) && (
          <GoalModal
            initialData={editingGoal}
            onClose={() => {
              setModal(null);
              setEditingGoal(null);
            }}
            onSaved={() => {
              setModal(null);
              setEditingGoal(null);
              refresh();
              showToast(
                editingGoal
                  ? "Meta atualizada com sucesso!"
                  : "Meta criada com sucesso!"
              );
            }}
            onError={showToast}
            userId={userId}
            context={mode}
          />
        )}

        {isImportingPdf && (
          <PdfImportModal
            userId={userId}
            context={mode}
            onClose={() => setIsImportingPdf(false)}
            onSuccess={(count) => {
              setIsImportingPdf(false);
              refresh();
              showToast(`${count} movimentação(ões) importada(s) do extrato com sucesso!`);
            }}
            onError={showToast}
          />
        )}
      </AnimatePresence>

      {/* Global Toast */}
      <Toast message={toast.message} onUndo={toast.onUndo} />
    </main>
  );
}
