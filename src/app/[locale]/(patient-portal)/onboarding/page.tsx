import { getTranslations } from "next-intl/server";
import { listTreatments } from "@/lib/api/treatments";
import { PatientOnboardingWizard } from "./_components/patient-onboarding-wizard";

export default async function PatientOnboardingPage() {
  const t = await getTranslations("auth");
  const treatments = await listTreatments();

  return (
    <div
      className="mx-auto flex min-h-[60vh] max-w-xl flex-col px-4 py-10"
      data-amanak-app-ui
    >
      <p className="mb-6 text-center text-xs text-muted-foreground">{t("mockNote")}</p>
      <PatientOnboardingWizard treatments={treatments} />
    </div>
  );
}
