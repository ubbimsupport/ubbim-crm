import { requestPasswordResetAction } from "@/lib/actions/crm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function ContractorForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-xs font-semibold tracking-[0.25em] text-amber-700">UBBIM</div>
          <CardTitle>Contractor password reset</CardTitle>
        </CardHeader>
        <CardContent>
          {params.sent ? <p className="mb-4 text-sm text-emerald-700">If the account exists, a reset email has been sent.</p> : null}
          {params.error ? <p className="mb-4 text-sm text-red-700">{params.error}</p> : null}
          <form action={requestPasswordResetAction} className="space-y-4">
            <input type="hidden" name="portal" value="contractor" />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <Button type="submit" className="w-full">Send reset link</Button>
          </form>
          <Link href="/contractor/login" className="mt-4 inline-block text-sm text-primary hover:underline">
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}