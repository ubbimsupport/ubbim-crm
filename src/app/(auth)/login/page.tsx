import Link from "next/link";
import { signInAction } from "@/lib/actions/crm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured } from "@/lib/env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; reset?: string }>;
}) {
  const params = await searchParams;
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
          <form action={signInAction} className="space-y-4">
            <input type="hidden" name="next" value={params.next || "/dashboard"} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="you@ubbim.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" disabled={!isSupabaseConfigured()}>
              Sign in
            </Button>
          </form>
          <div className="mt-4 flex justify-between text-sm">
            <Link href="/forgot-password" className="text-primary hover:underline">Forgot password</Link>
            <Link href="/register" className="text-primary hover:underline">Vendor / contractor registration</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
