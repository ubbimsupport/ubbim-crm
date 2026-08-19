import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

const tone: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  paid: "bg-emerald-50 text-emerald-800 border-emerald-200",
  completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  expiring_soon: "bg-amber-50 text-amber-800 border-amber-200",
  on_hold: "bg-amber-50 text-amber-800 border-amber-200",
  planning: "bg-sky-50 text-sky-800 border-sky-200",
  open: "bg-sky-50 text-sky-800 border-sky-200",
  inactive: "bg-slate-100 text-slate-700 border-slate-200",
  cancelled: "bg-slate-100 text-slate-700 border-slate-200",
  expired: "bg-red-50 text-red-800 border-red-200",
  rejected: "bg-red-50 text-red-800 border-red-200",
  failed: "bg-red-50 text-red-800 border-red-200",
  refunded: "bg-purple-50 text-purple-800 border-purple-200",
  super_admin: "bg-primary/10 text-primary border-primary/20",
  admin: "bg-sky-50 text-sky-800 border-sky-200",
  staff: "bg-slate-100 text-slate-700 border-slate-200",
  management: "bg-amber-50 text-amber-900 border-amber-200",
};

export function StatusBadge({ value }: { value?: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <Badge variant="outline" className={cn("capitalize", tone[value] ?? "bg-muted")}>
      {titleCase(value)}
    </Badge>
  );
}
