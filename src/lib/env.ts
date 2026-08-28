function required(name: string) {
  return process.env[name]?.trim() || undefined;
}

/** Accepts origin, protocol-relative `//host`, missing https://, or `/rest/v1` URLs. */
export function normalizeSupabaseUrl(value?: string) {
  if (!value) return undefined;
  let raw = value.trim();
  if (!raw) return undefined;
  if (raw.startsWith("//")) raw = `https:${raw}`;
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw.replace(/^\/+/, "")}`;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    return parsed.origin;
  } catch {
    return undefined;
  }
}

export function getSupabaseUrl() {
  return normalizeSupabaseUrl(required("NEXT_PUBLIC_SUPABASE_URL"));
}

export function getSupabasePublishableKey() {
  return required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ?? required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function getSupabaseServiceRoleKey() {
  return required("SUPABASE_SERVICE_ROLE_KEY") ?? required("SUPABASE_SECRET_KEY");
}

export function getAppUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://127.0.0.1:3000";
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}
