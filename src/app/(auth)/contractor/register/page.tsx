import Link from "next/link";
import { ContractorRegisterForm } from "@/components/contractor/register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ContractorRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,#0B3A5B_0%,#123A56_40%,#F4F6F8_40%)] px-4 py-10">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <div className="text-xs font-semibold tracking-[0.25em] text-amber-700">UBBIM</div>
          <CardTitle>Contractor registration</CardTitle>
          <CardDescription>
            Create your contractor account. UBBIM will review the registration before full portal access is granted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContractorRegisterForm initialError={params.error} />
          <Link href="/contractor/login" className="mt-4 inline-block text-sm text-primary hover:underline">
            Already have an account? Sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}