import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getLeadById } from "@/lib/api/leads";
import { PatientProfileTabs } from "./_components/patient-profile-tabs";

export default async function PatientProfilePage() {
  const tAuth = await getTranslations("auth");
  const lead = await getLeadById("lead_1");
  if (!lead) notFound();

  const firstName = lead.patientName.split(/\s+/)[0] ?? lead.patientName;

  return (
    <div className="mx-auto max-w-3xl p-4 sm:max-w-4xl sm:p-8">
      <header className="space-y-2 border-b border-border/40 pb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {tAuth("portalWelcome")}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">{tAuth("portalSubtitle")}</p>
      </header>

      <div className="pt-8">
        <PatientProfileTabs lead={lead} />
      </div>
    </div>
  );
}
