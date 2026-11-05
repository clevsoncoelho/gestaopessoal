"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type FinanceContext } from "@/lib/finance";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";

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
  const [showConfigModal, setShowConfigModal] = useState(false);

  async function connectInter() {
    setConnecting(true);
    setBankMessage("Iniciando autorização segura com Open Finance...");
    try {
      const response = await fetch("/api/bank/inter/connect", { method: "POST" });
      const result = (await response.json()) as { connectToken?: string; message?: string };
      
      if (!response.ok || !result.connectToken) {
        setConnecting(false);
        setBankMessage(result.message || "Não foi possível iniciar a autorização.");
        if (response.status === 503) {
          setShowConfigModal(true);
        }
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
            setBankMessage("Banco autorizado com sucesso! A sincronização de movimentações foi habilitada."),
          onError: () =>
            setBankMessage("A autorização bancária foi cancelada ou não foi concluída."),
        });
        widget.init();
      };
      script.onerror = () => {
        setConnecting(false);
        setBankMessage("Não foi possível carregar a janela segura da Pluggy.");
      };
      document.body.appendChild(script);
    } catch {
      setConnecting(false);
      setBankMessage("Não foi possível iniciar a autorização no momento.");
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="eyebrow">open finance</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  Oficial
                </span>
              </div>
              <button
                onClick={() => setShowConfigModal(true)}
                className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300"
              >
                Como configurar?
              </button>
            </div>

            <h3 className="mt-2 text-lg font-semibold text-white">Conexão Bancária Direta (Banco Inter & Outros)</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Conecta sua conta através do protocolo oficial Open Finance da Pluggy. Seus dados de acesso e senhas
              nunca passam pelo Pulse Finance.
            </p>

            <button
              onClick={connectInter}
              disabled={connecting}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm font-semibold text-indigo-300 transition hover:bg-indigo-500/20 disabled:opacity-50"
            >
              <Icon name="pulse" size={16} />
              {connecting ? "Abrindo conexão segura..." : "Autorizar Conexão Bancária"}
            </button>

            {bankMessage && (
              <div className="mt-3 rounded-xl border border-white/08 bg-white/03 p-3 text-center text-xs text-slate-300">
                <p>{bankMessage}</p>
                {bankMessage.includes("credenciais") && (
                  <button
                    onClick={() => setShowConfigModal(true)}
                    className="mt-2 inline-block rounded-lg bg-indigo-500/20 px-3 py-1 font-semibold text-indigo-300 hover:bg-indigo-500/30"
                  >
                    Ver passo a passo de ativação
                  </button>
                )}
              </div>
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

      {/* Modal de Configuração do Open Finance */}
      {showConfigModal && (
        <Modal title="Ativação do Open Finance (Pluggy)" onClose={() => setShowConfigModal(false)}>
          <div className="space-y-4 text-xs text-slate-300">
            <p>
              Para permitir que a aplicação conecte com segurança ao seu banco via Open Finance sem expor senhas,
              é necessária uma chave gratuita da <strong>Pluggy</strong>.
            </p>

            <div className="rounded-2xl border border-white/10 bg-white/04 p-4 space-y-2.5">
              <p className="font-semibold text-white">Passo a passo rápido (gratuito):</p>
              <ol className="list-decimal pl-4 space-y-1.5 text-slate-400">
                <li>
                  Crie sua conta no painel da Pluggy em{" "}
                  <a
                    href="https://dashboard.pluggy.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 underline"
                  >
                    dashboard.pluggy.ai
                  </a>.
                </li>
                <li>Vá até a aba <strong>API Keys / Developers</strong>.</li>
                <li>Copie o <strong>Client ID</strong> e o <strong>Client Secret</strong>.</li>
                <li>
                  Na sua <strong>Vercel</strong> (em <em>Settings &gt; Environment Variables</em>) ou no arquivo{" "}
                  <code className="text-indigo-300">.env.local</code> local, adicione:
                </li>
              </ol>

              <pre className="rounded-xl bg-black/40 p-3 font-mono text-[11px] text-slate-200 select-all overflow-x-auto">
{`PLUGGY_CLIENT_ID=seu_client_id_aqui
PLUGGY_CLIENT_SECRET=seu_client_secret_aqui`}
              </pre>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/05 p-3 text-emerald-300">
              💡 <strong>Dica:</strong> Você também pode importar todas as suas movimentações de qualquer banco instantaneamente sem precisar da chave Pluggy usando a <strong>Importação de Extrato em PDF</strong> na aba Movimentos!
            </div>

            <button
              onClick={() => setShowConfigModal(false)}
              className="btn-primary w-full py-2.5 text-xs font-semibold"
            >
              Entendido
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
