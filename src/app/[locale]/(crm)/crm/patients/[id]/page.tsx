import { notFound } from "next/navigation";
import { crm } from "@/lib/crm/client";
import { getServerCrmCtx } from "@/lib/crm/ctx";
import { PatientDetailTabs } from "./_components/patient-detail-tabs";

export default async function CrmPatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = getServerCrmCtx();
  const patient = await crm.patients.get(id, ctx);
  if (!patient) notFound();

  const requests = await crm.requests.list({ patientId: id }, ctx);

  return <PatientDetailTabs patient={patient} initialRequests={requests} />;
}
