import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterSuccessContinue } from "@/components/crm/register-success-continue";
import Link from "next/link";

export default async function ContractorRegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <div className="text-xs text-muted-foreground">UBBIM</div>
          <CardTitle>Contractor registration received</CardTitle>
          <CardDescription>Your sign-in account is ready. Access stays limited until UBBIM approves your company.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            We emailed a confirmation when SMTP is configured. You can sign in now and complete your company profile and documents.
          </p>
          <RegisterSuccessContinue href="/contractor/dashboard" />
          <Link href="/contractor/login" className="mt-4 inline-block text-sm text-primary hover:underline">
            Sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}