"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/Icon";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      const result = isSignUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (isSignUp) {
        setMessage("Conta criada com sucesso! Verifique seu e-mail para confirmar o acesso.");
      } else {
        router.push("/");
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível concluir o acesso."
      );
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch {
      setMessage("Login social indisponível no momento.");
    }
  }

  return (
    <main className="app-shell grid min-h-dvh place-items-center px-5 py-8">
      <section className="glass w-full max-w-md rounded-[32px] p-8 shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-glow">
          <Icon name="pulse" size={28} className="text-white" />
        </div>

        <div className="mt-6 text-center">
          <p className="eyebrow">Pulse Finance</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
            {isSignUp ? "Crie sua conta" : "Bem-vindo de volta"}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Suas finanças pessoais e profissionais com clareza e ritmo.
          </p>
        </div>

        <form onSubmit={submit} className="mt-7 space-y-3.5">
          <div>
            <label className="mb-1 block text-xs text-slate-400">E-mail</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="field"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">Senha</label>
            <input
              required
              minLength={6}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo de 6 caracteres"
              className="field"
            />
          </div>

          <button disabled={busy} className="btn-primary mt-2 w-full disabled:opacity-50">
            {busy ? "Processando..." : isSignUp ? "Criar conta" : "Entrar na plataforma"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-600">
          <span className="h-px flex-1 bg-white/10" />
          <span>ou</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <button
          onClick={google}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/04 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/08"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.8l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.9C3.7 20.6 7.5 23.5 12 23.5z"
            />
          </svg>
          Continuar com Google
        </button>

        {message && (
          <p className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-center text-xs text-indigo-200">
            {message}
          </p>
        )}

        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setMessage("");
          }}
          className="mt-6 w-full text-center text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
        >
          {isSignUp ? "Já tem uma conta? Entre aqui" : "Ainda não tem conta? Crie uma agora"}
        </button>
      </section>
    </main>
  );
}
