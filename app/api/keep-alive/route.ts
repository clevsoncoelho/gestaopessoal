import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return NextResponse.json({ ok: false, error: "Supabase is not configured" }, { status: 503 });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await supabase.rpc("keep_alive");

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, service: "supabase", checkedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
