"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RegisterSuccessContinue({ href = "/dashboard?registered=1" }: { href?: string }) {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.push(href);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [router, href]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">You will be taken to the dashboard next.</p>
      <Button asChild>
        <Link href={href}>Continue to dashboard</Link>
      </Button>
    </div>
  );
}
