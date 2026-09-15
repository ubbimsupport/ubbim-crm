import { getProfileCompanyKind, requireRole, resolveHomePath } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function VendorPortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["user"]);
  const companyKind = await getProfileCompanyKind(profile.company_id);
  if (companyKind !== "vendor") redirect(await resolveHomePath(profile));
  return children;
}
