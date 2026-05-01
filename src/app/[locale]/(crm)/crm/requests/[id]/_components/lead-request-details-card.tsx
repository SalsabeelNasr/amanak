"use client";

import { useLocale, useTranslations } from "next-intl";
import { ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/crm/empty-state";
import { formatDate, formatDateTime } from "@/components/crm/date-format";
import { getDoctorByIdSync } from "@/lib/api/doctors";
import { getQuotationHospitalById } from "@/lib/api/quotation-catalog";
import { patientTreatmentTitle } from "@/lib/patient-treatment-label";
import type { Lead, PackageTier, ProvisionalRequest, RequestPriority } from "@/types";
import { cn } from "@/lib/utils";

function provisionalRequestHasVisibleDetails(req: ProvisionalRequest): boolean {
  const { excludedLineKeys: _e, ...rest } = req;
  return Object.values(rest).some((v) => {
    if (v == null) return false;
    if (typeof v === "boolean") return true;
    if (typeof v === "number") return true;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "string") return v.trim().length > 0;
    return false;
  });
}

function travelWindowLabel(
  start: string | undefined,
  end: string | undefined,
  locale: string,
): string | undefined {
  if (!start?.trim() && !end?.trim()) return undefined;
  if (start?.trim() && end?.trim()) {
    return `${formatDate(start, locale)} – ${formatDate(end, locale)}`;
  }
  return formatDate((start ?? end)!, locale);
}

