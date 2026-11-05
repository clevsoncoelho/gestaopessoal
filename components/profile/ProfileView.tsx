"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type FinanceContext } from "@/lib/finance";
import { Icon } from "@/components/ui/Icon";

declare global {
  interface Window {
    PluggyConnect: new (options: {
      connectToken: string;
      onSuccess: () => void;
      onError: () => void;
    }) => { init: () => void };
  }
}

interface ProfileViewProps {
  userId: string | null;
  userName: string;
  mode: FinanceContext;
  setMode: (m: FinanceContext) => void;
  hideBalance: boolean;
  setHideBalance: (v: boolean) => void;
}

export function ProfileView({
  userId,
  userName,
  mode,
  setMode,
  hideBalance,
  setHideBalance,
}: ProfileViewProps) {
  const [bankMessage, setBankMessage] = useState("");
  const [connecting, setConnecting] = useState(false);

  async function connectInter() {
    setConnecting(true);
    setBankMessage("Abrindo autorização segura...");
    try {
      const response = await fetch("/api/bank/inter/connect", { method: "POST" });
      const result = (await response.json()) as { connectToken?: string; message?: string };
      if (!response.ok || !result.connectToken) {
        setBankMessage(result.message || "Não foi possível iniciar a autorização.");
        setConnecting(false);
        return;
      }
      const connectToken = result.connectToken;
      const script = document.createElement("script");
      script.src = "https://cdn.pluggy.ai/pluggy-connect/v2.0.0/pluggy-connect.js";
      script.async = true;
      script.onload = () => {
        setConnecting(false);
        const widget = new window.PluggyConnect({
          connectToken,
          onSuccess: () =>
            setBankMessage("Banco autorizado com sucesso! A sincronização estará disponível em breve."),
          onError: () =>
            setBankMessage("A autorização foi cancelada ou não pôde ser concluída."),
        });
        widget.init();
      };
      script.onerror = () => {
        setConnecting(false);
        setBankMessage("Não foi possível carregar o widget seguro da Pluggy.");
      };
      document.body.appendChild(script);
    } catch {
      setConnecting(false);
      setBankMessage("Não foi possível iniciar a autorização agora.");
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <section className="mt-6 space-y-4">
      {/* Profile Card */}
      <div className="glass rounded-[28px] p-6 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-2xl font-bold text-white shadow-glow">
          {userName.slice(0, 2).toUpperCase()}
        </div>
        <h2 className="mt-4 text-xl font-bold tracking-tight text-white">{userName}</h2>
        <p className="mt-1 text-xs text-slate-400">Conta sincronizada no Supabase</p>
      </div>

      {userId && (
        <>
          {/* Open Finance Card */}
          <div className="glass rounded-[26px] p-5">
            <div className="flex items-center gap-2">
              <span className="eyebrow">open finance</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                Oficial
              </span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-white">Banco Inter</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              A autorização abre a interface criptografada da Pluggy. Sua senha e credenciais nunca passam
              pelos servidores do Pulse Finance.
            </p>
            <button
              onClick={connectInter}
              disabled={connecting}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm font-semibold text-indigo-300 transition hover:bg-indigo-500/20 disabled:opacity-50"
            >
              <Icon name="pulse" size={16} />
              {connecting ? "Conectando..." : "Autorizar Banco Inter"}
            </button>
            {bankMessage && (
              <p className="mt-3 rounded-xl bg-white/04 p-2.5 text-center text-xs text-indigo-200">
                {bankMessage}
              </p>
            )}
          </div>

          {/* Preferences and Actions */}
          <div className="glass divide-y divide-white/06 rounded-[26px]">
            {/* Balance Visibility Toggle */}
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="flex w-full items-center justify-between p-4 text-left text-sm transition hover:bg-white/02"
            >
              <span className="text-slate-200">Ocultar saldo no dashboard</span>
              <span
                className={`flex h-6 w-11 items-center rounded-full p-1 transition ${
                  hideBalance ? "bg-indigo-500" : "bg-white/10"
                }`}
              >
                <span
                  className={`block h-4 w-4 rounded-full bg-white transition ${
                    hideBalance ? "translate-x-5" : ""
                  }`}
                />
              </span>
            </button>

            {/* Default Context */}
            <div className="flex items-center justify-between p-4 text-sm">
              <span className="text-slate-200">Modo padrão de abertura</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as FinanceContext)}
                className="rounded-xl border border-white/10 bg-white/06 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500/40"
              >
                <option value="personal" className="bg-[#0f0f1e] text-white">
                  Pessoal
                </option>
                <option value="professional" className="bg-[#0f0f1e] text-white">
                  Profissional
                </option>
              </select>
            </div>

            {/* Logout */}
            <button
              onClick={handleSignOut}
              className="flex w-full items-center justify-between p-4 text-left text-sm font-medium text-rose-400 transition hover:bg-rose-500/05"
            >
              <span>Encerrar sessão</span>
              <Icon name="arrow-right" size={16} />
            </button>
          </div>
        </>
      )}
    </section>
  );
}
