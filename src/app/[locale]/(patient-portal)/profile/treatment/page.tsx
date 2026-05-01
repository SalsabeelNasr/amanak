import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { crm } from "@/lib/crm/client";
import { getServerCrmCtx } from "@/lib/crm/ctx";
import {
  getDefaultRequestIdForPatient,
  getPatientIdFromParam,
} from "@/lib/patient-demo";
import {
  getConsultantProfile,
  listAvailableSlots,
} from "@/lib/api/consultation-booking";
import { patientTreatmentTitle } from "@/lib/patient-treatment-label";
import { getPatientNextActionPlan } from "@/lib/patient-next-action";
import { ROUTES } from "@/lib/routes";
import {
  JOURNEY_STAGE_I18N_SUFFIX,
  journeyDisplayFromStatus,
} from "@/lib/lead-journey-stage";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types";
import { Badge } from "@/components/ui/badge";
import { PatientTreatmentDetailTabs } from "./_components/patient-treatment-detail-tabs";

function statusOverviewClass(status: Lead["status"]): string {
  switch (status) {
    case "lost":
      return "bg-destructive/10 text-destructive border-transparent";
    case "in_treatment":
    case "completed":
      return "bg-primary text-primary-foreground border-transparent";
    case "arrived":
    case "booking":
    case "quotation_accepted":
      return "bg-emerald-500/10 text-emerald-700 border-transparent dark:text-emerald-400";
    case "quotation_sent":
    case "changes_requested":
    case "estimate_reviewed":
    case "estimate_requested":
      return "bg-primary/10 text-primary border-transparent";
    default:
      return "bg-muted text-muted-foreground border-transparent";
  }
}

function formatDateTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PatientTreatmentDetailsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    patient?: string;
    tab?: string;
    payment?: string;
  }>;
}) {
  const t = await getTranslations("portal");
  const tTreatments = await getTranslations("treatments");
  const locale = await getLocale();
  const isRtl = locale === "ar";
  const params = searchParams ? await searchParams : undefined;
  const rawTab = params?.tab;
  const rawPayment = params?.payment;
  const initialPaymentUpload =
    rawPayment === "downpayment" || rawPayment === "remaining" ? rawPayment : null;
  const initialTab =
    initialPaymentUpload != null
      ? "files"
      : rawTab === "quotes" || rawTab === "files" || rawTab === "overview"
        ? rawTab
        : "overview";
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
  const patientClientType = patient?.clientType ?? "b2c";
  const nextActionPlan = getPatientNextActionPlan(lead, patientClientType);

  const journeyDisplay = journeyDisplayFromStatus(lead.status);
  const journeyBadgeLabel =
    journeyDisplay === "lost"
      ? t("leadJourney.closedLost")
      : t(`leadJourney.${JOURNEY_STAGE_I18N_SUFFIX[journeyDisplay]}` as Parameters<typeof t>[0]);
  const treatmentHeading = patientTreatmentTitle(lead.treatmentSlug, (key) => tTreatments(key));

  const now = new Date();
  const slotFrom = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const slotTo = new Date(slotFrom.getTime() + 45 * 86_400_000);
  const [consultationInitialSlots, consultationConsultant] = await Promise.all([
    listAvailableSlots({ from: slotFrom, to: slotTo }),
    getConsultantProfile(),
  ]);

  const backHref = patientId
    ? `${ROUTES.patientProfile}?patient=${encodeURIComponent(patientId)}`
    : ROUTES.patientProfile;

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-8">
      <header className="mb-4 flex items-center justify-between border-b border-border/40 pb-6">
        <div className="min-w-0 flex-1 pe-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {treatmentHeading}
            </h1>
            <Badge
              className={cn(
                "shrink-0 px-3 py-1 text-sm font-semibold",
                statusOverviewClass(lead.status),
              )}
            >
              {journeyBadgeLabel}
            </Badge>
          </div>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-3.5 shrink-0 opacity-70" aria-hidden />
            <span>
              {t("lastUpdated")}: {formatDateTime(lead.updatedAt, locale)}
            </span>
          </p>
        </div>
        <Link
          href={backHref}
          prefetch={false}
          className={cn(
            buttonVariants({ variant: "default" }),
            "h-10 rounded-full px-5 shadow-md shadow-primary/20 transition-all active:scale-[0.98]",
          )}
        >
          {isRtl ? (
            <ArrowRight className="me-2 size-4" aria-hidden />
          ) : (
            <ArrowLeft className="me-2 size-4" aria-hidden />
          )}
          {t("onboardingNavBack")}
        </Link>
      </header>

      <PatientTreatmentDetailTabs
        lead={lead}
        patient={patient}
        nextActionPlan={nextActionPlan}
        initialTab={initialTab}
        initialPaymentUpload={initialPaymentUpload}
        consultationInitialSlots={consultationInitialSlots}
        consultationConsultant={consultationConsultant}
      />
    </div>
  );
}
