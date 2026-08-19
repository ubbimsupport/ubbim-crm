function required(name: string) {
  return process.env[name]?.trim() || undefined;
}

export function getSupabaseUrl() {
  const value = required("NEXT_PUBLIC_SUPABASE_URL");
  if (!value) return undefined;
  return value.replace(/\/+$/, "").replace(/\/rest\/v1$/i, "");
}

export function getSupabasePublishableKey() {
  return required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ?? required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function getSupabaseServiceRoleKey() {
  return required("SUPABASE_SERVICE_ROLE_KEY");
}

export function getAppUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}
