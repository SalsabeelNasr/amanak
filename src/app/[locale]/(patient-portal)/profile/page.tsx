import { notFound } from "next/navigation";
import { crm } from "@/lib/crm/client";
import { getServerCrmCtx } from "@/lib/crm/ctx";
import {
  getDefaultLeadIdForPatient,
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
  const defaultLeadId = getDefaultLeadIdForPatient(patientId) ?? "lead_1";

  let lead = await crm.leads.get(defaultLeadId, getServerCrmCtx());
  if (!lead && patientId) {
    const patientLeads = await crm.leads.list({ patientId }, getServerCrmCtx());
    lead = patientLeads[0];
  }
  if (!lead) notFound();

  return (
    <div className="mx-auto max-w-6xl space-y-12 p-4 pb-20 sm:p-8">
      <div className="space-y-16">
        <PatientProfileTabs lead={lead} />
      </div>
    </div>
  );
}
