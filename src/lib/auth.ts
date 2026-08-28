import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homePathForRole } from "@/lib/rbac";
import type { Profile, UserRole } from "@/lib/types";

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
  if (!profile.is_active) redirect("/login?error=Your+account+is+inactive");
  return profile;
}

export async function requireRole(allowed: UserRole[]) {
  const profile = await requireProfile();
  if (!allowed.includes(profile.role)) {
    redirect(homePathForRole(profile.role));
  }
  return profile;
}
