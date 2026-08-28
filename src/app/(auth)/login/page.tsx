import Link from "next/link";
import { LoginForm } from "@/components/crm/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; reset?: string; registered?: string }>;
}) {
  const params = await searchParams;
  const registered =
    params.registered === "1" ||
    Boolean(params.next && decodeURIComponent(params.next).includes("registered=1"));
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#0B3A5B_0%,#123A56_45%,#F4F6F8_45%)] p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <div className="text-xs font-semibold tracking-[0.25em] text-amber-700">UBBIM</div>
          <CardTitle className="text-2xl text-primary">Corporate CRM</CardTitle>
          <CardDescription>Sign in to manage vendors, contractors, documents, and payments.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isSupabaseConfigured() ? (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
              Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable authentication.
            </p>
          ) : null}
          {params.error ? (
            <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{params.error}</p>
          ) : null}
          {params.reset ? (
            <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Password updated. Please sign in.</p>
          ) : null}
          {registered ? (
            <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
              Registration submitted. Sign in to open the dashboard.
            </p>
          ) : null}
          <LoginForm next={params.next || "/dashboard"} disabled={!isSupabaseConfigured()} />
          <div className="mt-4 flex justify-between text-sm">
            <Link href="/forgot-password" className="text-primary hover:underline">Forgot password</Link>
            <Link href="/register" className="text-primary hover:underline">Vendor / contractor registration</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
