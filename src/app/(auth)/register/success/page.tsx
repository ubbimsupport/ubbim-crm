import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterSuccessContinue } from "@/components/crm/register-success-continue";
import Link from "next/link";

export default async function RegisterSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await searchParams;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <div className="text-xs font-semibold tracking-[0.25em] text-amber-700">UBBIM</div>
          <CardTitle>Vendor / contractor registration</CardTitle>
          <CardDescription>Submit a company registration for UBBIM review. You will receive an email confirmation.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
            Registration submitted. Our team will review your application.
          </p>
          <RegisterSuccessContinue />
          <Link href="/login" className="mt-4 inline-block text-sm text-primary hover:underline">Staff sign in</Link>
        </CardContent>
      </Card>
    </div>
  );
}
