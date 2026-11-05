"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  type Bill,
  type Budget,
  type FinanceContext,
  type Goal,
  type Transaction,
} from "@/lib/finance";

type Period = "month" | "3months" | "all";

type CategoryRow = { name: string | null; icon?: string | null };
type DbTransaction = {
  id: string;
  description: string;
  amount: number | string;
  kind: Transaction["kind"];
  context: FinanceContext;
  occurred_on: string;
  notes: string | null;
  categories: CategoryRow | CategoryRow[] | null;
};
type DbGoal = {
  id: string;
  title: string;
  current_amount: number | string;
  target_amount: number | string;
  target_date: string | null;
  monthly_contribution: number | string;
  context: FinanceContext;
  goal_contributions?: { count: number }[];
};
type DbBill = {
  id: string;
  title: string;
  amount: number | string;
  due_on: string;
  status: Bill["status"];
  context: FinanceContext;
};
type DbBudget = {
  id: string;
  limit_amount: number | string;
  context: FinanceContext;
  categories: CategoryRow | CategoryRow[] | null;
};
type DbProfile = { default_context: FinanceContext; hide_balance: boolean };
type DbCategory = { id: string; name: string; icon: string | null; context: FinanceContext };

function firstCat(cat: CategoryRow | CategoryRow[] | null): CategoryRow | null {
  return Array.isArray(cat) ? cat[0] ?? null : cat;
}

function periodStart(period: Period): string | null {
  const now = new Date();
  if (period === "all") return null;
  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  }
  // 3months
  const d = new Date(now);
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().slice(0, 10);
}

export interface FinanceData {
  userId: string | null;
  userName: string;
  mode: FinanceContext;
  setMode: (m: FinanceContext) => void;
  hideBalance: boolean;
  setHideBalance: (v: boolean) => void;
  transactions: Transaction[];
  goals: Goal[];
  bills: Bill[];
  budgets: Budget[];
  categories: DbCategory[];
  loading: boolean;
  error: string | null;
  period: Period;
  setPeriod: (p: Period) => void;
  refresh: () => void;
}

export function useFinanceData(): FinanceData {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("Usuário");
  const [mode, setModeState] = useState<FinanceContext>("personal");
  const [hideBalance, setHideBalanceState] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("month");

  // Track current user so profile persist doesn't fire before we know the user
  const userIdRef = useRef<string | null>(null);
  const modeRef = useRef<FinanceContext>("personal");
  const hideBalanceRef = useRef(false);

  const setMode = useCallback((m: FinanceContext) => {
    modeRef.current = m;
    setModeState(m);
  }, []);

  const setHideBalance = useCallback((v: boolean) => {
    hideBalanceRef.current = v;
    setHideBalanceState(v);
  }, []);

  const load = useCallback(
    async (p: Period = period) => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) {
          router.replace("/login");
          return;
        }

        setUserId(auth.user.id);
        userIdRef.current = auth.user.id;
        setUserName(
          auth.user.user_metadata?.full_name ||
            auth.user.email?.split("@")[0] ||
            "Usuário"
        );

        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString()
          .slice(0, 10);

        const start = periodStart(p);

        let txQuery = supabase
          .from("transactions")
          .select("id, description, amount, kind, context, occurred_on, notes, categories(name, icon)")
          .order("occurred_on", { ascending: false })
          .limit(200);
        if (start) txQuery = txQuery.gte("occurred_on", start);

        const [profileRes, txRes, goalsRes, billsRes, budgetsRes, catsRes] =
          await Promise.all([
            supabase
              .from("profiles")
              .select("default_context, hide_balance")
              .eq("id", auth.user.id)
              .maybeSingle(),
            txQuery,
            supabase
              .from("goals")
              .select("id, title, current_amount, target_amount, target_date, monthly_contribution, context")
              .order("created_at", { ascending: false }),
            supabase
              .from("bills")
              .select("id, title, amount, due_on, status, context")
              .order("due_on", { ascending: true }),
            supabase
              .from("budgets")
              .select("id, limit_amount, context, categories(name)")
              .eq("month_start", monthStart),
            supabase
              .from("categories")
              .select("id, name, icon, context")
              .eq("user_id", auth.user.id)
              .order("name"),
          ]);

        const firstError =
          profileRes.error ||
          txRes.error ||
          goalsRes.error ||
          billsRes.error ||
          budgetsRes.error ||
          catsRes.error;
        if (firstError) throw firstError;

        const profile = profileRes.data as DbProfile | null;
        const newMode = profile?.default_context ?? "personal";
        setMode(newMode);
        setHideBalance(profile?.hide_balance ?? false);

        const rawTx = (txRes.data ?? []) as DbTransaction[];
        setTransactions(
          rawTx.map((row) => {
            const cat = firstCat(row.categories);
            return {
              id: row.id,
              title: row.description,
              category: cat?.name ?? "Sem categoria",
              date: row.occurred_on,
              amount: Number(row.amount),
              kind: row.kind,
              context: row.context,
              icon: cat?.icon ?? "•",
              notes: row.notes ?? "",
            };
          })
        );

        const rawGoals = (goalsRes.data ?? []) as DbGoal[];
        setGoals(
          rawGoals.map((row) => ({
            id: row.id,
            title: row.title,
            emoji: "◇",
            current: Number(row.current_amount),
            target: Number(row.target_amount),
            targetDate: row.target_date ?? undefined,
            monthlyContribution: Number(row.monthly_contribution),
            context: row.context,
          }))
        );

        setBills(
          ((billsRes.data ?? []) as DbBill[]).map((row) => ({
            id: row.id,
            title: row.title,
            amount: Number(row.amount),
            dueOn: row.due_on,
            status: row.status,
            context: row.context,
          }))
        );

        // Calculate budget usage using only current month's transactions
        const monthlyTx = rawTx.filter((t) => t.occurred_on >= monthStart);
        setBudgets(
          ((budgetsRes.data ?? []) as DbBudget[]).map((row) => {
            const name = firstCat(row.categories)?.name ?? "Sem categoria";
            const used = monthlyTx
              .filter((t) => {
                const cat = firstCat(t.categories);
                return cat?.name === name && t.kind === "expense" && t.context === row.context;
              })
              .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
            return {
              id: row.id,
              name,
              used,
              limit: Number(row.limit_amount),
              context: row.context,
            };
          })
        );

        setCategories((catsRes.data ?? []) as DbCategory[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível carregar os dados.");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [period, router]
  );

  // Initial load
  useEffect(() => {
    void load(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  // Persist profile when mode/hideBalance change (only after userId is known)
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    supabase
      .from("profiles")
      .upsert({ id: userId, default_context: mode, hide_balance: hideBalance }, { onConflict: "id" })
      .then(({ error }) => {
        if (error) console.error("Erro ao salvar preferências:", error.message);
      });
  }, [userId, mode, hideBalance]);

  const refresh = useCallback(() => {
    void load(period);
  }, [load, period]);

  return {
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
    categories,
    loading,
    error,
    period,
    setPeriod,
    refresh,
  };
}
