"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  Building2,
  Calculator,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Globe,
  HeartHandshake,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  ShieldCheck,
  Stethoscope,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConsultationBookingForm } from "@/app/[locale]/(marketing)/contact/_components/consultation-booking-form";
import { MOCK_COUNTRIES } from "@/lib/mock-countries";
import {
  getHospitalAreaZone,
  getTreatmentEstimateCatalog,
  type EstimateTimingPreference,
  type TreatmentEstimateCatalog,
} from "@/lib/api/patient-estimate-catalog";
import { inferCountryBandFromCountry } from "@/lib/infer-country-band";
import { useSession } from "@/lib/mock-session";
import { addPatientCareRequest, buildRequestPayloadFromOnboarding } from "@/lib/patient-care-requests";
import { getDefaultLeadIdForPatient } from "@/lib/patient-demo";
import { addPatientPendingFollowUp } from "@/lib/patient-pending-follow-ups";
import { getPatientProfile, setPatientProfile } from "@/lib/patient-profile-local";
import { buildPatientEstimateRange } from "@/lib/quotation-price-engine";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { ConsultantProfile, ConsultationSlot, Treatment } from "@/types";

const ONBOARDING_DONE_KEY = "amanak_onboarding_demo_done";
const ONBOARDING_DRAFT_KEY = "amanak_onboarding_draft_v2";

type Step =
  | "timing"
  | "details"
  | "treatment"
  | "payer"
  | "fork"
  | "estimate"
  | "postEstimate"
  | "contact"
  | "confirm";
type PathChoice = "estimate" | "talk" | "book" | null;
type PayerChoice = "self" | "insurance" | null;
type EstimateBranchStep = "selection" | "factors" | "review";

