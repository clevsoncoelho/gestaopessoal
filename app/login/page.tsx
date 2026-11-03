"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const supabase = createClient();
      const result = isSignUp ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (isSignUp) setMessage("Conta criada. Confirme seu e-mail para entrar."); else router.push("/");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível concluir o acesso."); }
    finally { setBusy(false); }
  }

  async function google() {
    try { const supabase = createClient(); await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } }); }
    catch { setMessage("Login social indisponível no momento."); }
  }

  return <main className="app-shell grid min-h-dvh place-items-center px-5 py-8"><section className="glass w-full max-w-md rounded-[32px] p-7"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-mint to-violet text-2xl text-ink shadow-glow">◒</div><div className="mt-5 text-center"><p className="text-[10px] uppercase tracking-[.25em] text-slate-500">Pulse Finance</p><h1 className="mt-2 text-2xl font-semibold">{isSignUp ? "Crie sua conta" : "Bem-vindo de volta"}</h1><p className="mt-2 text-sm text-slate-500">Suas finanças, com clareza e ritmo.</p></div><form onSubmit={submit} className="mt-7 space-y-3"><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Seu e-mail" className="field" /><input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha (mínimo 6 caracteres)" className="field" /><button disabled={busy} className="w-full rounded-2xl bg-mint py-3 text-sm font-semibold text-ink disabled:opacity-50">{busy ? "Aguarde..." : isSignUp ? "Criar conta" : "Entrar"}</button></form><div className="my-4 flex items-center gap-3 text-[11px] text-slate-600"><span className="h-px flex-1 bg-white/10" />ou<span className="h-px flex-1 bg-white/10" /></div><button onClick={google} className="w-full rounded-2xl border border-white/10 py-3 text-sm text-slate-200">Continuar com Google</button>{message && <p className="mt-4 rounded-xl bg-amber-300/10 p-3 text-xs text-amber-100">{message}</p>}<button onClick={() => { setIsSignUp(!isSignUp); setMessage(""); }} className="mt-5 w-full text-xs text-mint">{isSignUp ? "Já tenho uma conta" : "Ainda não tenho conta"}</button></section></main>;
}
