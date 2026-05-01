"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogShell } from "@/components/crm/dialog-shell";
import {
  createQuotationWizardHospitalStepSchema,
  createQuotationWizardSaveSchema,
  quotationWizardDoctorStepSchema,
  type QuotationWizardStep,
} from "@/lib/crm/schemas/quotation";
import { getDoctorsByIds } from "@/lib/api/doctors";
import {
  findQuotationHotelOption,
  getGroundTransportSkuById,
  getQuotationFlightOptionById,
  getQuotationHospitalAreaZone,
  getQuotationTransportProfile,
  listGroundTransportSkus,
  listQuotationDoctorIds,
  listQuotationDoctorIdsForHospital,
  listQuotationFlightOptions,
  listQuotationHospitalsForDoctor,
  listQuotationHospitalsForTreatment,
  listQuotationHotelsForHospital,
} from "@/lib/api/quotation-catalog";
import { inferCountryBandFromCountry } from "@/lib/infer-country-band";
import { crm } from "@/lib/crm/client";
import {
  computeQuotationAccommodationNights,
  computeQuotationOutCommissionUsd,
  getCrmSettingsSync,
  getQuotedTripRecommendation,
} from "@/lib/api/crm-settings";
import {
  buildQuotationPricing,
  previewQuotationAccommodationUsd,
  previewQuotationHospitalFacilityUsd,
  previewQuotationProcedureUsd,
} from "@/lib/quotation-price-engine";
import type { Lead, LeadStatus, PackageTier, Patient } from "@/types";
import type { Doctor } from "@/types";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Building2,
  Hotel,
  Home,
  Truck,
  Info,
  MapPin,
  Plane,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatUSD } from "@/components/crm/money";
import { useLangKey } from "@/components/crm/use-lang-key";

/** Fixed tier for pricing/catalog lookups now that optional package tiers are gone from the wizard. */
const DEFAULT_QUOTATION_PACKAGE_TIER: PackageTier = "normal";

const BLOCKED_STATUSES: LeadStatus[] = [
  "new",
  "interested",
  "estimate_requested",
  "lost",
  "completed",
];

function hasOpenPrepareQuotation(lead: Lead): boolean {
  return lead.tasks.some(
    (t) => t.templateKey === "prepare_quotation" && !t.completed,
  );
}

export function leadCanCreateQuotation(lead: Lead): boolean {
  if (hasOpenPrepareQuotation(lead)) return true;
  return !BLOCKED_STATUSES.includes(lead.status);
}

const DEFAULT_GROUND_TRANSPORT_ID = listGroundTransportSkus()[0]?.id ?? "gnd_standard";

const ACC_MAX_NIGHTS = 60;
const ACC_MAX_GUESTS = 8;
const PACKAGE_TRIP_MAX = 40;

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function useWizardSteps(skipHotel: boolean): QuotationWizardStep[] {
  return useMemo(() => {
    const s: QuotationWizardStep[] = ["doctorHospital"];
    if (!skipHotel) s.push("hotel");
    s.push("flight", "transport", "review");
    return s;
  }, [skipHotel]);
}

type Props = {
  lead: Lead;
  patient?: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (lead: Lead) => void;
};

