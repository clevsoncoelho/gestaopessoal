import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const isPublic = request.nextUrl.pathname === "/login" || request.nextUrl.pathname.startsWith("/api/keep-alive") || request.nextUrl.pathname.startsWith("/_next") || request.nextUrl.pathname.includes(".");
  if (!url || !key) return isPublic ? NextResponse.next() : NextResponse.redirect(new URL("/login", request.url));

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: ((values) => {
        values.forEach(({ name, value, options }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }) satisfies SetAllCookies
    }
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isPublic) return NextResponse.redirect(new URL("/login", request.url));
  if (user && request.nextUrl.pathname === "/login") return NextResponse.redirect(new URL("/", request.url));
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
