import { notFound } from "next/navigation";
import { crm } from "@/lib/crm/client";
import { getServerCrmCtx } from "@/lib/crm/ctx";
import {
  getDefaultRequestIdForPatient,
  getPatientIdFromParam,
} from "@/lib/patient-demo";
import { PatientProfileTabs } from "./_components/patient-profile-tabs";

export default async function PatientProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ patient?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const patientId = getPatientIdFromParam(params?.patient);
  const defaultRequestId = getDefaultRequestIdForPatient(patientId) ?? "lead_1";

  let lead = await crm.requests.get(defaultRequestId, getServerCrmCtx());
  if (!lead && patientId) {
    const patientRequests = await crm.requests.list({ patientId }, getServerCrmCtx());
    lead = patientRequests[0];
  }
  if (!lead) notFound();

  const patient =
    (await crm.patients.get(lead.patientId, getServerCrmCtx())) ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-12 p-4 pb-20 sm:p-8">
      <div className="space-y-16">
        <PatientProfileTabs lead={lead} patient={patient} />
      </div>
    </div>
  );
}
