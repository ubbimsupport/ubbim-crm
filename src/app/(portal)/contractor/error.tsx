"use client";

import { EmptyState } from "@/components/crm/empty-state";
import { Button } from "@/components/ui/button";

export default function ContractorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <EmptyState
      title="Unable to load this page"
      description={error.message || "Please try again."}
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}