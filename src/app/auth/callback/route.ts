import { NextResponse } from "next/server";
import { canAccessPath, homePathForRole, isValidRole } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import type { CompanyKind, UserRole } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  const supabase = await createClient();
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  if (next === "/reset-password" || next?.startsWith("/reset-password")) {
    return NextResponse.redirect(new URL(next, origin));
  }

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const { data: profile } = await supabase
    .from("crm_profiles")
    .select("role, company_id, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent("Your account is inactive."), origin),
    );
  }
  if (!profile.role || !isValidRole(profile.role)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL(
        "/login?error=" + encodeURIComponent("This account does not have a valid role. Contact UBBIM."),
        origin,
      ),
    );
  }

  let companyKind: CompanyKind | null = null;
  if (profile.company_id) {
    const { data: company } = await supabase
      .from("crm_companies")
      .select("company_kind")
      .eq("id", profile.company_id)
      .maybeSingle();
    companyKind = (company?.company_kind as CompanyKind | undefined) ?? null;
  }

  const role = profile.role as UserRole;
  const home = homePathForRole(role, companyKind);
  const destination =
    next && next.startsWith("/") && canAccessPath(role, next, companyKind) ? next : home;

  return NextResponse.redirect(new URL(destination, origin));
}
