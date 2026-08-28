import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();
  if (!url || !key) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          if (headers) {
            Object.entries(headers).forEach(([headerKey, value]) =>
              supabaseResponse.headers.set(headerKey, value),
            );
          }
        },
      },
    });

    const { data } = await supabase.auth.getClaims();
    const pathname = request.nextUrl.pathname;
    const isAuthRoute =
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/reset-password") ||
      pathname.startsWith("/auth");
    const isPublicApi =
      pathname.startsWith("/api/stripe/webhook") ||
      pathname.startsWith("/api/cron");

    if (pathname === "/") {
      const redirect = request.nextUrl.clone();
      redirect.pathname = data?.claims ? "/dashboard" : "/login";
      return NextResponse.redirect(redirect);
    }

    if (!data?.claims && !isAuthRoute && !isPublicApi) {
      const redirect = request.nextUrl.clone();
      const next = `${pathname}${request.nextUrl.search}`;
      redirect.pathname = "/login";
      redirect.search = "";
      redirect.searchParams.set("next", next);
      return NextResponse.redirect(redirect);
    }

    if (data?.claims && (pathname === "/login" || pathname === "/forgot-password")) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/dashboard";
      return NextResponse.redirect(redirect);
    }

    return supabaseResponse;
  } catch (error) {
    console.error("Supabase session proxy failed", error);
    return NextResponse.next({ request });
  }
}
