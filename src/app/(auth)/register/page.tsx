import { createClient } from "@/lib/supabase/server";
import { RegistrationForm } from "@/components/crm/registration-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import type { Category, CompanyKind } from "@/lib/types";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; kind?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("crm_categories").select("*").eq("is_active", true);
  const categories = (data ?? []) as Category[];
  const kind: CompanyKind = params.kind === "contractor" ? "contractor" : "vendor";

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <div className="text-xs font-semibold tracking-[0.25em] text-amber-700">UBBIM</div>
          <CardTitle>Vendor / contractor registration</CardTitle>
          <CardDescription>
            Submit a company registration for UBBIM review. Choose a password so you can sign in after you submit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegistrationForm categories={categories} initialKind={kind} initialError={params.error} />
          <Link href="/login" className="mt-4 inline-block text-sm text-primary hover:underline">Already have an account? Sign in</Link>
        </CardContent>
      </Card>
    </div>
  );
}
