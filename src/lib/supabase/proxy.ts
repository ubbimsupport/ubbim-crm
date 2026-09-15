import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { CONTRACTOR_AUTH_PATHS } from "@/lib/constants";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/env";
import { canAccessPath, homePathForRole, isValidRole } from "@/lib/rbac";
import type { CompanyKind, UserRole } from "@/lib/types";

async function resolveSessionHome(
  supabase: ReturnType<typeof createServerClient>,
  userId: string | undefined,
) {
  let home = "/dashboard";
  let role: UserRole | null = null;
  let companyKind: CompanyKind | null = null;
  if (!userId) return { home, role, companyKind };
  const { data: profile } = await supabase
    .from("crm_profiles")
    .select("role, company_id")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.role || !isValidRole(profile.role)) return { home, role, companyKind };
  role = profile.role as UserRole;
  if (profile.company_id) {
    const { data: company } = await supabase
      .from("crm_companies")
      .select("company_kind")
      .eq("id", profile.company_id)
      .maybeSingle();
    companyKind = (company?.company_kind as CompanyKind | undefined) ?? null;
  }
  home = homePathForRole(role, companyKind);
  return { home, role, companyKind };
}

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

    if (pathname === "/contractor/login") {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/login";
      return NextResponse.redirect(redirect);
    }

    if (pathname === "/") {
      const redirect = request.nextUrl.clone();
      if (data?.claims) {
        const userId = data.claims.sub as string | undefined;
        const { home } = await resolveSessionHome(supabase, userId);
        redirect.pathname = home;
      } else {
        redirect.pathname = "/login";
      }
      redirect.search = "";
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

    if (data?.claims && (pathname === "/login" || pathname === "/forgot-password" || pathname === "/contractor/login")) {
      const redirect = request.nextUrl.clone();
      const userId = data.claims.sub as string | undefined;
      const { home } = await resolveSessionHome(supabase, userId);
      redirect.pathname = home;
      redirect.search = "";
      return NextResponse.redirect(redirect);
    }

    if (data?.claims && !isAuthRoute && !isPublicApi) {
      const userId = data.claims.sub as string | undefined;
      if (userId) {
        const { home, role, companyKind } = await resolveSessionHome(supabase, userId);
        if (!role || !isValidRole(role)) {
          const redirect = request.nextUrl.clone();
          redirect.pathname = "/login";
          redirect.search = "";
          redirect.searchParams.set("error", "This account does not have a valid role. Contact UBBIM.");
          return NextResponse.redirect(redirect);
        }
        if (!canAccessPath(role, pathname, companyKind)) {
          const redirect = request.nextUrl.clone();
          redirect.pathname = home;
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
