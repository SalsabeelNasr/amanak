import { notFound } from "next/navigation";
import { crm } from "@/lib/crm/client";
import { getServerCrmCtx } from "@/lib/crm/ctx";
import { listAvailableSlots } from "@/lib/api/consultation-booking";
import { LeadDetail } from "./_components/lead-detail";

export default async function CrmLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = getServerCrmCtx();
  const lead = await crm.leads.get(id, ctx);
  if (!lead) notFound();

  const now = new Date();
  const slotFrom = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const slotTo = new Date(slotFrom.getTime() + 45 * 86_400_000);

  const [initialConversations, otherLeads, initialConsultationSlots] =
    await Promise.all([
      crm.conversations.list(id, undefined, ctx),
      crm.leads.list({ patientId: lead.patientId }, ctx),
      listAvailableSlots({ from: slotFrom, to: slotTo }),
    ]);

  return (
    <LeadDetail
      key={lead.id}
      initialLead={lead}
      initialConversations={initialConversations}
      initialConsultationSlots={initialConsultationSlots}
      otherLeads={otherLeads.filter((l) => l.id !== lead.id)}
    />
  );
}
