import { getTranslations } from "next-intl/server";
import { listTreatments } from "@/lib/api/treatments";
import {
  getConsultantProfile,
  listAvailableSlots,
} from "@/lib/api/consultation-booking";
import { PatientOnboardingWizard } from "./_components/patient-onboarding-wizard";

export default async function PatientOnboardingPage() {
  const now = new Date();
  const from = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const to = new Date(from.getTime() + 45 * 86_400_000);

  const [t, tPortal, treatments, initialSlots, consultant] = await Promise.all([
    getTranslations("auth"),
    getTranslations("portal"),
    listTreatments(),
    listAvailableSlots({ from, to }),
    getConsultantProfile(),
  ]);

  return (
    <div
      className="mx-auto flex min-h-[80vh] w-full max-w-screen-2xl flex-col px-4 py-8 sm:px-6 lg:px-10 sm:py-12"
      data-amanak-app-ui
    >
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {tPortal("onboardingTitle")}
        </h1>
      </div>
      <PatientOnboardingWizard
        treatments={treatments}
        initialSlots={initialSlots}
        consultant={consultant}
      />
    </div>
  );
}
