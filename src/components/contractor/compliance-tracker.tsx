import Link from "next/link";
import { Briefcase, CircleDollarSign, GraduationCap, Users } from "lucide-react";
import { cidbPermitLabel, daysUntilDate, expiryBufferPercent, specializationLines } from "@/lib/compliance-display";
import type { Company, Contractor } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ComplianceTracker({
  company,
  contractor,
  approved,
}: {
  company: Company | null;
  contractor: Contractor | null;
  approved: boolean;
}) {
  return (
    <div className="space-y-5">
      {company && !approved ? <RegistrationBanner company={company} /> : null}
      {!company ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-4 text-sm text-slate-500">
          No company is linked to this contractor profile yet.
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-3">
        <CidbLicenseCard contractor={contractor} />
        <HrdfLevyCard />
        <ComplianceIndexCard />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <EmptyModuleCard
          id="workforce"
          icon={Users}
          title="Tracked Workforce"
          description="No Kad Hijau or workforce records exist in the current registry."
        />
        <EmptyModuleCard
          id="educators"
          icon={GraduationCap}
          title="Accredited Educators"
          description="No accredited educator records exist in the current registry."
        />
      </div>
    </div>
  );
}

function RegistrationBanner({ company }: { company: Company }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
      {company.status === "rejected" ? (
        <>
          <p className="font-semibold">Your UBBIM Contractor registration has been rejected.</p>
          {company.rejection_reason ? <p className="mt-2">{company.rejection_reason}</p> : null}
        </>
      ) : company.status === "inactive" ? (
        <p className="font-semibold">Your contractor account is suspended. Contact UBBIM support.</p>
      ) : (
        <p className="font-semibold">
          Your registration is pending review. You can update your company profile and upload documents while you wait.
        </p>
      )}
    </div>
  );
}

function CidbLicenseCard({ contractor }: { contractor: Contractor | null }) {
  const permit = cidbPermitLabel(contractor?.cidb_expiry_date);
  const daysLeft = daysUntilDate(contractor?.cidb_expiry_date);
  const buffer = expiryBufferPercent(daysLeft);
  const specialisations = specializationLines({
    category: contractor?.cidb_category,
    specialization: contractor?.specialization,
  });
  const hasCidb = Boolean(
    contractor?.cidb_grade ||
      contractor?.cidb_registration_number ||
      contractor?.cidb_expiry_date ||
      specialisations.length,
  );

  return (
    <section
      id="cidb-license"
      className="flex min-h-[460px] scroll-mt-6 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
    >
      <div className="flex items-start justify-between gap-3">
        {permit ? (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-600">
            {permit}
          </span>
        ) : (
          <span />
        )}
        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Briefcase className="size-5" strokeWidth={1.75} />
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-400">Registrar: CIDB Malaysia</p>

      {contractor?.cidb_grade ? (
        <h2 className="mt-3 text-[42px] font-bold leading-none tracking-tight text-slate-900">
          CIDB {contractor.cidb_grade}
        </h2>
      ) : (
        <h2 className="mt-3 text-[32px] font-bold leading-none tracking-tight text-slate-300">CIDB</h2>
      )}

      {hasCidb ? (
        <div className="mt-5 space-y-2 text-sm">
          {contractor?.cidb_registration_number ? (
            <p>
              <span className="text-slate-500">License ID: </span>
              <span className="font-mono text-[13px] text-[#2563eb]">{contractor.cidb_registration_number}</span>
            </p>
          ) : null}
          {specialisations.length > 0 ? (
            <p className="leading-6 text-slate-600">
              <span className="text-slate-500">Specialisations: </span>
              {specialisations.join(", ")}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-5 text-sm leading-6 text-slate-400">
          No CIDB grade, licence ID, specialisation, or expiry date is stored for this company.
        </p>
      )}

      <div className="mt-auto border-t border-slate-100 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Expiration buffer</p>
        {daysLeft != null ? (
          <>
            <p
              className={cn(
                "mt-2 text-[28px] font-bold leading-none",
                daysLeft < 0 ? "text-red-500" : daysLeft <= 90 ? "text-orange-500" : "text-orange-500",
              )}
            >
              {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} Days left`}
            </p>
            {buffer != null ? (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full rounded-full", daysLeft < 0 ? "bg-red-400" : "bg-orange-400")}
                  style={{ width: `${buffer}%` }}
                />
              </div>
            ) : null}
            <p className="mt-3 text-xs text-slate-400">
              Validity expiry checked ({contractor?.cidb_expiry_date})
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-400">No CIDB expiry date is stored.</p>
        )}

        <Link
          href="/contractor/company"
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#111827] text-sm font-medium text-white transition-colors hover:bg-black"
        >
          Modify Credentials
        </Link>
      </div>
    </section>
  );
}

function HrdfLevyCard() {
  return (
    <section
      id="hrdf-levy"
      className="flex min-h-[460px] scroll-mt-6 flex-col rounded-2xl bg-[#2b1d6b] p-6 text-white shadow-[0_8px_24px_rgba(43,29,107,0.18)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-white/90">
            HRDF Levy Compliance Fund
          </h2>
          <p className="mt-2 text-sm text-white/60">Pembangunan Sumber Manusia Berhad (HRD Corp)</p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/10">
          <CircleDollarSign className="size-5" strokeWidth={1.75} />
        </div>
      </div>

      <div className="mt-10 flex flex-1 flex-col justify-center">
        <p className="text-sm leading-6 text-white/70">
          No HRDF levy, claims disbursed, or claimable balance fields exist in the current registry.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-white/10 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">Claims disbursed</p>
            <p className="mt-2 text-lg font-semibold text-white/35">—</p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">Claimable balance</p>
            <p className="mt-2 text-lg font-semibold text-white/35">—</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComplianceIndexCard() {
  return (
    <section
      id="compliance-index"
      className="flex min-h-[460px] scroll-mt-6 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
    >
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Compliance Index</h2>
        <p className="mt-1 text-sm text-slate-400">Real-time Malaysian statutory score</p>
      </div>
      <div className="mt-8 flex flex-1 flex-col justify-center">
        <p className="text-[42px] font-bold leading-none text-slate-200">— / 100</p>
        <p className="mt-5 text-sm leading-6 text-slate-400">
          No compliance score, risk level, or monthly index history is stored in the current registry.
        </p>
      </div>
    </section>
  );
}

function EmptyModuleCard({
  id,
  icon: Icon,
  title,
  description,
}: {
  id: string;
  icon: typeof Users;
  title: string;
  description: string;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
          <Icon className="size-5" strokeWidth={1.75} />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-400">{description}</p>
    </section>
  );
}
