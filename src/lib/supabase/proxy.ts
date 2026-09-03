import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { CONTRACTOR_AUTH_PATHS } from "@/lib/constants";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/env";
import { homePathForRole, isPortalRole } from "@/lib/rbac";
import type { UserRole } from "@/lib/types";

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
    const isContractorAuth = CONTRACTOR_AUTH_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    );
    const isAuthRoute =
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/reset-password") ||
      pathname.startsWith("/auth") ||
      isContractorAuth;
    const isPublicApi =
      pathname.startsWith("/api/stripe/webhook") ||
      pathname.startsWith("/api/cron");
    const contractorLogin = "/contractor/login";

    if (pathname === "/") {
      const redirect = request.nextUrl.clone();
      redirect.pathname = data?.claims ? "/dashboard" : "/login";
      return NextResponse.redirect(redirect);
    }

    if (!data?.claims && !isAuthRoute && !isPublicApi) {
      const redirect = request.nextUrl.clone();
      const next = `${pathname}${request.nextUrl.search}`;
      redirect.pathname = pathname.startsWith("/contractor/") ? contractorLogin : "/login";
      redirect.search = "";
      redirect.searchParams.set("next", next);
      return NextResponse.redirect(redirect);
    }

    if (data?.claims && (pathname === "/login" || pathname === "/forgot-password" || pathname === contractorLogin)) {
      const redirect = request.nextUrl.clone();
      const userId = data.claims.sub as string | undefined;
      let home = "/dashboard";
      if (userId) {
        const { data: profile } = await supabase
          .from("crm_profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();
        if (profile?.role) home = homePathForRole(profile.role as UserRole);
      }
      redirect.pathname = home;
      redirect.search = "";
      return NextResponse.redirect(redirect);
    }

    if (data?.claims && pathname.startsWith("/contractor/") && !isContractorAuth) {
      const userId = data.claims.sub as string | undefined;
      if (userId) {
        const { data: profile } = await supabase
          .from("crm_profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();
        if (profile?.role && profile.role !== "contractor") {
          const redirect = request.nextUrl.clone();
          redirect.pathname = homePathForRole(profile.role as UserRole);
          redirect.search = "";
          return NextResponse.redirect(redirect);
        }
      }
    }

    if (data?.claims && !isAuthRoute && !isPublicApi && !pathname.startsWith("/contractor/") && !pathname.startsWith("/user/")) {
      const userId = data.claims.sub as string | undefined;
      if (userId) {
        const { data: profile } = await supabase
          .from("crm_profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();
        if (profile?.role && isPortalRole(profile.role as UserRole)) {
          const redirect = request.nextUrl.clone();
          redirect.pathname = homePathForRole(profile.role as UserRole);
          redirect.search = "";
          return NextResponse.redirect(redirect);
        }
      }
    }

    return supabaseResponse;
  } catch (error) {
    console.error("Supabase session proxy failed", error);
    return NextResponse.next({ request });
  }
}
