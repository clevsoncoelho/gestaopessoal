import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ message: "Supabase não configurado." }, { status: 503 });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ message: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ message: "A conexão bancária ainda precisa das credenciais privadas da Pluggy na Vercel." }, { status: 503 });
  }

  const authResponse = await fetch("https://api.pluggy.ai/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
    cache: "no-store",
  });
  if (!authResponse.ok) return NextResponse.json({ message: "A Pluggy recusou as credenciais configuradas." }, { status: 502 });
  const { apiKey } = await authResponse.json() as { apiKey?: string };
  if (!apiKey) return NextResponse.json({ message: "A Pluggy não retornou uma chave de sessão." }, { status: 502 });

  const tokenResponse = await fetch("https://api.pluggy.ai/connect_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
    body: JSON.stringify({ clientUserId: user.id }),
    cache: "no-store",
  });
  if (!tokenResponse.ok) return NextResponse.json({ message: "Não foi possível iniciar o consentimento Open Finance." }, { status: 502 });
  const token = await tokenResponse.json() as { accessToken?: string };
  if (!token.accessToken) return NextResponse.json({ message: "A Pluggy não retornou o token de conexão." }, { status: 502 });

  return NextResponse.json({ connectToken: token.accessToken });
}
