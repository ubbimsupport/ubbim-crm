import { redirect } from "next/navigation";

export default async function ContractorLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; reset?: string; registered?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.error) query.set("error", params.error);
  if (params.next) query.set("next", params.next);
  if (params.reset) query.set("reset", params.reset);
  if (params.registered) query.set("registered", params.registered);
  const suffix = query.toString();
  redirect(suffix ? `/login?${suffix}` : "/login");
}
