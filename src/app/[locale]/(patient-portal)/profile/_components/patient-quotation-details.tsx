"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Building2, FileQuestion, Hotel, Plane, Truck, Upload } from "lucide-react";
import { getDoctorByIdSync } from "@/lib/api/doctors";
import {
  findQuotationHotelOption,
  getGroundTransportSkuById,
  getQuotationFlightOptionById,
  getQuotationHospitalById,
  getQuotationTransportProfile,
} from "@/lib/api/quotation-catalog";
import type { Patient, Quotation } from "@/types";
import { bucketPackageItemAmounts } from "@/lib/patient-quotation-package-parts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LangKey = "ar" | "en";

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  if (!value?.trim()) return null;
  return (
    <div className={cn("space-y-0.5", className)}>
      <dt className="amanak-app-field-label">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function formatUsd(amount: number, locale: string): string {
  const tag = locale === "ar" ? "ar-EG" : "en-US";
  return `$${amount.toLocaleString(tag)}`;
}

function SectionWithCost({
  icon: Icon,
  children,
  amountUsd,
  subline,
  alignCostBottom,
  locale,
}: {
  icon: typeof Building2;
  children: ReactNode;
  amountUsd: number | null;
  subline?: ReactNode;
  alignCostBottom?: boolean;
  locale: string;
}) {
  const showDash = amountUsd == null || amountUsd <= 0;
  return (
    <div className="flex gap-3 border-t border-border/30 pt-4">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-3 sm:flex-row",
          alignCostBottom ? "sm:items-end" : "sm:items-start",
        )}
      >
        <div className="min-w-0 flex-1 space-y-3">{children}</div>
        <div
          className={cn(
            "flex shrink-0 flex-col gap-0.5 sm:w-44 sm:max-w-[45%]",
            "items-end text-end sm:border-s sm:border-border/40 sm:ps-4",
          )}
        >
          {showDash ? (
            <span className="text-sm font-medium text-muted-foreground">—</span>
          ) : (
            <>
              <span className="text-sm font-bold tabular-nums text-foreground">
                {formatUsd(amountUsd, locale)}
              </span>
              {subline ? (
                <span className="max-w-[12rem] text-[11px] font-medium leading-snug text-muted-foreground">
                  {subline}
                </span>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function PatientQuotationDetails({
  quote,
  quoteStatus,
  treatmentSlug,
  clientType,
  langKey,
  locale,
  onUploadPaymentProof,
}: {
  quote: Quotation;
  quoteStatus: Quotation["status"];
  treatmentSlug: string;
  clientType: Patient["clientType"];
  langKey: LangKey;
  locale: string;
  /** Opens the upload dialog (e.g. down payment proof); no navigation. */
  onUploadPaymentProof?: () => void;
}) {
  const t = useTranslations("portal");
  const tDoctors = useTranslations("doctors");

  const itemsSum = useMemo(
    () => quote.items.reduce((sum, item) => sum + item.amountUSD, 0),
    [quote.items],
  );
  const adjustmentUsd = quote.totalUSD - itemsSum;
  const parts = useMemo(() => bucketPackageItemAmounts(quote.items), [quote.items]);
  const buildingPartUsd = parts.procedureUsd + parts.facilityUsd;

  const downpaymentUsd =
    quote.downpaymentRequired && quote.downpaymentUSD != null ? quote.downpaymentUSD : null;
  const remainingAfterDownUsd =
    downpaymentUsd != null ? Math.max(0, quote.totalUSD - downpaymentUsd) : null;

  const doctor = quote.doctorId ? getDoctorByIdSync(quote.doctorId) : undefined;
  const doctorName = doctor
    ? tDoctors(doctor.nameKey.replace(/^doctors\./, "") as Parameters<typeof tDoctors>[0])
    : undefined;

  const hospital = quote.hospitalId ? getQuotationHospitalById(quote.hospitalId) : undefined;
  const hospitalLine = hospital
    ? [hospital.name, hospital.location].filter(Boolean).join(" · ")
    : undefined;

  const hotelOption =
    quote.hospitalId && quote.hotelId
      ? findQuotationHotelOption(quote.hospitalId, quote.packageTier, quote.hotelId)
      : undefined;
  const propertyName = hotelOption?.name ?? quote.hotelName;
  const hasStayNumbers =
    typeof quote.accommodationNights === "number" || typeof quote.accommodationGuests === "number";
  const showStaySection =
    clientType === "b2c" || clientType === "g2b"
      ? Boolean(propertyName || hotelOption || hasStayNumbers)
      : Boolean(propertyName || hotelOption || hasStayNumbers);
  const corporateNoStay = clientType === "b2b" && !showStaySection;

  const flight = quote.flightOptionId ? getQuotationFlightOptionById(quote.flightOptionId) : undefined;

  const groundSku = quote.groundTransportSkuId
    ? getGroundTransportSkuById(quote.groundTransportSkuId)
    : undefined;
  const transportProfile = getQuotationTransportProfile(treatmentSlug);
  const routeCount = quote.transportRouteCount ?? transportProfile.routeCount;
  const modeLabel = quote.transportMode ?? transportProfile.modeLabel;
  const showTransportSection = Boolean(groundSku || routeCount > 0 || modeLabel);

  const transportSubline =
    groundSku && routeCount > 0
      ? t("quotationTransportCostBreakdown", {
          count: routeCount,
          rate: formatUsd(groundSku.usdPerRoute, locale),
          total: formatUsd(routeCount * groundSku.usdPerRoute, locale),
        })
      : undefined;

  /** Line items tagged as flights / coordination / post-treatment (see {@link bucketPackageItemAmounts}). */
  const flightPartUsd = parts.flightCoordUsd > 0 ? parts.flightCoordUsd : null;

  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-4 sm:px-5 space-y-5">
      <div>
        <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {t("quotationDetailsTitle")}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{t("quotationDetailsPartsHint")}</p>
      </div>

      {(doctorName || hospitalLine) && (
        <SectionWithCost icon={Building2} amountUsd={buildingPartUsd || null} locale={locale}>
          <dl className="space-y-3">
            <Field label={t("quotationDetailsDoctor")} value={doctorName} />
            <Field label={t("quotationDetailsHospital")} value={hospitalLine} />
          </dl>
        </SectionWithCost>
      )}

      {(showStaySection || corporateNoStay) && (
        <SectionWithCost
          icon={Hotel}
          amountUsd={corporateNoStay ? null : parts.accommodationUsd || null}
          locale={locale}
        >
          <dl className="space-y-3">
            {corporateNoStay ? (
              <p className="text-sm text-muted-foreground">{t("quotationStayCorporate")}</p>
            ) : (
              <>
                {propertyName ? (
                  <Field
                    label={t("quotationStayProperty")}
                    value={
                      hotelOption
                        ? `${propertyName} · ${
                            hotelOption.kind === "hotel"
                              ? t("quotationStayKind.hotel")
                              : t("quotationStayKind.apartment")
                          }`
                        : propertyName
                    }
                  />
                ) : null}
                {typeof quote.accommodationNights === "number" ? (
                  <Field
                    label={t("quotationStayNights")}
                    value={t("quotationStayNightsValue", { count: quote.accommodationNights })}
                  />
                ) : null}
                {typeof quote.accommodationGuests === "number" ? (
                  <Field
                    label={t("quotationStayGuests")}
                    value={t("quotationStayGuestsValue", { count: quote.accommodationGuests })}
                  />
                ) : null}
              </>
            )}
          </dl>
        </SectionWithCost>
      )}

      <SectionWithCost icon={Plane} amountUsd={flightPartUsd} locale={locale}>
        <dl className="space-y-3">
          {flight ? (
            <>
              <Field label={t("quotationFlightBundle")} value={flight.label[langKey]} />
              <Field label={t("quotationFlightDetail")} value={flight.detail[langKey]} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t("quotationFlightNotIncluded")}</p>
          )}
        </dl>
      </SectionWithCost>

      {showTransportSection ? (
        <SectionWithCost
          icon={Truck}
          amountUsd={parts.groundUsd || null}
          subline={transportSubline}
          alignCostBottom
          locale={locale}
        >
          <dl className="space-y-3">
            <Field label={t("quotationTransportMode")} value={modeLabel[langKey]} />
            <Field
              label={t("quotationTransportBilledRoutes")}
              value={t("quotationTransportBilledRoutesValue", { count: routeCount })}
            />
            {typeof quote.transportPackageTripPlan === "number" ? (
              <Field
                label={t("quotationTransportPackageTrips")}
                value={t("quotationTransportPackageTripsValue", {
                  count: quote.transportPackageTripPlan,
                })}
              />
            ) : null}
            {typeof quote.transportAirportRoundTrip === "boolean" ? (
              <Field
                label={t("quotationTransportAirport")}
                value={
                  quote.transportAirportRoundTrip
                    ? t("quotationTransportAirportRoundTrip")
                    : t("quotationTransportAirportOneWay")
                }
              />
            ) : null}
            {groundSku ? (
              <>
                <Field label={t("quotationTransportGroundPackage")} value={groundSku.label[langKey]} />
                <Field
                  label={t("quotationTransportPerRoute")}
                  value={t("quotationTransportPerRouteValue", {
                    amount: groundSku.usdPerRoute.toLocaleString(langKey === "ar" ? "ar-EG" : "en-US"),
                  })}
                />
              </>
            ) : null}
          </dl>
        </SectionWithCost>
      ) : null}

      {parts.unmatchedUsd > 0 ? (
        <SectionWithCost icon={FileQuestion} amountUsd={parts.unmatchedUsd} locale={locale}>
          <p className="text-sm text-muted-foreground">{t("quotationPackageOtherLineHint")}</p>
        </SectionWithCost>
      ) : null}

      <div className="space-y-4 border-t border-border/40 pt-4">
        {adjustmentUsd !== 0 ? (
          <div className="flex gap-3">
            <div className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start">
              <span className="min-w-0 flex-1 pt-0.5 text-sm text-muted-foreground">
                {t("quotationDetailsAdjustmentLine")}
              </span>
              <span
                className={cn(
                  "shrink-0 text-end text-sm font-bold tabular-nums sm:pt-0.5",
                  "sm:w-44 sm:max-w-[45%] sm:border-s sm:border-border/40 sm:ps-4",
                  adjustmentUsd < 0 ? "text-destructive" : "text-foreground",
                )}
              >
                {adjustmentUsd > 0 ? "+" : ""}
                {formatUsd(adjustmentUsd, locale)}
              </span>
            </div>
          </div>
        ) : null}

        <div className="flex gap-3">
          <div className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-start">
            <p className="amanak-app-field-label mb-0 min-w-0 flex-1 pt-0.5">{t("total")}</p>
            <p
              className={cn(
                "shrink-0 text-end text-sm font-bold tabular-nums text-primary sm:pt-0.5",
                "sm:w-44 sm:max-w-[45%] sm:border-s sm:border-border/40 sm:ps-4",
              )}
            >
              {formatUsd(quote.totalUSD, locale)}
            </p>
          </div>
        </div>

        {downpaymentUsd != null && remainingAfterDownUsd != null ? (
          <div className="grid gap-2 sm:gap-3">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/8 px-4 py-3 dark:border-sidebar-primary/35 dark:bg-sidebar-primary/15">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{t("downpayment")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("quotationDownpaymentSummaryHint")}</p>
              </div>
              <p className="shrink-0 text-lg font-bold tabular-nums text-primary">
                {formatUsd(downpaymentUsd, locale)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/8 px-4 py-3 dark:border-sidebar-primary/35 dark:bg-sidebar-primary/15">
              <span className="text-sm font-medium text-muted-foreground">
                {t("quotationRemainingPayment")}
              </span>
              <span className="shrink-0 text-base font-semibold tabular-nums text-foreground">
                {formatUsd(remainingAfterDownUsd, locale)}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {quoteStatus === "accepted" && onUploadPaymentProof ? (
        <div className="flex flex-wrap justify-end gap-2 border-t border-border/30 pt-4">
          <Button
            type="button"
            size="sm"
            className="gap-1.5 rounded-lg"
            onClick={onUploadPaymentProof}
          >
            <Upload className="size-3.5" aria-hidden />
            {t("quotationUploadProofOfPayment")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
