import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homePathForRole, isValidRole } from "@/lib/rbac";
import type { CompanyKind, Profile, UserRole } from "@/lib/types";

export async function getProfileCompanyKind(companyId: string | null | undefined): Promise<CompanyKind | null> {
  if (!companyId) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("crm_companies").select("company_kind").eq("id", companyId).maybeSingle();
  return (data?.company_kind as CompanyKind | undefined) ?? null;
}

export async function resolveHomePath(profile: Pick<Profile, "role" | "company_id">) {
  const companyKind = await getProfileCompanyKind(profile.company_id);
  return homePathForRole(profile.role, companyKind);
}

export async function getSessionUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub as string | undefined;
  if (!sub) return { supabase, userId: null as string | null };
  return { supabase, userId: sub };
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const { supabase, userId } = await getSessionUser();
  if (!userId) return null;
  const { data } = await supabase
    .from("crm_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

export async function requireProfile() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.is_active) redirect("/login?error=" + encodeURIComponent("Your account is inactive."));
  if (!isValidRole(profile.role)) {
    redirect("/login?error=" + encodeURIComponent("This account does not have a valid role. Contact UBBIM."));
  }
  return profile;
}

export async function requireRole(allowed: UserRole[]) {
  const profile = await requireProfile();
  if (!allowed.includes(profile.role)) {
    redirect(await resolveHomePath(profile));
  }
  return profile;
}