export function PatientOnboardingWizard({
  treatments,
  initialSlots,
  consultant,
}: {
  treatments: Treatment[];
  initialSlots: ConsultationSlot[];
  consultant: ConsultantProfile;
}) {
  const t = useTranslations("portal");
  const tTreatments = useTranslations("treatments");
  const tDoctors = useTranslations("doctors");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const router = useRouter();
  const { session } = useSession();

  const [step, setStep] = useState<Step>("details");
  const [timing, setTiming] = useState<EstimateTimingPreference | null>(null);
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");

  const [treatmentSlug, setTreatmentSlug] = useState("");
  const [treatmentQuery, setTreatmentQuery] = useState("");
  const [payerChoice, setPayerChoice] = useState<PayerChoice>(null);

  const [path, setPath] = useState<PathChoice>(null);
  const [travelerCount, setTravelerCount] = useState(1);
  const [contactTime, setContactTime] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [estimateStep, setEstimateStep] = useState<EstimateBranchStep>("selection");
  const [catalog, setCatalog] = useState<TreatmentEstimateCatalog | null>(null);
  const [doctorId, setDoctorId] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [includeFlights, setIncludeFlights] = useState(true);
  const [includeAccommodation, setIncludeAccommodation] = useState(true);
  const [includeTransport, setIncludeTransport] = useState(true);

  useEffect(() => {
    const p = getPatientProfile();
    if (!p) return;
    setFullName(p.fullName);
    setPhone(p.phone);
    setCountry(p.country);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ONBOARDING_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        timing?: EstimateTimingPreference;
        fullName?: string;
        phone?: string;
        country?: string;
        treatmentSlug?: string;
        payerChoice?: PayerChoice;
      };
      if (draft.timing) setTiming(draft.timing);
      if (draft.fullName) setFullName(draft.fullName);
      if (draft.phone) setPhone(draft.phone);
      if (draft.country) setCountry(draft.country);
      if (draft.treatmentSlug) setTreatmentSlug(draft.treatmentSlug);
      if (draft.payerChoice) setPayerChoice(draft.payerChoice);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        ONBOARDING_DRAFT_KEY,
        JSON.stringify({
          timing,
          fullName,
          phone,
          country,
          treatmentSlug,
          payerChoice,
        }),
      );
    } catch {
      /* ignore */
    }
  }, [timing, fullName, phone, country, treatmentSlug, payerChoice]);

  useEffect(() => {
    if (!treatmentSlug) {
      setCatalog(null);
      return;
    }
    let cancelled = false;
    getTreatmentEstimateCatalog(treatmentSlug).then((next) => {
      if (cancelled) return;
      setCatalog(next);
      const firstDoctor = next.doctors[0];
      const firstHospital = next.hospitals[0];
      setDoctorId((prev) => prev || firstDoctor?.doctor.id || "");
      setHospitalId((prev) => prev || firstHospital?.hospital.id || firstDoctor?.recommendedHospitalId || "");
    });
    return () => {
      cancelled = true;
    };
  }, [treatmentSlug]);

  const filteredTreatments = useMemo(() => {
    const q = treatmentQuery.trim().toLowerCase();
    if (!q) return treatments;
    return treatments.filter((tr) => {
      const slugMatch = tr.slug.toLowerCase().includes(q);
      let titleMatch = false;
      try {
        titleMatch = tTreatments(`items.${tr.id}.title`).toLowerCase().includes(q);
      } catch {
        /* ignore missing keys */
      }
      return slugMatch || titleMatch;
    });
  }, [treatments, treatmentQuery, tTreatments]);

  const filteredCountries = useMemo(() => {
    const q = country.trim().toLowerCase();
    if (!q) return MOCK_COUNTRIES.slice(0, 12);
    return MOCK_COUNTRIES.filter((c) => c.toLowerCase().includes(q)).slice(0, 12);
  }, [country]);

  function detailsValid() {
    return [fullName, phone, country].every((s) => s.trim().length > 0);
  }

  function payerValid() {
    return Boolean(payerChoice);
  }

  function timingValid() {
    return Boolean(timing);
  }

  function contactValid() {
    if (path === "talk") return contactTime.length > 0;
    if (path === "book") return bookingId.length > 0;
    return true;
  }

  function persistProfile() {
    setPatientProfile({
      fullName: fullName.trim(),
      phone: phone.trim(),
      country: country.trim(),
    });
  }

  function goBack() {
    if (step === "treatment") setStep("details");
    else if (step === "timing") setStep("treatment");
    else if (step === "payer") setStep("timing");
    else if (step === "fork") setStep("payer");
    else if (step === "estimate") {
      if (estimateStep === "selection") setStep("fork");
      else if (estimateStep === "factors") setEstimateStep("selection");
      else if (estimateStep === "review") setEstimateStep("factors");
    }
    else if (step === "postEstimate") setStep("estimate");
    else if (step === "contact") {
      if (estimateStep === "review") setStep("postEstimate");
      else setStep("fork");
    }
    else if (step === "confirm") {
      if (path === "estimate") setStep("estimate");
      else if (path === "talk" || path === "book") setStep("contact");
    }
  }

  function finish() {
    persistProfile();
    if (!treatmentSlug || !path) return;

    const isB2B = payerChoice === "insurance";

    if (path === "estimate") {
      addPatientCareRequest(
        buildRequestPayloadFromOnboarding({
          treatmentSlug,
          isB2B,
          path: "estimate",
          partySize: travelerCount <= 1 ? "1" : "2",
          travelerCount,
          timing: timing ?? undefined,
          doctorId: doctorId || undefined,
          hospitalId: hospitalId || undefined,
          includeFlights,
          includeAccommodation,
          includeTransport,
          estimateSnapshot: estimateResult
            ? {
                totalMinUSD: estimateResult.totalMinUSD,
                totalMaxUSD: estimateResult.totalMaxUSD,
                currency: "USD",
                lines: estimateResult.lines.map((line) => ({
                  key: line.key,
                  minUSD: line.minUSD,
                  maxUSD: line.maxUSD,
                })),
                computedAt: new Date().toISOString(),
              }
            : undefined,
        }),
      );
    }

    if (path === "talk") {
      addPatientCareRequest(
        buildRequestPayloadFromOnboarding({
          treatmentSlug,
          isB2B,
          path: "talk",
          timing: timing ?? undefined,
          phone,
          contactTime,
        }),
      );
    }

    if (path === "book" && bookingId) {
      addPatientCareRequest(
        buildRequestPayloadFromOnboarding({
          treatmentSlug,
          isB2B,
          path: "book",
          timing: timing ?? undefined,
          bookingId,
        }),
      );
    }

    const leadId =
      session.isAuthenticated && session.user.role === "patient"
        ? getDefaultLeadIdForPatient(session.user.id)
        : undefined;
    if (leadId) {
      if (path === "talk") {
        addPatientPendingFollowUp({
          leadId,
          kind: "callback",
          treatmentSlug,
          phone: phone.trim() || undefined,
          contactTime: contactTime.trim() || undefined,
        });
      }
      if (path === "book" && bookingId) {
        addPatientPendingFollowUp({
          leadId,
          kind: "consultation",
          treatmentSlug,
          bookingId,
        });
      }
    }

    try {
      localStorage.setItem(ONBOARDING_DONE_KEY, "1");
      localStorage.removeItem(ONBOARDING_DRAFT_KEY);
    } catch {
      /* ignore */
    }
    router.push(ROUTES.patientProfile);
  }

  const steps: { id: Step; label: string }[] = [
    { id: "details", label: t("onboardingStepYourDetails") },
    { id: "treatment", label: t("onboardingStepTreatment") },
    { id: "timing", label: t("onboardingStepTiming") },
    { id: "payer", label: t("onboardingStepPayment") },
    { id: "fork", label: t("onboardingStepPath") },
    { id: "postEstimate", label: t("onboardingProgressContact") },
    { id: "contact", label: t("onboardingProgressContact") },
    { id: "confirm", label: t("onboardingStepConfirm") },
  ];

  const currentStepIndex = Math.max(0, steps.findIndex((s) => s.id === step));
  const progressPct = steps.length > 1 ? (currentStepIndex / (steps.length - 1)) * 100 : 0;
  const progressRailStyle = { "--wizard-progress-fill": `${progressPct}%` } as CSSProperties;

  const selectedTreatment = useMemo(
    () => treatments.find((item) => item.slug === treatmentSlug),
    [treatments, treatmentSlug],
  );

  const selectedDoctorOption = useMemo(
    () => catalog?.doctors.find((item) => item.doctor.id === doctorId) ?? null,
    [catalog, doctorId],
  );
  const selectedHospitalOption = useMemo(
    () => catalog?.hospitals.find((item) => item.hospital.id === hospitalId) ?? null,
    [catalog, hospitalId],
  );

  const availableHospitals = useMemo(() => {
    if (!catalog) return [];
    if (doctorId) {
      const allowed = new Set(selectedDoctorOption?.hospitalIds ?? []);
      return catalog.hospitals.filter((item) => allowed.has(item.hospital.id));
    }
    return catalog.hospitals;
  }, [catalog, doctorId, selectedDoctorOption]);

  const availableDoctors = useMemo(() => {
    if (!catalog) return [];
    if (hospitalId) {
      const hospital = catalog.hospitals.find((item) => item.hospital.id === hospitalId);
      const allowed = new Set(hospital?.doctorIds ?? []);
      return catalog.doctors.filter((item) => allowed.has(item.doctor.id));
    }
    return catalog.doctors;
  }, [catalog, hospitalId]);

  useEffect(() => {
    if (selectedDoctorOption?.recommendedHospitalId) {
      setHospitalId((prev) => prev || selectedDoctorOption.recommendedHospitalId);
    }
  }, [selectedDoctorOption]);

  const estimateResult = useMemo(() => {
    if (!treatmentSlug || !timing) return null;
    const derivedCountryBand = inferCountryBandFromCountry(country);
    const areaZone = selectedHospitalOption
      ? selectedHospitalOption.areaZone
      : getHospitalAreaZone(hospitalId || "");
    return buildPatientEstimateRange({
      treatmentSlug,
      countryBand: derivedCountryBand,
      areaZone,
      timing,
      travelerCount,
      includeFlights,
      includeAccommodation,
      includeTransport,
      doctorSelected: Boolean(doctorId),
      hospitalSelected: Boolean(hospitalId),
    });
  }, [
    country,
    doctorId,
    hospitalId,
    includeAccommodation,
    includeFlights,
    includeTransport,
    travelerCount,
    selectedHospitalOption,
    timing,
    treatmentSlug,
  ]);

  const travelerEstimates = useMemo(() => {
    if (!treatmentSlug || !timing) return null;
    const areaZone = selectedHospitalOption
      ? selectedHospitalOption.areaZone
      : getHospitalAreaZone(hospitalId || "");
    const shared = {
      treatmentSlug,
      countryBand: inferCountryBandFromCountry(country),
      areaZone,
      timing,
      includeFlights,
      includeAccommodation,
      includeTransport,
      doctorSelected: Boolean(doctorId),
      hospitalSelected: Boolean(hospitalId),
    };
    return {
      one: buildPatientEstimateRange({ ...shared, travelerCount: 1 }),
      current: buildPatientEstimateRange({ ...shared, travelerCount }),
    };
  }, [
    treatmentSlug,
    timing,
    selectedHospitalOption,
    hospitalId,
    country,
    includeFlights,
    includeAccommodation,
    includeTransport,
    doctorId,
    travelerCount,
  ]);

  return (
    <div className="amanak-wizard-outer">
      <div className="amanak-wizard-progress-wrap">
        <div className="amanak-wizard-progress-rail" style={progressRailStyle}>
          <div className="amanak-wizard-progress-bg" aria-hidden />
          <div className="amanak-wizard-progress-fill" aria-hidden />
          {steps.map((s, i) => {
            const isActive = i <= currentStepIndex;
            const isCurrent = i === currentStepIndex;
            return (
              <div
                key={s.id}
                className={cn(
                  "amanak-wizard-step-dot",
                  isActive ? "border-primary text-primary" : "border-muted text-muted-foreground",
                  isCurrent && "scale-110 ring-4 ring-primary/10",
                )}
              >
                {isActive && i < currentStepIndex ? (
                  <CheckCircle2 className="size-6 fill-primary text-background" aria-hidden />
                ) : (
                  <span className="text-sm font-bold">{i + 1}</span>
                )}
                <span
                  className={cn(
                    "amanak-wizard-step-dot-label",
                    isCurrent ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
                <span
                  className={cn(
                    "absolute -bottom-6 text-[11px] font-semibold sm:hidden",
                    isCurrent ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-auto mt-12 w-full max-w-full rounded-xl border border-border/50 bg-card shadow-sm sm:mt-14 lg:max-w-4xl">
        <div className="amanak-wizard-step-clip p-6 sm:p-8">
          {step === "details" && (
            <div className="amanak-wizard-step-stack">
              <div className="amanak-wizard-step-header">
                <h2 className="amanak-app-page-title">{t("onboardingStepYourDetails")}</h2>
                <p className="text-sm text-muted-foreground">{t("onboardingYourDetailsLead")}</p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ob-fullname" className="amanak-app-field-label font-semibold">
                    {t("fullName")}
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="ob-fullname"
                      className="h-12 rounded-xl border-2 ps-12 text-base"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ob-phone" className="amanak-app-field-label font-semibold">
                    {t("phone")}
                  </Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="ob-phone"
                      className="h-12 rounded-xl border-2 ps-12 text-base"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ob-country" className="amanak-app-field-label font-semibold">
                    {t("country")}
                  </Label>
                  <div className="relative">
                    <Globe className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="ob-country"
                      list="ob-country-list"
                      className="h-12 rounded-xl border-2 ps-12 text-base"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder={t("onboardingCountryPlaceholder")}
                      autoComplete="off"
                    />
                    <datalist id="ob-country-list">
                      {filteredCountries.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "timing" && (
            <div className="amanak-wizard-step-stack">
              <div className="amanak-wizard-step-header">
                <h2 className="amanak-app-page-title">{t("onboardingStepTiming")}</h2>
                <p className="text-sm text-muted-foreground">{t("onboardingTimingLead")}</p>
              </div>
              <div className="flex flex-col gap-3">
                {([
                  { id: "asap", icon: CalendarIcon, title: t("onboardingTimingAsap"), hint: t("onboardingTimingAsapHint") },
                  { id: "one_month", icon: CalendarIcon, title: t("onboardingTimingOneMonth"), hint: t("onboardingTimingOneMonthHint") },
                  { id: "three_months", icon: CalendarIcon, title: t("onboardingTimingThreeMonths"), hint: t("onboardingTimingThreeMonthsHint") },
                ] as const).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    data-selected={timing === option.id}
                    onClick={() => setTiming(option.id)}
                    className="amanak-wizard-option-row min-h-20 px-4 py-4"
                  >
                    <option.icon className="size-6 text-primary" />
                    <div className="amanak-wizard-option-row-body">
                      <p className="text-base font-semibold">{option.title}</p>
                      <p className="text-sm text-muted-foreground">{option.hint}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "treatment" && (
            <div className="amanak-wizard-step-stack">
              <div className="amanak-wizard-step-header">
                <h2 className="amanak-app-page-title">{t("onboardingStepTreatment")}</h2>
                <p className="text-sm text-muted-foreground">{t("onboardingTreatmentLead")}</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t("onboardingTreatmentSearchPlaceholder")}
                    className="h-11 ps-9"
                    value={treatmentQuery}
                    onChange={(e) => setTreatmentQuery(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredTreatments.map((tr) => {
                    const selected = treatmentSlug === tr.slug;
                    let treatmentTitle = tr.slug;
                    try {
                      treatmentTitle = tTreatments(`items.${tr.id}.title`);
                    } catch {
                      /* fallback to slug */
                    }
                    return (
                      <button
                        key={tr.slug}
                        type="button"
                        onClick={() => setTreatmentSlug(tr.slug)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border-2 p-3 text-start transition-all",
                          selected
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
                        )}
                      >
                        <div className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full border",
                          selected ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border"
                        )}>
                          {selected ? <CheckCircle2 className="size-4" /> : <Stethoscope className="size-4" />}
                        </div>
                        <span className="truncate text-sm font-medium">{treatmentTitle}</span>
                      </button>
                    );
                  })}
                  {filteredTreatments.length === 0 && (
                    <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                      {t("onboardingNoTreatmentsFound")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === "payer" && (
            <div className="amanak-wizard-step-stack">
              <div className="amanak-wizard-step-header">
                <h2 className="amanak-app-page-title">{t("onboardingRequestTypeTitle")}</h2>
              </div>

              <div className="me-auto ms-0 flex w-full flex-col gap-3">
                <button
                  type="button"
                  data-selected={payerChoice === "self"}
                  onClick={() => setPayerChoice("self")}
                  className="amanak-wizard-option-row min-h-20 px-4 py-4"
                >
                  <HeartHandshake className="size-6 text-primary" />
                  <div className="amanak-wizard-option-row-body">
                    <p className="text-base font-semibold leading-tight text-foreground">{t("onboardingOptionIndividualSelf")}</p>
                    <p className="text-sm leading-snug text-muted-foreground">{t("onboardingB2CHint")}</p>
                  </div>
                </button>

                <button
                  type="button"
                  data-selected={payerChoice === "insurance"}
                  onClick={() => setPayerChoice("insurance")}
                  className="amanak-wizard-option-row min-h-20 px-4 py-4"
                >
                  <ShieldCheck className="size-6 text-primary" />
                  <div className="amanak-wizard-option-row-body">
                    <p className="text-base font-semibold leading-tight text-foreground">{t("onboardingOptionInsuranceCompany")}</p>
                    <p className="text-sm leading-snug text-muted-foreground">{t("onboardingInsurancePayerHint")}</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === "fork" && (
            <div className="amanak-wizard-step-stack">
              <div className="amanak-wizard-step-header">
                <h2 className="amanak-app-page-title">{t("onboardingForkTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("onboardingForkLead")}</p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  className="amanak-wizard-option-row min-h-20 px-4 py-4"
                  onClick={() => {
                    setPath("estimate");
                    setStep("estimate");
                    setEstimateStep("selection");
                  }}
                >
                  <Calculator className="size-6 text-primary" />
                  <div className="amanak-wizard-option-row-body">
                    <p className="text-base font-semibold leading-tight text-foreground">{t("onboardingGetEstimate")}</p>
                    <p className="text-sm leading-snug text-muted-foreground">{t("onboardingForkEstimateHelp")}</p>
                  </div>
                </button>

                <button
                  type="button"
                  className="amanak-wizard-option-row min-h-20 px-4 py-4"
                  onClick={() => {
                    setPath("talk");
                    setStep("contact");
                  }}
                >
                  <MessageSquare className="size-6 text-primary" />
                  <div className="amanak-wizard-option-row-body">
                    <p className="text-base font-semibold leading-tight text-foreground">{t("onboardingTalkSomeone")}</p>
                    <p className="text-sm leading-snug text-muted-foreground">{t("onboardingForkTalkHelp")}</p>
                  </div>
                </button>

                <button
                  type="button"
                  className="amanak-wizard-option-row min-h-20 px-4 py-4"
                  onClick={() => {
                    setPath("book");
                    setStep("contact");
                  }}
                >
                  <CalendarIcon className="size-6 text-primary" />
                  <div className="amanak-wizard-option-row-body">
                    <p className="text-base font-semibold leading-tight text-foreground">{t("onboardingForkBookTitle")}</p>
                    <p className="text-sm leading-snug text-muted-foreground">{t("onboardingForkBookHelp")}</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === "estimate" && (
            <div className="amanak-wizard-step-stack">
              <div className="flex items-start justify-between gap-3">
                <div className="amanak-wizard-step-header">
                  <h2 className="amanak-app-page-title">{t("onboardingGetEstimate")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {estimateStep === "selection"
                      ? t("onboardingEstimateSelectionLead")
                      : estimateStep === "factors"
                        ? t("onboardingEstimateFactorsLead")
                        : t("onboardingEstimateReviewLead")}
                  </p>
                </div>
                {estimateResult ? (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-semibold tracking-tight text-muted-foreground/70">
                      {t("onboardingEstimateTotalRange")}
                    </span>
                    <div className="rounded-xl border-2 border-primary bg-primary/5 px-4 py-2.5 text-lg font-bold text-primary shadow-sm ring-4 ring-primary/5 sm:text-xl">
                      ${estimateResult.totalMinUSD.toLocaleString()} - ${estimateResult.totalMaxUSD.toLocaleString()}
                    </div>
                  </div>
                ) : null}
              </div>

              {estimateStep === "selection" && (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <Label className="amanak-app-field-label">{t("onboardingEstimateChooseDoctor")}</Label>
                    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                      {availableDoctors.map((item) => {
                        const selected = doctorId === item.doctor.id;
                        const recommended = catalog?.recommendedDoctorIds.includes(item.doctor.id);
                        let doctorName = item.doctor.id;
                        try {
                          doctorName = tDoctors(`items.${item.doctor.id}.name`);
                        } catch {
                          /* fallback */
                        }
                        return (
                          <button
                            key={item.doctor.id}
                            type="button"
                            onClick={() => {
                              setDoctorId(item.doctor.id);
                              setHospitalId(item.recommendedHospitalId);
                            }}
                            className={cn(
                              "flex min-h-[3.5rem] items-center gap-2.5 rounded-lg border-2 p-2 text-start transition-all sm:min-h-[4rem]",
                              selected
                                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                : "border-border hover:border-primary/40",
                            )}
                          >
                            <div className={cn(
                              "flex size-7 shrink-0 items-center justify-center rounded-full border",
                              selected ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border"
                            )}>
                              <User className="size-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold leading-tight">{doctorName}</p>
                              {recommended ? (
                                <span className="mt-0.5 inline-flex rounded-full bg-primary/10 px-1.5 py-0 text-[8px] font-semibold tracking-tight text-primary">
                                  {t("onboardingEstimateRecommended")}
                                </span>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="amanak-app-field-label">{t("onboardingEstimateChooseHospital")}</Label>
                    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                      {availableHospitals.map((item) => {
                        const selected = hospitalId === item.hospital.id;
                        return (
                          <button
                            key={item.hospital.id}
                            type="button"
                            onClick={() => setHospitalId(item.hospital.id)}
                            className={cn(
                              "flex min-h-[3.5rem] items-center gap-2.5 rounded-lg border-2 p-2 text-start transition-all sm:min-h-[4rem]",
                              selected
                                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                : "border-border hover:border-primary/40",
                            )}
                          >
                            <div className={cn(
                              "flex size-7 shrink-0 items-center justify-center rounded-full border",
                              selected ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border"
                            )}>
                              <Building2 className="size-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold leading-tight">{item.hospital.name}</p>
                              <div className="mt-0.5 flex items-center gap-1 text-[9px] text-muted-foreground">
                                <MapPin className="size-2.5 shrink-0" />
                                <span className="truncate">{item.hospital.destinationSlug}</span>
                                <span className="mx-0.5 opacity-40">•</span>
                                <span className="truncate text-primary/80 font-medium">{item.accreditationLabel}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {estimateStep === "factors" && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="amanak-app-field-label">{t("onboardingTravelers")}</Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex min-h-12 items-center gap-2 rounded-lg border-2 border-border bg-card px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setTravelerCount((v) => Math.max(1, v - 1))}
                          className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-foreground hover:bg-muted"
                          aria-label={t("onboardingNavBack")}
                        >
                          -
                        </button>
                        <div className="min-w-0 flex-1 text-center">
                          <p className="text-sm font-semibold leading-tight">
                            {travelerCount} {travelerCount === 1 ? t("onboardingPerson") : t("onboardingPeople")}
                          </p>
                          {travelerEstimates ? (
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              + ${(travelerEstimates.current.totalMinUSD - travelerEstimates.one.totalMinUSD).toLocaleString()} - $
                              {(travelerEstimates.current.totalMaxUSD - travelerEstimates.one.totalMaxUSD).toLocaleString()}
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => setTravelerCount((v) => Math.min(10, v + 1))}
                          className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-foreground hover:bg-muted"
                          aria-label={t("onboardingNavNext")}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {([
                      ["flights", includeFlights, setIncludeFlights, t("onboardingEstimateIncludeFlights")],
                      ["accommodation", includeAccommodation, setIncludeAccommodation, t("onboardingEstimateIncludeAccommodation")],
                      ["transport", includeTransport, setIncludeTransport, t("onboardingEstimateIncludeTransport")],
                    ] as const).map(([key, value, setter, label]) => {
                      // Calculate potential cost regardless of current selection
                      const areaZone = selectedHospitalOption
                        ? selectedHospitalOption.areaZone
                        : getHospitalAreaZone(hospitalId || "");
                      
                      const potentialEstimate = buildPatientEstimateRange({
                        treatmentSlug,
                        countryBand: inferCountryBandFromCountry(country),
                        areaZone,
                        timing: timing!,
                        travelerCount,
                        includeFlights: key === "flights" ? true : includeFlights,
                        includeAccommodation: key === "accommodation" ? true : includeAccommodation,
                        includeTransport: key === "transport" ? true : includeTransport,
                        doctorSelected: Boolean(doctorId),
                        hospitalSelected: Boolean(hospitalId),
                      });

                      const line = potentialEstimate.lines.find((l) => l.key === key);
                      
                      return (
                        <button
                          key={label}
                          type="button"
                          data-selected={value}
                          onClick={() => setter(!value)}
                          className={cn(
                            "flex min-h-12 items-center gap-2 rounded-lg border-2 px-3 py-2 text-start transition-all",
                            value
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                              : "border-border bg-card hover:border-primary/40",
                          )}
                        >
                          <div
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded-full border",
                              value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/40 text-transparent",
                            )}
                          >
                            <CheckCircle2 className="size-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold leading-tight">{label}</p>
                            {line ? (
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                + ${line.minUSD.toLocaleString()} - ${line.maxUSD.toLocaleString()}
                              </p>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {estimateStep === "review" && estimateResult && (
                <div className="space-y-4 rounded-xl border border-border/50 bg-muted/20 p-5">
                  {estimateResult.lines.map((line) => (
                    <div key={line.key} className="flex items-center justify-between text-sm">
                      <span className={cn(!line.included && "text-muted-foreground line-through")}>
                        {line.label[isRtl ? "ar" : "en"]}
                      </span>
                      <span className="font-semibold">
                        ${line.minUSD.toLocaleString()} - ${line.maxUSD.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-border/60 pt-3 text-base font-semibold">
                    {t("onboardingEstimateTotalRange")}: ${estimateResult.totalMinUSD.toLocaleString()} - $
                    {estimateResult.totalMaxUSD.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "contact" && path === "talk" && (
            <div className="amanak-wizard-step-stack">
              <div className="amanak-wizard-step-header">
                <h2 className="amanak-app-page-title">{t("onboardingTalkSomeone")}</h2>
                <p className="text-sm text-muted-foreground">{t("onboardingContactHint")}</p>
              </div>

              <div className="space-y-4">
                <Label className="amanak-app-field-label font-semibold">{t("onboardingContactTime")}</Label>
                <div className="flex flex-col gap-3">
                  {[
                    t("onboardingSlotMorning"),
                    t("onboardingSlotAfternoon"),
                    t("onboardingSlotEvening"),
                  ].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      data-selected={contactTime === slot}
                      onClick={() => setContactTime(slot)}
                      className="amanak-wizard-option-row min-h-16 px-4 py-4"
                    >
                      <Phone className="size-5 text-primary" />
                      <div className="amanak-wizard-option-row-body">
                        <p className="text-base font-semibold leading-tight text-foreground">{slot}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "contact" && path === "book" && (
            <div className="amanak-wizard-step-stack">
              <div className="amanak-wizard-step-header">
                <h2 className="amanak-app-page-title">{t("onboardingBookTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("onboardingBookSubtitle")}</p>
              </div>

              <ConsultationBookingForm
                initialSlots={initialSlots}
                consultant={consultant}
                compact
                onBookingConfirmed={(id) => {
                  setBookingId(id);
                  setStep("confirm");
                }}
              />
            </div>
          )}

          {step === "postEstimate" && (
            <div className="amanak-wizard-step-stack">
              <div className="amanak-wizard-step-header">
                <h2 className="amanak-app-page-title">{t("onboardingForkTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("onboardingForkLead")}</p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  className="amanak-wizard-option-row min-h-20 px-4 py-4"
                  onClick={() => {
                    setPath("talk");
                    setStep("contact");
                  }}
                >
                  <MessageSquare className="size-6 text-primary" />
                  <div className="amanak-wizard-option-row-body">
                    <p className="text-base font-semibold leading-tight text-foreground">{t("onboardingTalkSomeone")}</p>
                    <p className="text-sm leading-snug text-muted-foreground">{t("onboardingForkTalkHelp")}</p>
                  </div>
                </button>

                <button
                  type="button"
                  className="amanak-wizard-option-row min-h-20 px-4 py-4"
                  onClick={() => {
                    setPath("book");
                    setStep("contact");
                  }}
                >
                  <CalendarIcon className="size-6 text-primary" />
                  <div className="amanak-wizard-option-row-body">
                    <p className="text-base font-semibold leading-tight text-foreground">{t("onboardingForkBookTitle")}</p>
                    <p className="text-sm leading-snug text-muted-foreground">{t("onboardingForkBookHelp")}</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="amanak-wizard-step-stack">
              <div className="amanak-wizard-step-header">
                <h2 className="amanak-app-page-title">{t("onboardingStepConfirm")}</h2>
                <p className="text-sm text-muted-foreground">{t("onboardingConfirmLead")}</p>
              </div>

              <div className="space-y-3">
                <p className="text-sm"><span className="font-semibold">{t("fullName")}: </span><span className="font-semibold text-primary">{fullName}</span></p>
                <p className="text-sm"><span className="font-semibold">{t("phone")}: </span><span className="font-semibold text-primary">{phone}</span></p>
                <p className="text-sm"><span className="font-semibold">{t("country")}: </span><span className="font-semibold text-primary">{country}</span></p>
                {timing ? (
                  <p className="text-sm"><span className="font-semibold">{t("onboardingStepTiming")}: </span><span className="font-semibold text-primary">{t(`onboardingTimingValue.${timing}`)}</span></p>
                ) : null}
                <p className="text-sm">
                  <span className="font-semibold">{t("treatment")}: </span>
                  <span className="font-semibold text-primary">{(() => {
                    const selectedTreatment = treatments.find((item) => item.slug === treatmentSlug);
                    if (!selectedTreatment) return treatmentSlug;
                    try {
                      return tTreatments(`items.${selectedTreatment.id}.title`);
                    } catch {
                      return treatmentSlug;
                    }
                  })()}</span>
                </p>
                <p className="text-sm"><span className="font-semibold">{t("onboardingRequestTypeTitle")}: </span><span className="font-semibold text-primary">{payerChoice === "insurance" ? t("onboardingOptionInsuranceCompany") : t("onboardingOptionIndividualSelf")}</span></p>
                {path ? (
                  <p className="text-sm"><span className="font-semibold">{t("onboardingStepPath")}: </span><span className="font-semibold text-primary">{path === "estimate" ? t("onboardingGetEstimate") : path === "talk" ? t("onboardingTalkSomeone") : t("onboardingForkBookTitle")}</span></p>
                ) : null}
                {path === "talk" ? (
                  <p className="text-sm"><span className="font-semibold">{t("onboardingContactTime")}: </span><span className="font-semibold text-primary">{contactTime}</span></p>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <footer className="amanak-wizard-footer">
          <div className="amanak-wizard-footer-actions">
            <div className="amanak-wizard-footer-slot justify-start">
              {step !== "details" ? (
                <Button type="button" variant="outline" size="lg" className="amanak-wizard-nav-primary" onClick={goBack}>
                  {isRtl ? (
                    <ChevronRight className="me-2 size-5" aria-hidden />
                  ) : (
                    <ChevronLeft className="me-2 size-5" aria-hidden />
                  )}
                  {t("onboardingNavBack")}
                </Button>
              ) : null}
            </div>

            <div className="amanak-wizard-footer-slot justify-end">
              {step === "details" ? (
                <Button
                  type="button"
                  size="lg"
                  className="amanak-wizard-nav-primary"
                  disabled={!detailsValid()}
                  onClick={() => {
                    if (!detailsValid()) return;
                    persistProfile();
                    setStep("treatment");
                  }}
                >
                  {t("onboardingNavNext")}
                  {isRtl ? (
                    <ChevronLeft className="ms-2 size-5" aria-hidden />
                  ) : (
                    <ChevronRight className="ms-2 size-5" aria-hidden />
                  )}
                </Button>
              ) : null}

              {step === "treatment" ? (
                <Button
                  type="button"
                  size="lg"
                  className="amanak-wizard-nav-primary"
                  disabled={!treatmentSlug}
                  onClick={() => setStep("timing")}
                >
                  {t("onboardingNavNext")}
                  {isRtl ? (
                    <ChevronLeft className="ms-2 size-5" aria-hidden />
                  ) : (
                    <ChevronRight className="ms-2 size-5" aria-hidden />
                  )}
                </Button>
              ) : null}

              {step === "timing" ? (
                <Button
                  type="button"
                  size="lg"
                  className="amanak-wizard-nav-primary"
                  disabled={!timingValid()}
                  onClick={() => setStep("payer")}
                >
                  {t("onboardingNavNext")}
                  {isRtl ? (
                    <ChevronLeft className="ms-2 size-5" aria-hidden />
                  ) : (
                    <ChevronRight className="ms-2 size-5" aria-hidden />
                  )}
                </Button>
              ) : null}

              {step === "payer" ? (
                <Button
                  type="button"
                  size="lg"
                  className="amanak-wizard-nav-primary"
                  disabled={!payerValid()}
                  onClick={() => setStep("fork")}
                >
                  {t("onboardingNavNext")}
                  {isRtl ? (
                    <ChevronLeft className="ms-2 size-5" aria-hidden />
                  ) : (
                    <ChevronRight className="ms-2 size-5" aria-hidden />
                  )}
                </Button>
              ) : null}

              {step === "estimate" ? (
                <Button
                  type="button"
                  size="lg"
                  className="amanak-wizard-nav-primary"
                  disabled={estimateStep === "selection" && !hospitalId}
                  onClick={() => {
                    if (estimateStep === "selection") setEstimateStep("factors");
                    else if (estimateStep === "factors") setEstimateStep("review");
                    else setStep("postEstimate");
                  }}
                >
                  {t("onboardingNavNext")}
                  {isRtl ? (
                    <ChevronLeft className="ms-2 size-5" aria-hidden />
                  ) : (
                    <ChevronRight className="ms-2 size-5" aria-hidden />
                  )}
                </Button>
              ) : null}

              {step === "contact" && path === "talk" ? (
                <Button
                  type="button"
                  size="lg"
                  className="amanak-wizard-nav-primary"
                  disabled={!contactValid()}
                  onClick={() => setStep("confirm")}
                >
                  {t("onboardingNavNext")}
                  {isRtl ? (
                    <ChevronLeft className="ms-2 size-5" aria-hidden />
                  ) : (
                    <ChevronRight className="ms-2 size-5" aria-hidden />
                  )}
                </Button>
              ) : null}

              {step === "confirm" ? (
                <Button type="button" size="lg" className="amanak-wizard-nav-primary" onClick={finish}>
                  {t("onboardingDone")}
                  <CheckCircle2 className="ms-2 size-5" aria-hidden />
                </Button>
              ) : null}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
