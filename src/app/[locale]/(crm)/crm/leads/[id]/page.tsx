import { notFound } from "next/navigation";
import { getLeadConversations } from "@/lib/api/lead-conversations";
import { getLeadById, listLeads } from "@/lib/api/leads";
import { listAvailableSlots } from "@/lib/api/consultation-booking";
import { LeadDetail } from "./_components/lead-detail";

export default async function CrmLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) notFound();

  const now = new Date();
  const slotFrom = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const slotTo = new Date(slotFrom.getTime() + 45 * 86_400_000);

  const [initialConversations, otherLeads, initialConsultationSlots] =
    await Promise.all([
      getLeadConversations(id),
      listLeads({ patientId: lead.patientId }),
      listAvailableSlots({ from: slotFrom, to: slotTo }),
    ]);

  return (
    <LeadDetail
      initialLead={lead}
      initialConversations={initialConversations}
      initialConsultationSlots={initialConsultationSlots}
      otherLeads={otherLeads.filter((l) => l.id !== lead.id)}
    />
  );
}
