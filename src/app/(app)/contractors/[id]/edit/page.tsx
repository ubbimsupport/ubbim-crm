import { redirect } from "next/navigation";

export default async function EditContractorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/vendors/${id}/edit`);
}
