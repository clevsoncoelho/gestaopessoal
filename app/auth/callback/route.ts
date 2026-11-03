import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const response = NextResponse.redirect(`${origin}/`);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!code || !url || !key) return response;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.headers.get("cookie")?.split("; ").map((item) => { const [name, ...rest] = item.split("="); return { name, value: rest.join("=") }; }) || [],
      setAll: ((values) => {
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }) satisfies SetAllCookies
    }
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  return response;
}
