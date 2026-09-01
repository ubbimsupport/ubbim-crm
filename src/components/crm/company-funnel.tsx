import { saveFunnelAction } from "@/lib/actions/crm";
import { StatusBadge } from "@/components/crm/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FUNNEL_STAGES } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Company, FunnelEvent } from "@/lib/types";

export function CompanyFunnel({
  company,
  events,
  writable = false,
}: {
  company: Company;
  events: FunnelEvent[];
  writable?: boolean;
}) {
  const current = company.funnel_stage ?? "inquiry";
  const currentIndex = FUNNEL_STAGES.findIndex((stage) => stage.value === current);

  return (
    <div className="space-y-4 rounded-xl border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs tracking-[0.2em] text-amber-700">FUNNEL</div>
          <h2 className="text-lg font-semibold text-primary">CRM funnel</h2>
          <p className="text-sm text-muted-foreground">Save this contractor funnel on the CRM company record.</p>
        </div>
        <StatusBadge value={current} />
      </div>
      <ol className="grid gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {FUNNEL_STAGES.map((stage, index) => {
          const isCurrent = stage.value === current;
          const lost = current === "lost";
          const reached = lost
            ? stage.value === "lost"
            : index <= currentIndex && stage.value !== "lost";
          return (
            <li
              key={stage.value}
              className={cn(
                "rounded-lg border px-2 py-2 text-center text-xs",
                isCurrent
                  ? "border-primary bg-primary/5 font-semibold text-primary"
                  : reached
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "text-muted-foreground",
              )}
            >
              {stage.label}
            </li>
          );
        })}
      </ol>
      {writable ? (
        <form key={`${company.id}-${current}`} action={saveFunnelAction} className="grid gap-3 md:grid-cols-[200px_1fr_auto] md:items-end">
          <input type="hidden" name="company_id" value={company.id} />
          <div className="space-y-1">
            <Label htmlFor={`funnel-stage-${company.id}`}>Stage</Label>
            <select
              id={`funnel-stage-${company.id}`}
              name="stage"
              defaultValue={current}
              className="h-8 w-full rounded-md border bg-background px-3 text-sm"
            >
              {FUNNEL_STAGES.map((stage) => (
                <option key={stage.value} value={stage.value}>{stage.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`funnel-note-${company.id}`}>Note</Label>
            <Input id={`funnel-note-${company.id}`} name="note" placeholder="Optional note saved to CRM" />
          </div>
          <Button type="submit">Save funnel</Button>
        </form>
      ) : null}
      {events.length ? (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Saved to CRM</div>
          {events.slice(0, 8).map((event) => (
            <div key={event.id} className="rounded-lg border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={event.stage} />
                <span className="text-xs text-muted-foreground">
                  {event.creator?.full_name || "System"} · {formatDateTime(event.created_at)}
                </span>
              </div>
              {event.note ? <p className="mt-2">{event.note}</p> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No funnel history has been saved yet.</p>
      )}
    </div>
  );
}