export function LeadRequestDetailsCard({ lead }: { lead: Lead }) {
  const req = lead.provisionalRequest;
  const t = useTranslations("crm");
  const tPortal = useTranslations("portal");
  const tDoctors = useTranslations("doctors");
  const tTreatments = useTranslations("treatments");
  const locale = useLocale();

  const hasProvisionalBody = Boolean(req && provisionalRequestHasVisibleDetails(req));

  function row(key: string, label: string, value: string | undefined) {
    if (!value?.trim()) return null;
    return (
      <div
        key={key}
        className="flex gap-3 border-b border-border/50 px-4 py-3 last:border-0"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={cn("text-sm font-medium text-foreground wrap-break-word")}>{value}</p>
        </div>
      </div>
    );
  }

  function boolCell(k: string, label: string, v: boolean | undefined) {
    if (v === undefined) return null;
    return row(
      k,
      label,
      v ? t("requestDetailIncludedYes") : t("requestDetailIncludedNo"),
    );
  }

  const treatmentPreview = lead.treatmentSlug?.trim()
    ? patientTreatmentTitle(lead.treatmentSlug, (key) => tTreatments(key))
    : undefined;
  const hasCrmNotes = Boolean(lead.notes?.trim());
  const hasPipelinePriority = Boolean(lead.requestPriority);

  if (!hasProvisionalBody && !treatmentPreview && !hasCrmNotes && !hasPipelinePriority) {
    return (
      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
          <ClipboardList className="size-5 text-muted-foreground" aria-hidden />
          <h2 className="amanak-app-panel-title">{t("requestDetailsSectionTitle")}</h2>
        </div>
        <div className="p-3">
          <EmptyState icon={ClipboardList} title={t("requestDetailsEmpty")} />
        </div>
      </section>
    );
  }

  const pathLabel =
    req?.requestPath === "estimate"
      ? tPortal("carePathEstimate")
      : req?.requestPath === "talk"
        ? tPortal("carePathCallback")
        : req?.requestPath === "book"
          ? tPortal("carePathBook")
          : undefined;

  const timingLabel =
    req?.timing === "asap"
      ? tPortal("onboardingTimingValue.asap")
      : req?.timing === "one_month"
        ? tPortal("onboardingTimingValue.one_month")
        : req?.timing === "three_months"
          ? tPortal("onboardingTimingValue.three_months")
          : undefined;

  const flightIntentLabel =
    req?.flightIntent === "yes"
      ? t("requestDetailFlightIntentYes")
      : req?.flightIntent === "no"
        ? t("requestDetailFlightIntentNo")
        : req?.flightIntent === "unsure"
          ? t("requestDetailFlightIntentUnsure")
          : undefined;

  const tierLabel = req?.accommodationTier
    ? t(`packageTier.${req.accommodationTier}` as `packageTier.${PackageTier}`)
    : undefined;

  let doctorDisplay: string | undefined;
  if (req?.doctorId?.trim()) {
    const doctor = getDoctorByIdSync(req.doctorId);
    doctorDisplay = doctor
      ? tDoctors(doctor.nameKey.replace(/^doctors\./, "") as Parameters<typeof tDoctors>[0])
      : req.doctorId;
  }

  let hospitalDisplay: string | undefined;
  if (req?.hospitalId?.trim()) {
    const h = getQuotationHospitalById(req.hospitalId);
    hospitalDisplay = h ? [h.name, h.location].filter(Boolean).join(" · ") : req.hospitalId;
  }

  const treatmentDisplay = treatmentPreview;

  function pipelinePriorityLabel(p: RequestPriority | undefined): string | undefined {
    if (p === "low") return t("requestDetailPriorityLow");
    if (p === "normal") return t("requestDetailPriorityNormal");
    if (p === "hot") return t("requestDetailPriorityHot");
    return undefined;
  }

  const travelers =
    typeof req?.partySize === "number"
      ? t("requestDetailPartySizeValue", { count: req.partySize })
      : undefined;

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
        <ClipboardList className="size-5 text-muted-foreground" aria-hidden />
        <h2 className="amanak-app-panel-title">{t("requestDetailsSectionTitle")}</h2>
      </div>
      <div className="flex flex-col p-2">
        {row(
          "submittedAt",
          t("requestDetailSubmittedAt"),
          req?.submittedAt ? formatDateTime(req.submittedAt, locale) : undefined,
        )}
        {row("treatment", t("requestDetailTreatment"), treatmentDisplay)}
        {row(
          "pipelinePriority",
          t("requestDetailPipelinePriority"),
          pipelinePriorityLabel(lead.requestPriority),
        )}
        {row("doctor", t("requestDetailPreferredDoctor"), doctorDisplay)}
        {row("hospital", t("requestDetailPreferredHospital"), hospitalDisplay)}
        {row("path", t("requestDetailIntakeKind"), pathLabel)}
        {row("timing", t("requestDetailTiming"), timingLabel)}
        {row(
          "travel",
          t("requestDetailTravelWindow"),
          travelWindowLabel(req?.travelDateStart, req?.travelDateEnd, locale),
        )}
        {row("party", t("requestDetailPartySize"), travelers)}
        {row("tier", t("requestDetailAccommodationTier"), tierLabel)}
        {row("flightIntent", t("requestDetailFlightIntent"), flightIntentLabel)}
        {boolCell("incFlights", tPortal("onboardingEstimateIncludeFlights"), req?.includeFlights)}
        {boolCell(
          "incStay",
          tPortal("onboardingEstimateIncludeAccommodation"),
          req?.includeAccommodation,
        )}
        {boolCell(
          "incTransport",
          tPortal("onboardingEstimateIncludeTransport"),
          req?.includeTransport,
        )}
        {row("origin", t("requestDetailOriginRegion"), req?.originRegion)}
        {row("transportPref", t("requestDetailTransportPreference"), req?.transportPreference)}
        {row(
          "contactWin",
          tPortal("onboardingContactTime"),
          req?.preferredContactWindow?.trim(),
        )}
        {row(
          "bookingRef",
          t("requestDetailBookingRef"),
          req?.bookingReference?.trim(),
        )}
        {row("note", t("requestDetailPatientNote"), req?.freeTextNote?.trim())}
        {row("crmNotes", t("requestDetailCrmNotes"), lead.notes?.trim())}
      </div>
    </section>
  );
}
