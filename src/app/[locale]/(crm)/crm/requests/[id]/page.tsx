import { notFound } from "next/navigation";
import { crm } from "@/lib/crm/client";
import { getServerCrmCtx } from "@/lib/crm/ctx";
import { listAvailableSlots } from "@/lib/api/consultation-booking";
import { LeadDetail } from "./_components/lead-detail";

export default async function CrmRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = getServerCrmCtx();
  const request = await crm.requests.get(id, ctx);
  if (!request) notFound();

  const patient = await crm.patients.get(request.patientId, ctx);

  const now = new Date();
  const slotFrom = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const slotTo = new Date(slotFrom.getTime() + 45 * 86_400_000);

  const [initialConversations, otherRequests, initialConsultationSlots] =
    await Promise.all([
      crm.conversations.list(id, undefined, ctx),
      crm.requests.list({ patientId: request.patientId }, ctx),
      listAvailableSlots({ from: slotFrom, to: slotTo }),
    ]);

  return (
    <LeadDetail
      key={request.id}
      initialRequest={request}
      patient={patient}
      initialConversations={initialConversations}
      initialConsultationSlots={initialConsultationSlots}
      otherRequests={otherRequests.filter((r) => r.id !== request.id)}
    />
  );
}
