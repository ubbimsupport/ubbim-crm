import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

const tone: Record<string, string> = {
  active: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  paid: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  completed: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  pending: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  expiring_soon: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  on_hold: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  planning: "border-white/10 bg-white/5 text-zinc-200",
  open: "border-white/10 bg-white/5 text-zinc-200",
  inactive: "border-white/10 bg-white/5 text-zinc-400",
  cancelled: "border-white/10 bg-white/5 text-zinc-400",
  expired: "border-red-400/20 bg-red-400/10 text-red-200",
  rejected: "border-red-400/20 bg-red-400/10 text-red-200",
  failed: "border-red-400/20 bg-red-400/10 text-red-200",
  refunded: "border-white/10 bg-white/5 text-zinc-300",
  super_admin: "border-white/15 bg-white/10 text-zinc-100",
  admin: "border-white/10 bg-white/5 text-zinc-200",
  staff: "border-white/10 bg-white/5 text-zinc-300",
  management: "border-white/10 bg-white/5 text-zinc-200",
  user: "border-white/10 bg-white/5 text-zinc-200",
  contractor: "border-white/10 bg-white/5 text-zinc-200",
  pending_review: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  approved: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  in_progress: "border-white/10 bg-white/5 text-zinc-200",
  resolved: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  closed: "border-white/10 bg-white/5 text-zinc-400",
  urgent: "border-red-400/20 bg-red-400/10 text-red-200",
  high: "border-red-400/20 bg-red-400/10 text-red-200",
  medium: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  low: "border-white/10 bg-white/5 text-zinc-400",
};

export function StatusBadge({ value }: { value?: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <Badge variant="outline" className={cn("capitalize", tone[value] ?? "border-white/10 bg-white/5 text-zinc-300")}>
      {titleCase(value)}
    </Badge>
  );
}
