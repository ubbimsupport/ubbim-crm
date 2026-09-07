import { Skeleton } from "@/components/ui/skeleton";

export default function ContractorLoading() {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="min-h-[460px] rounded-2xl border border-slate-200 bg-white p-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-6 h-10 w-32" />
          <Skeleton className="mt-8 h-24 w-full" />
          <Skeleton className="mt-16 h-11 w-full" />
        </div>
      ))}
    </div>
  );
}