export function LeadQuotationWizardDialog({
  lead,
  patient,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const t = useTranslations("crm.requestQuotation");
  const tDoctors = useTranslations("doctors");
  const locale = useLocale();
  const langKey = useLangKey();
  const isRtl = locale === "ar";

  const clientType = patient?.clientType ?? "b2c";
  const patientCountry = patient?.country ?? "";
  const skipHotel = clientType === "b2b" || clientType === "g2b";
  const steps = useWizardSteps(skipHotel);
  const packageTier = DEFAULT_QUOTATION_PACKAGE_TIER;

  const [stepIndex, setStepIndex] = useState(0);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const outCommissionPct = useMemo(() => {
    const r = getCrmSettingsSync().quotationRules;
    return {
      doctor: Math.min(100, Math.max(0, Number(r.doctorOutCommissionPercent) || 0)),
      hospital: Math.min(100, Math.max(0, Number(r.hospitalOutCommissionPercent) || 0)),
    };
  }, []);

  const [hotelId, setHotelId] = useState<string | null>(null);
  const [flightOptionId, setFlightOptionId] = useState<string | null>(null);
  const [includeAccommodation, setIncludeAccommodation] = useState(true);
  const [includeFlights, setIncludeFlights] = useState(true);
  const [includeGroundTransport, setIncludeGroundTransport] = useState(true);
  const [groundTransportSkuId, setGroundTransportSkuId] = useState<string | null>(
    DEFAULT_GROUND_TRANSPORT_ID,
  );
  const [stayFilter, setStayFilter] = useState<"all" | "hotel" | "apartment">("all");
  const [accommodationNights, setAccommodationNights] = useState(7);
  const [accommodationGuests, setAccommodationGuests] = useState(2);
  const [packageTripCount, setPackageTripCount] = useState(6);
  const [airportGroundRoundTrip, setAirportGroundRoundTrip] = useState(true);
  const [doctorOptions, setDoctorOptions] = useState<Doctor[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const prevOpenRef = useRef(false);

  const resetWizard = useCallback(() => {
    setStepIndex(0);
    setDoctorId(null);
    setHospitalId(null);
    setHotelId(null);
    setFlightOptionId(null);
    setIncludeAccommodation(true);
    setIncludeFlights(true);
    setIncludeGroundTransport(true);
    setGroundTransportSkuId(DEFAULT_GROUND_TRANSPORT_ID);
    setStayFilter("all");
    setAccommodationNights(
      computeQuotationAccommodationNights(
        lead.treatmentSlug,
        DEFAULT_QUOTATION_PACKAGE_TIER,
        "metro",
      ),
    );
    setPackageTripCount(getQuotedTripRecommendation(lead.treatmentSlug, "metro"));
    setAirportGroundRoundTrip(true);
    setAccommodationGuests(2);
    setValidationError(null);
    setSaveError(null);
    const ids = listQuotationDoctorIds(
      lead.treatmentSlug,
      DEFAULT_QUOTATION_PACKAGE_TIER,
    );
    void getDoctorsByIds(ids).then(setDoctorOptions);
  }, [lead.treatmentSlug]);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      resetWizard();
    }
    prevOpenRef.current = open;
  }, [open, resetWizard]);

  const transportBase = useMemo(
    () => getQuotationTransportProfile(lead.treatmentSlug),
    [lead.treatmentSlug],
  );

  const quotationAreaZone = useMemo(
    () => (hospitalId ? getQuotationHospitalAreaZone(hospitalId) : "metro"),
    [hospitalId],
  );

  const recommendedTripCount = useMemo(
    () => getQuotedTripRecommendation(lead.treatmentSlug, quotationAreaZone),
    [lead.treatmentSlug, quotationAreaZone],
  );

  const recommendedAccommodationNights = useMemo(
    () =>
      computeQuotationAccommodationNights(
        lead.treatmentSlug,
        packageTier,
        quotationAreaZone,
      ),
    [lead.treatmentSlug, packageTier, quotationAreaZone],
  );

  useEffect(() => {
    if (!hospitalId) return;
    const z = getQuotationHospitalAreaZone(hospitalId);
    setPackageTripCount(getQuotedTripRecommendation(lead.treatmentSlug, z));
    setAccommodationNights(
      computeQuotationAccommodationNights(
        lead.treatmentSlug,
        packageTier,
        z,
      ),
    );
  }, [hospitalId, lead.treatmentSlug, packageTier]);

  const billedTransportRoutes = useMemo(() => {
    const n = clampInt(packageTripCount, 1, PACKAGE_TRIP_MAX);
    return airportGroundRoundTrip ? n : Math.max(1, n - 1);
  }, [packageTripCount, airportGroundRoundTrip]);

  const transportPricing = useMemo(
    () => ({
      ...transportBase,
      routeCount: billedTransportRoutes,
    }),
    [transportBase, billedTransportRoutes],
  );

  const flightCountryBand = useMemo(
    () => inferCountryBandFromCountry(patientCountry),
    [patientCountry],
  );

  const flightOptions = useMemo(
    () => listQuotationFlightOptions(flightCountryBand),
    [flightCountryBand],
  );

  const hospitalsForPick = useMemo(() => {
    if (doctorId) return listQuotationHospitalsForDoctor(doctorId);
    return listQuotationHospitalsForTreatment(lead.treatmentSlug, packageTier);
  }, [doctorId, lead.treatmentSlug, packageTier]);

  const doctorsForPick = useMemo(() => {
    if (hospitalId) {
      const allowed = new Set(
        listQuotationDoctorIdsForHospital(
          hospitalId,
          lead.treatmentSlug,
          packageTier,
        ),
      );
      return doctorOptions.filter((d) => allowed.has(d.id));
    }
    return doctorOptions;
  }, [
    hospitalId,
    doctorOptions,
    lead.treatmentSlug,
    packageTier,
  ]);

  const hotels = useMemo(() => {
    if (!hospitalId) return [];
    return listQuotationHotelsForHospital(hospitalId, packageTier);
  }, [hospitalId, packageTier]);

  const filteredStayOptions = useMemo(() => {
    if (stayFilter === "all") return hotels;
    return hotels.filter((h) => h.kind === stayFilter);
  }, [hotels, stayFilter]);

  const selectedHotelOption = useMemo(() => {
    if (!hospitalId || !hotelId) return null;
    return findQuotationHotelOption(hospitalId, packageTier, hotelId) ?? null;
  }, [hospitalId, packageTier, hotelId]);

  const selectedFlightOption = useMemo(
    () => (flightOptionId ? getQuotationFlightOptionById(flightOptionId) : null),
    [flightOptionId],
  );

  const selectedGroundSku = useMemo(() => {
    if (!includeGroundTransport) return null;
    const id = groundTransportSkuId ?? DEFAULT_GROUND_TRANSPORT_ID;
    return getGroundTransportSkuById(id) ?? listGroundTransportSkus()[0];
  }, [groundTransportSkuId, includeGroundTransport]);

  const pricing = useMemo(() => {
    return buildQuotationPricing({
      treatmentSlug: lead.treatmentSlug,
      packageTier,
      doctorId: doctorId ?? undefined,
      hospitalId: hospitalId ?? undefined,
      hotel:
        includeAccommodation && selectedHotelOption
          ? {
              id: selectedHotelOption.id,
              name: selectedHotelOption.name,
              pricePerNightUSD: selectedHotelOption.pricePerNightUSD,
              nights: accommodationNights,
              guests: accommodationGuests,
              includedGuests: selectedHotelOption.includedGuests,
              guestSurchargePerNightUSD:
                selectedHotelOption.guestSurchargePerNightUSD,
              kind: selectedHotelOption.kind,
            }
          : null,
      flight:
        includeFlights && selectedFlightOption
          ? {
              id: selectedFlightOption.id,
              label: selectedFlightOption.label,
              priceUSD: selectedFlightOption.priceUSD,
            }
          : null,
      groundTransport: selectedGroundSku
        ? {
            id: selectedGroundSku.id,
            label: selectedGroundSku.label,
            usdPerRoute: selectedGroundSku.usdPerRoute,
          }
        : null,
      includeGroundTransport,
      clientType,
      transport: transportPricing,
      transportAirportRoundTrip: airportGroundRoundTrip,
      quoteAreaZone: quotationAreaZone,
    });
  }, [
    lead.treatmentSlug,
    clientType,
    packageTier,
    quotationAreaZone,
    doctorId,
    hospitalId,
    selectedHotelOption,
    accommodationNights,
    accommodationGuests,
    includeAccommodation,
    selectedFlightOption,
    includeFlights,
    selectedGroundSku,
    includeGroundTransport,
    transportPricing,
    airportGroundRoundTrip,
  ]);

  const currentStep = steps[stepIndex] ?? "doctorHospital";

  const goNext = useCallback(() => {
    setValidationError(null);
    if (currentStep === "doctorHospital") {
      if (!quotationWizardDoctorStepSchema.safeParse({ doctorId }).success) {
        setValidationError(t("validationDoctor"));
        return;
      }
      const corporate = clientType === "b2b" || clientType === "g2b";
      const hSchema = createQuotationWizardHospitalStepSchema(
        corporate,
        t("validationHospitalCorporate"),
      );
      const hr = hSchema.safeParse({ hospitalId });
      if (!hr.success) {
        setValidationError(
          hr.error.issues[0]?.message ?? t("validationHospitalCorporate"),
        );
        return;
      }
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [currentStep, doctorId, hospitalId, clientType, steps.length, t]);

  const goBack = useCallback(() => {
    setValidationError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const skipHospitalChoice = useCallback(() => {
    setValidationError(null);
    setHospitalId(null);
    setHotelId(null);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [steps.length]);

  const skipHotelStep = useCallback(() => {
    setValidationError(null);
    setIncludeAccommodation(false);
    setHotelId(null);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [steps.length]);

  const skipFlightStep = useCallback(() => {
    setValidationError(null);
    setIncludeFlights(false);
    setFlightOptionId(null);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [steps.length]);

  const skipTransportStep = useCallback(() => {
    setValidationError(null);
    setIncludeGroundTransport(false);
    setGroundTransportSkuId(null);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [steps.length]);

  const handleSave = useCallback(async () => {
    if (!pricing) return;
    const corporate = clientType === "b2b" || clientType === "g2b";
    const saveSchema = createQuotationWizardSaveSchema(
      corporate,
      t("validationHospitalCorporate"),
    );
    const parsed = saveSchema.safeParse({
      packageTier,
      doctorId,
      hospitalId,
    });
    if (!parsed.success) {
      const p0 = String(parsed.error.issues[0]?.path[0] ?? "");
      if (p0 === "doctorId")
        setValidationError(t("validationDoctor"));
      else
        setValidationError(
          parsed.error.issues[0]?.message ?? t("validationHospitalCorporate"),
        );
      return;
    }
    const { packageTier: tier, doctorId: docId, hospitalId: hospId } =
      parsed.data;
    setSaveError(null);
    setSaving(true);
    try {
      const hotelOpt =
        hospId && tier && hotelId
          ? findQuotationHotelOption(hospId, tier, hotelId)
          : null;
      const updated = await crm.requests.createDraftQuotation(
        lead.id,
        {
          packageTier: tier,
          doctorId: docId,
          hospitalId: hospId ?? undefined,
          hotelId: hotelOpt?.id,
          hotelName: hotelOpt?.name,
          flightOptionId: flightOptionId ?? undefined,
          accommodationNights:
            includeAccommodation && hotelOpt ? accommodationNights : undefined,
          accommodationGuests:
            includeAccommodation && hotelOpt ? accommodationGuests : undefined,
          groundTransportSkuId: includeGroundTransport
            ? selectedGroundSku?.id
            : undefined,
          transportMode: transportBase.modeLabel,
          transportRouteCount: includeGroundTransport
            ? billedTransportRoutes
            : 0,
          transportPackageTripPlan: includeGroundTransport
            ? packageTripCount
            : undefined,
          transportAirportRoundTrip: includeGroundTransport
            ? airportGroundRoundTrip
            : undefined,
          items: pricing.items,
          totalUSD: pricing.totalUSD,
          downpaymentRequired: pricing.downpaymentRequired,
          downpaymentUSD: pricing.downpaymentUSD,
          termsAndConditions: pricing.termsAndConditions,
        },
        {},
      );
      onSaved(updated);
      onOpenChange(false);
    } catch {
      setSaveError(t("errorSave"));
    } finally {
      setSaving(false);
    }
  }, [
    doctorId,
    hospitalId,
    hotelId,
    flightOptionId,
    accommodationNights,
    accommodationGuests,
    includeGroundTransport,
    includeAccommodation,
    lead.id,
    clientType,
    packageTier,
    pricing,
    billedTransportRoutes,
    packageTripCount,
    airportGroundRoundTrip,
    transportBase,
    selectedGroundSku,
    onOpenChange,
    onSaved,
    t,
  ]);

  const stepLabel = (step: QuotationWizardStep): string => {
    switch (step) {
      case "doctorHospital":
        return t("stepDoctorHospital");
      case "hotel":
        return t("stepHotel");
      case "flight":
        return t("stepFlight");
      case "transport":
        return t("stepTransport");
      case "review":
        return t("stepReview");
    }
  };

  const dir = locale === "ar" ? "rtl" : "ltr";

  const areaZoneUiLabel =
    quotationAreaZone === "coastal"
      ? t("zoneCoastal")
      : quotationAreaZone === "resort"
        ? t("zoneResort")
        : t("zoneMetro");

  return (
    <DialogShell open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={dir}
        size="xl"
        layout="scrollableTall"
        className="flex min-h-0 w-full max-w-[calc(100vw-2rem)] flex-col sm:max-h-[min(92vh,calc(100dvh-1.5rem))] sm:max-w-[min(96rem,calc(100vw-2rem))] sm:min-h-[min(85vh,56rem)]"
      >
        <DialogHeader className="border-b border-border pb-4 pe-14 sm:pe-16">
          <div className="flex items-center justify-between gap-6">
            <div className="min-w-0 flex-1">
              <DialogTitle>{t("modalTitle")}</DialogTitle>
              <DialogDescription>{t("modalDescription")}</DialogDescription>
            </div>
            {pricing && (
              <div className="flex shrink-0 flex-col items-end gap-0.5 me-2 sm:me-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t("reviewTotal")}
                </span>
                <span className="text-lg font-bold text-primary tabular-nums">
                  {formatUSD(pricing.totalUSD, locale)}
                </span>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Horizontal Stepper - More Subtle */}
        <div className="px-6 py-4 border-b border-border overflow-x-auto scrollbar-hide">
          <nav aria-label={t("stepperAria")}>
            <ol className="flex items-center gap-2 sm:gap-4">
              {steps.map((s, i) => {
                const done = i < stepIndex;
                const active = i === stepIndex;
                return (
                  <li key={s} className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <button
                      onClick={() => i < stepIndex && setStepIndex(i)}
                      disabled={i >= stepIndex}
                      className={cn(
                        "flex items-center gap-2 transition-all text-start",
                        active ? "text-primary" : 
                        done ? "text-foreground hover:text-primary" : "text-muted-foreground/40 cursor-not-allowed"
                      )}
                    >
                      <div className={cn(
                        "size-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 border",
                        active ? "bg-primary border-primary text-primary-foreground" : 
                        done ? "border-primary text-primary" : "border-border text-muted-foreground"
                      )}>
                        {done ? <Check className="size-3.5" /> : i + 1}
                      </div>
                      <span className={cn(
                        "text-sm font-medium hidden sm:inline",
                        active ? "text-foreground" : done ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {stepLabel(s)}
                      </span>
                    </button>
                    {i < steps.length - 1 && (
                      <div className="w-4 sm:w-8 h-px bg-border" />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        <DialogBody className="flex min-h-0 flex-1 flex-col space-y-0 py-0">
          <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 py-6 lg:flex-row lg:items-stretch lg:gap-6">
            <div
              className={cn(
                "animate-in fade-in slide-in-from-bottom-2 min-h-[22rem] flex-1 overflow-y-auto duration-300 md:min-h-[28rem] lg:min-h-[32rem] lg:max-h-[min(52vh,28rem)] xl:max-h-[min(58vh,34rem)]",
                "space-y-6",
              )}
            >
          {validationError || saveError ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex gap-2 items-center text-destructive">
              <Info className="size-4 shrink-0" />
              <p className="text-xs font-medium">{validationError || saveError}</p>
            </div>
          ) : null}

            {currentStep === "doctorHospital" && (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">{t("doctorHospitalLead")}</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t("subsectionDoctor")}</p>
                    <p className="text-xs text-muted-foreground">{t("doctorHint")}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:gap-3 lg:grid-cols-2">
                    {doctorsForPick.map((d) => {
                      const procedureUsd = previewQuotationProcedureUsd(
                        lead.treatmentSlug,
                        packageTier,
                        d.id,
                      );
                      const commissionDoc = computeQuotationOutCommissionUsd(
                        procedureUsd,
                        outCommissionPct.doctor,
                      );
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setDoctorId(d.id);
                            setHospitalId((prev) => {
                              const ok = listQuotationHospitalsForDoctor(d.id).some((h) => h.id === prev);
                              return ok ? prev : null;
                            });
                            setHotelId(null);
                            setIncludeAccommodation(true);
                          }}
                          className={cn(
                            "flex min-h-[3.75rem] items-center gap-3 rounded-xl border-2 p-3 text-start transition-all sm:min-h-[4rem]",
                            doctorId === d.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                              : "border-border hover:border-primary/35",
                          )}
                        >
                          <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                            {d.image ? (
                              <Image src={d.image} alt="" fill className="object-cover" />
                            ) : (
                              <div className="flex size-full items-center justify-center bg-primary/5 text-sm font-bold text-primary">
                                {tDoctors(
                                  d.nameKey.replace(
                                    /^doctors\./,
                                    "",
                                  ) as Parameters<typeof tDoctors>[0],
                                ).charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {tDoctors(
                                d.nameKey.replace(
                                  /^doctors\./,
                                  "",
                                ) as Parameters<typeof tDoctors>[0],
                              )}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {tDoctors(
                                d.titleKey.replace(
                                  /^doctors\./,
                                  "",
                                ) as Parameters<typeof tDoctors>[0],
                              )}
                            </p>
                          </div>
                          <div className="flex max-w-[10rem] shrink-0 flex-col items-end gap-0.5 text-end">
                            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              {t("previewProcedure")}
                            </span>
                            <span className="text-sm font-bold tabular-nums text-primary">
                              {formatUSD(procedureUsd, locale)}
                            </span>
                            {outCommissionPct.doctor > 0 && commissionDoc > 0 ? (
                              <span className="max-w-[10rem] text-[10px] font-medium leading-tight tabular-nums text-emerald-700 dark:text-emerald-400">
                                {t("outCommissionLine", { percent: outCommissionPct.doctor })}{" "}
                                {formatUSD(commissionDoc, locale)}
                              </span>
                            ) : null}
                          </div>
                          {doctorId === d.id ? <Check className="size-4 shrink-0 text-primary" /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 border-t border-border/60 pt-5">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t("subsectionHospital")}</p>
                    <p className="text-xs text-muted-foreground">{t("hospitalHint")}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:gap-3 lg:grid-cols-2">
                    {hospitalsForPick.map((h) => {
                      const facilityUsd = previewQuotationHospitalFacilityUsd(packageTier, h.id);
                      const commissionHosp = computeQuotationOutCommissionUsd(
                        facilityUsd,
                        outCommissionPct.hospital,
                      );
                      return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => {
                          setHospitalId(h.id);
                          setDoctorId((prev) => {
                            const allowed = listQuotationDoctorIdsForHospital(
                              h.id,
                              lead.treatmentSlug,
                              packageTier,
                            );
                            if (prev && allowed.includes(prev)) return prev;
                            return null;
                          });
                          setHotelId(null);
                          setIncludeAccommodation(true);
                        }}
                        className={cn(
                          "flex min-h-[3.75rem] items-center gap-3 rounded-xl border-2 p-3 text-start transition-all sm:min-h-[4rem]",
                          hospitalId === h.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-border hover:border-primary/35",
                        )}
                      >
                        <div
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-full border",
                            hospitalId === h.id
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-muted/50 text-muted-foreground",
                          )}
                        >
                          <Building2 className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold leading-tight text-foreground">
                            {h.name}
                          </p>
                          {h.location ? (
                            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MapPin className="size-3 shrink-0" />
                              <span className="truncate">{h.location}</span>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex max-w-[10rem] shrink-0 flex-col items-end gap-0.5 text-end">
                          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            {t("previewFacility")}
                          </span>
                          <span className="text-sm font-bold tabular-nums text-primary">
                            {formatUSD(facilityUsd, locale)}
                          </span>
                          {outCommissionPct.hospital > 0 && commissionHosp > 0 ? (
                            <span className="max-w-[10rem] text-[10px] font-medium leading-tight tabular-nums text-emerald-700 dark:text-emerald-400">
                              {t("outCommissionLine", { percent: outCommissionPct.hospital })}{" "}
                              {formatUSD(commissionHosp, locale)}
                            </span>
                          ) : null}
                        </div>
                        {hospitalId === h.id ? <Check className="size-4 shrink-0 text-primary" /> : null}
                      </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {currentStep === "hotel" && (
              <div className="space-y-5">
                <p className="text-sm font-semibold text-foreground">{t("hotelHint")}</p>

                <div className="grid gap-4 rounded-xl border border-border bg-muted/10 p-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="acc-nights" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("nightsLabel")}
                    </Label>
                    <Input
                      id="acc-nights"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={ACC_MAX_NIGHTS}
                      value={accommodationNights}
                      onChange={(e) => {
                        const raw = Number.parseInt(e.target.value, 10);
                        if (!Number.isFinite(raw)) return;
                        setAccommodationNights(
                          Math.min(ACC_MAX_NIGHTS, Math.max(1, raw)),
                        );
                      }}
                      className="max-w-[9rem]"
                    />
                    <p className="text-[11px] text-muted-foreground">{t("nightsHint")}</p>
                    <p className="text-[11px] font-medium leading-snug text-primary">
                      {t("recommendedNightsFromRules", {
                        nights: recommendedAccommodationNights,
                        zoneLabel: areaZoneUiLabel,
                      })}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="acc-guests"
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      <Users className="size-3.5 opacity-70" aria-hidden />
                      {t("guestsLabel")}
                    </Label>
                    <select
                      id="acc-guests"
                      value={accommodationGuests}
                      onChange={(e) =>
                        setAccommodationGuests(
                          clampInt(Number.parseInt(e.target.value, 10) || 1, 1, ACC_MAX_GUESTS),
                        )
                      }
                      className={cn(
                        "h-9 w-full max-w-[12rem] rounded-lg border border-input bg-background px-2.5 text-sm shadow-xs outline-none",
                        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                      )}
                    >
                      {Array.from({ length: ACC_MAX_GUESTS }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-muted-foreground">{t("guestsHint")}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: "all" as const, label: t("stayFilterAll") },
                      { id: "hotel" as const, label: t("stayFilterHotels") },
                      { id: "apartment" as const, label: t("stayFilterApartments") },
                    ]
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setStayFilter(f.id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                        stayFilter === f.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIncludeAccommodation(false);
                      setHotelId(null);
                    }}
                    className={cn(
                      "relative flex min-h-[7rem] flex-col items-start justify-between rounded-xl border-2 p-4 text-start transition-all",
                      !includeAccommodation && !hotelId
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-dashed border-border hover:bg-muted/30",
                    )}
                  >
                    {!includeAccommodation && !hotelId ? (
                      <Check className="absolute end-3 top-3 size-4 text-primary" />
                    ) : null}
                    <Hotel className="size-5 text-muted-foreground" />
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-foreground">{t("optNoneHotel")}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{t("optNoneHotelHint")}</p>
                    </div>
                  </button>
                  {filteredStayOptions.length === 0 ? (
                    <p className="col-span-full text-sm text-muted-foreground sm:col-span-2">
                      {t("stayFilterEmpty")}
                    </p>
                  ) : null}
                  {filteredStayOptions.map((h) => {
                    const KindIcon = h.kind === "apartment" ? Home : Hotel;
                    const est = previewQuotationAccommodationUsd(
                      h,
                      accommodationNights,
                      accommodationGuests,
                    );
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => {
                          setIncludeAccommodation(true);
                          setHotelId(h.id);
                        }}
                        className={cn(
                          "flex flex-col rounded-xl border p-4 text-start transition-all",
                          includeAccommodation && hotelId === h.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-border hover:bg-muted/30",
                        )}
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex size-8 items-center justify-center text-muted-foreground">
                              <KindIcon className="size-5" />
                            </div>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[10px] font-semibold uppercase",
                                h.kind === "apartment"
                                  ? "bg-amber-500/12 text-amber-900 dark:text-amber-100"
                                  : "bg-primary/10 text-primary",
                              )}
                            >
                              {h.kind === "apartment"
                                ? t("kindApartment")
                                : t("kindHotel")}
                            </Badge>
                          </div>
                          {includeAccommodation && hotelId === h.id ? (
                            <Check className="size-4 shrink-0 text-primary" />
                          ) : null}
                        </div>
                        <p className="text-sm font-semibold text-foreground">{h.name}</p>
                        {h.type ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">{h.type}</p>
                        ) : null}
                        <p className="mt-1 text-xs font-medium tabular-nums text-muted-foreground">
                          {t("hotelPerNight", {
                            amount: formatUSD(h.pricePerNightUSD, locale),
                          })}
                        </p>
                        <p className="mt-2 text-sm font-bold tabular-nums text-primary">
                          {t("accommodationEstTotal", {
                            amount: formatUSD(est, locale),
                          })}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {currentStep === "flight" && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">{t("flightHint")}</p>
                <p className="text-xs text-muted-foreground">{t("flightBandHint", { band: flightCountryBand })}</p>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIncludeFlights(false);
                      setFlightOptionId(null);
                    }}
                    className={cn(
                      "flex rounded-xl border-2 border-dashed p-4 text-start transition-all",
                      !includeFlights && flightOptionId === null
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:bg-muted/30",
                    )}
                  >
                    <Plane className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                    <div className="ms-3 min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">{t("optNoneFlight")}</p>
                        {!includeFlights && flightOptionId === null ? (
                          <Check className="size-4 shrink-0 text-primary" />
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{t("optNoneFlightHint")}</p>
                    </div>
                  </button>
                  {flightOptions.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setIncludeFlights(true);
                        setFlightOptionId(f.id);
                      }}
                      className={cn(
                        "flex rounded-xl border p-4 text-start transition-all",
                        includeFlights && flightOptionId === f.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border hover:bg-muted/30",
                      )}
                    >
                      <Plane className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                      <div className="ms-3 min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-foreground">{f.label[langKey]}</p>
                          <div className="flex shrink-0 items-center gap-2">
                            {includeFlights && flightOptionId === f.id ? (
                              <Check className="size-4 text-primary" />
                            ) : null}
                            <span className="text-sm font-bold tabular-nums text-primary">
                              {formatUSD(f.priceUSD, locale)}
                            </span>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{f.detail[langKey]}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === "transport" && (
              <div className="space-y-5">
                <p className="text-sm font-semibold text-foreground">{t("transportHint")}</p>
                <p className="text-xs text-muted-foreground">
                  {transportBase.modeLabel[langKey]}
                  {", "}
                  <span className="font-medium text-foreground">{areaZoneUiLabel}</span>
                </p>
                <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="pkg-trips"
                        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {t("packageTripsLabel")}
                      </Label>
                      <Input
                        id="pkg-trips"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={PACKAGE_TRIP_MAX}
                        value={packageTripCount}
                        onChange={(e) => {
                          const raw = Number.parseInt(e.target.value, 10);
                          if (!Number.isFinite(raw)) return;
                          setPackageTripCount(
                            clampInt(raw, 1, PACKAGE_TRIP_MAX),
                          );
                        }}
                        className="max-w-[9rem]"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        {t("recommendedTripsHint", {
                          count: recommendedTripCount,
                        })}
                      </p>
                    </div>
                    <div className="space-y-1.5 rounded-lg border border-border/60 bg-background/80 p-3">
                      <p className="text-xs font-semibold text-foreground">
                        {t("billedRoutesTitle")}
                      </p>
                      <p className="text-2xl font-bold tabular-nums text-primary">
                        {billedTransportRoutes}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {t("billedRoutesHint")}
                      </p>
                    </div>
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-dashed border-border p-3">
                    <input
                      type="checkbox"
                      checked={airportGroundRoundTrip}
                      onChange={(e) => setAirportGroundRoundTrip(e.target.checked)}
                      className="mt-1 size-4 rounded border-input"
                    />
                    <span>
                      <span className="block text-sm font-medium text-foreground">
                        {t("airportRoundTripLabel")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t("airportRoundTripHint")}
                      </span>
                    </span>
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIncludeGroundTransport(false);
                      setGroundTransportSkuId(null);
                    }}
                    className={cn(
                      "flex flex-col rounded-xl border-2 border-dashed p-4 text-start transition-all min-h-[5.5rem]",
                      !includeGroundTransport
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:bg-muted/30",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Truck className="size-5 text-muted-foreground shrink-0" />
                      {!includeGroundTransport ? <Check className="size-4 text-primary" /> : null}
                    </div>
                    <p className="text-sm font-semibold text-foreground">{t("optNoneTransport")}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("optNoneTransportHint")}</p>
                  </button>
                  {listGroundTransportSkus().map((sku) => (
                    <button
                      key={sku.id}
                      type="button"
                      onClick={() => {
                        setIncludeGroundTransport(true);
                        setGroundTransportSkuId(sku.id);
                      }}
                      className={cn(
                        "flex flex-col rounded-xl border p-4 text-start transition-all min-h-[5.5rem]",
                        includeGroundTransport && groundTransportSkuId === sku.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border hover:bg-muted/30",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Truck className="size-5 text-muted-foreground shrink-0" />
                        {includeGroundTransport && groundTransportSkuId === sku.id ? (
                          <Check className="size-4 text-primary" />
                        ) : null}
                      </div>
                      <p className="text-sm font-semibold text-foreground">{sku.label[langKey]}</p>
                      <p className="text-xs font-medium tabular-nums text-primary mt-auto pt-2">
                        {t("transportSkuLine", {
                          amount: formatUSD(
                            sku.usdPerRoute * billedTransportRoutes,
                            locale,
                          ),
                          count: billedTransportRoutes,
                        })}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === "review" && pricing && (
              <div className="space-y-6">
                <div className="bg-card rounded-xl border border-border shadow-sm">
                  <div className="px-5 py-4 border-b border-border flex justify-between items-center">
                    <h4 className="text-sm font-medium text-foreground">{t("reviewHint")}</h4>
                    <Badge variant="secondary" className="text-xs font-medium bg-primary/10 text-primary border-none">
                      {t("reviewDraftBadge")}
                    </Badge>
                  </div>
                  <div className="p-5 space-y-4">
                    {pricing.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{item.label[langKey]}</span>
                        <span className="text-sm font-medium tabular-nums">
                          {formatUSD(item.amountUSD, locale)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-4 mt-2 border-t border-border flex justify-between items-center">
                      <span className="text-base font-semibold text-primary">{t("reviewTotal")}</span>
                      <span className="text-xl font-bold tabular-nums text-primary">
                        {formatUSD(pricing.totalUSD, locale)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border p-5">
                  <p className="mb-1 text-sm font-medium text-muted-foreground">
                    {t("downpaymentYes")}
                  </p>
                  <p className="text-2xl font-semibold tabular-nums text-foreground">
                    {formatUSD(
                      pricing.downpaymentRequired ? (pricing.downpaymentUSD ?? 0) : 0,
                      locale,
                    )}
                  </p>
                </div>
              </div>
            )}
            </div>

            {pricing ? (
              <aside
                className={cn(
                  "flex w-full shrink-0 flex-col rounded-xl border border-border bg-muted/15 p-4 lg:max-h-[min(52vh,28rem)] lg:w-80 lg:overflow-y-auto xl:max-h-[min(58vh,34rem)] xl:w-[22rem]",
                )}
              >
                <p className="text-xs font-semibold text-foreground">{t("breakdownTitle")}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {t("breakdownSubtitle")}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {pricing.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between gap-3 text-xs">
                      <span className="min-w-0 flex-1 leading-snug text-muted-foreground">
                        {item.label[langKey]}
                      </span>
                      <span className="shrink-0 tabular-nums font-medium text-foreground">
                        {formatUSD(item.amountUSD, locale)}
                      </span>
                    </li>
                  ))}
                </ul>
                {pricing._meta &&
                (pricing._meta.procedure > 0 || pricing._meta.hospital > 0) &&
                (outCommissionPct.doctor > 0 || outCommissionPct.hospital > 0) ? (
                  <div className="mt-4 space-y-1.5 border-t border-dashed border-border pt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("outCommissionAsideTitle")}
                    </p>
                    {pricing._meta.procedure > 0 && outCommissionPct.doctor > 0 ? (
                      <div className="flex justify-between gap-2 text-[11px] text-emerald-800 dark:text-emerald-400">
                        <span className="min-w-0">
                          {t("outCommissionAsideProcedure", { percent: outCommissionPct.doctor })}
                        </span>
                        <span className="shrink-0 tabular-nums font-medium">
                          {formatUSD(
                            computeQuotationOutCommissionUsd(
                              pricing._meta.procedure,
                              outCommissionPct.doctor,
                            ),
                            locale,
                          )}
                        </span>
                      </div>
                    ) : null}
                    {pricing._meta.hospital > 0 && outCommissionPct.hospital > 0 ? (
                      <div className="flex justify-between gap-2 text-[11px] text-emerald-800 dark:text-emerald-400">
                        <span className="min-w-0">
                          {t("outCommissionAsideHospital", { percent: outCommissionPct.hospital })}
                        </span>
                        <span className="shrink-0 tabular-nums font-medium">
                          {formatUSD(
                            computeQuotationOutCommissionUsd(
                              pricing._meta.hospital,
                              outCommissionPct.hospital,
                            ),
                            locale,
                          )}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <div className="mt-4 flex justify-between gap-2 border-t border-border pt-3 text-sm font-semibold text-primary">
                  <span>{t("reviewTotal")}</span>
                  <span className="tabular-nums">{formatUSD(pricing.totalUSD, locale)}</span>
                </div>
              </aside>
            ) : null}
          </div>
        </DialogBody>

        <DialogFooter className="border-t border-border pt-4">
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex min-h-10 items-center gap-2">
              {stepIndex > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl text-sm font-semibold gap-1.5"
                  onClick={goBack}
                >
                  {isRtl ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
                  {t("back")}
                </Button>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {(currentStep === "doctorHospital" && clientType === "b2c") ||
              (currentStep === "hotel" && !skipHotel) ||
              currentStep === "flight" ||
              currentStep === "transport" ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground"
                  onClick={
                    currentStep === "doctorHospital"
                      ? skipHospitalChoice
                      : currentStep === "hotel"
                        ? skipHotelStep
                        : currentStep === "flight"
                          ? skipFlightStep
                          : skipTransportStep
                  }
                >
                  {t("skip")}
                </Button>
              ) : null}
              
              {currentStep !== "review" ? (
                <Button 
                  type="button" 
                  className="rounded-xl text-sm font-semibold gap-1.5 px-6 shadow-md" 
                  onClick={goNext}
                >
                  {t("next")}
                  {isRtl ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                </Button>
              ) : (
                <Button 
                  type="button" 
                  disabled={saving} 
                  className="rounded-xl text-sm font-semibold gap-1.5 px-6 shadow-md bg-primary hover:bg-primary/90" 
                  onClick={() => void handleSave()}
                >
                  {saving ? t("saving") : t("saveDraft")}
                  <Check className="size-3.5" />
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </DialogShell>
  );
}
