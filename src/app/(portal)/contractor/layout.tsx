import { requireRole } from "@/lib/auth";

export default async function ContractorPortalLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["contractor"]);
  return children;
}
