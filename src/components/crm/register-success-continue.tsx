"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const NEXT_PATH = "/dashboard?registered=1";

export function RegisterSuccessContinue() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.push(NEXT_PATH);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">You will be taken to the dashboard next.</p>
      <Button asChild>
        <Link href={NEXT_PATH}>Continue to dashboard</Link>
      </Button>
    </div>
  );
}
