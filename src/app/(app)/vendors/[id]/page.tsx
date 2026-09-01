import { notFound } from "next/navigation";
import { CompanyProfile } from "@/components/crm/company-profile";
import { requireProfile } from "@/lib/auth";
import { getCompany, getCompanyRelations } from "@/lib/queries";
import type { Activity, AuditLog, Contact, CrmDocument, DocumentType, Note, Payment, Profile, Project } from "@/lib/types";

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();
  const related = await getCompanyRelations(id);
  return (
    <CompanyProfile
      kind={company.company_kind}
      company={company}
      contacts={related.contacts as Contact[]}
      documents={related.documents as CrmDocument[]}
      documentTypes={related.documentTypes as DocumentType[]}
      projects={related.projects as Project[]}
      activities={related.activities as Activity[]}
      payments={related.payments as Payment[]}
      notes={related.notes as Note[]}
      audit={related.audit as AuditLog[]}
      staff={related.staff as Profile[]}
      profile={profile}
    />
  );
}
