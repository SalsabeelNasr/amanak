import { notFound } from "next/navigation";
import { getLeadById } from "@/lib/api/leads";
import { LeadDetail } from "./_components/lead-detail";

export default async function CrmLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) notFound();

  return <LeadDetail initialLead={lead} />;
}
