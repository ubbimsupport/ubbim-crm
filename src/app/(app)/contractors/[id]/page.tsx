import { redirect } from "next/navigation";

export default async function ContractorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/vendors/${id}`);
}
