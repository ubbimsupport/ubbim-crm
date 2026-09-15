import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

const tone: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-800",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  expiring_soon: "border-amber-200 bg-amber-50 text-amber-800",
  on_hold: "border-amber-200 bg-amber-50 text-amber-800",
  planning: "border-border bg-muted text-foreground",
  open: "border-border bg-muted text-foreground",
  inactive: "border-border bg-muted text-muted-foreground",
  cancelled: "border-border bg-muted text-muted-foreground",
  expired: "border-red-200 bg-red-50 text-red-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
  failed: "border-red-200 bg-red-50 text-red-800",
  refunded: "border-border bg-muted text-foreground",
  super_admin: "border-border bg-muted text-foreground",
  admin: "border-border bg-muted text-foreground",
  staff: "border-border bg-muted text-foreground",
  management: "border-border bg-muted text-foreground",
  user: "border-border bg-muted text-foreground",
  vendor: "border-border bg-muted text-foreground",
  contractor: "border-border bg-muted text-foreground",
  pending_review: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  in_progress: "border-border bg-muted text-foreground",
  resolved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  closed: "border-border bg-muted text-muted-foreground",
  urgent: "border-red-200 bg-red-50 text-red-800",
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-border bg-muted text-muted-foreground",
};

export function StatusBadge({ value }: { value?: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <Badge variant="outline" className={cn("capitalize", tone[value] ?? "border-border bg-muted text-foreground")}>
      {titleCase(value)}
    </Badge>
  );
}
