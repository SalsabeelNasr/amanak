"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { crm } from "@/lib/crm/client";
import { listTreatmentsSync } from "@/lib/api/treatments";
import { patientTreatmentTitle } from "@/lib/patient-treatment-label";
import type { PackageTier, Patient, ProvisionalRequest, Request, RequestPriority } from "@/types";
import { cn } from "@/lib/utils";

type CarePath = "estimate" | "talk" | "book";
type Timing = "" | "asap" | "one_month" | "three_months";
type Party = "" | "1" | "2";
type FlightIntent = "" | "yes" | "no" | "unsure";

type IntakeForm = {
  treatmentSlug: string;
  requestPath: CarePath;
  payerB2b: boolean;
  timing: Timing;
  partySize: Party;
  travelerCount: string;
  doctorId: string;
  hospitalId: string;
  includeFlights: boolean;
  includeAccommodation: boolean;
  includeTransport: boolean;
  travelDateStart: string;
  travelDateEnd: string;
  accommodationTier: "" | PackageTier;
  flightIntent: FlightIntent;
  originRegion: string;
  transportPreference: string;
  callbackPhone: string;
  contactTime: string;
  bookingReference: string;
  patientNote: string;
  internalNote: string;
  estimateMinUsd: string;
  estimateMaxUsd: string;
  requestPriority: "" | RequestPriority;
};

function defaultForm(patient: Patient): IntakeForm {
  const slugs = listTreatmentsSync().map((t) => t.slug);
  return {
    treatmentSlug: slugs.includes("joint-replacement") ? "joint-replacement" : (slugs[0] ?? "joint-replacement"),
    requestPath: "estimate",
    payerB2b: false,
    timing: "",
    partySize: "",
    travelerCount: "",
    doctorId: "",
    hospitalId: "",
    includeFlights: true,
    includeAccommodation: true,
    includeTransport: true,
    travelDateStart: "",
    travelDateEnd: "",
    accommodationTier: "",
    flightIntent: "",
    originRegion: "",
    transportPreference: "",
    callbackPhone: patient.phone ?? "",
    contactTime: "",
    bookingReference: "",
    patientNote: "",
    internalNote: "",
    estimateMinUsd: "",
    estimateMaxUsd: "",
    requestPriority: "",
  };
}

function preferredContactWindow(phone: string, time: string): string | undefined {
  const p = phone.trim();
  const t = time.trim();
  if (!p && !t) return undefined;
  if (p && t) return `${p} · ${t}`;
  return p || t;
}

function pruneProvisional(p: ProvisionalRequest): ProvisionalRequest | undefined {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && !v.trim()) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  if (Object.keys(out).length === 0) return undefined;
  return out as ProvisionalRequest;
}

function buildProvisional(
  form: IntakeForm,
  submittedAt: string,
  extras: { travelersLine?: string; estimateLine?: string },
): ProvisionalRequest | undefined {
  const partyNum: 1 | 2 | undefined =
    form.partySize === "1" ? 1 : form.partySize === "2" ? 2 : undefined;

  const freeBits: string[] = [];
  if (form.patientNote.trim()) freeBits.push(form.patientNote.trim());
  if (extras.travelersLine?.trim()) freeBits.push(extras.travelersLine.trim());
  if (extras.estimateLine?.trim()) freeBits.push(extras.estimateLine.trim());
  const freeTextNote = freeBits.length > 0 ? freeBits.join("\n\n") : undefined;

  const prov: ProvisionalRequest = {
    submittedAt,
    requestPath: form.requestPath,
    timing: form.timing || undefined,
    partySize: partyNum,
    doctorId: form.doctorId.trim() || undefined,
    hospitalId: form.hospitalId.trim() || undefined,
    travelDateStart: form.travelDateStart.trim() || undefined,
    travelDateEnd: form.travelDateEnd.trim() || undefined,
    accommodationTier: form.accommodationTier || undefined,
    flightIntent: form.flightIntent || undefined,
    originRegion: form.originRegion.trim() || undefined,
    transportPreference: form.transportPreference.trim() || undefined,
    preferredContactWindow: preferredContactWindow(form.callbackPhone, form.contactTime),
    bookingReference: form.bookingReference.trim() || undefined,
    freeTextNote,
  };

  if (form.requestPath === "estimate") {
    prov.includeFlights = form.includeFlights;
    prov.includeAccommodation = form.includeAccommodation;
    prov.includeTransport = form.includeTransport;
  }

  return pruneProvisional(prov);
}

const TIERS: PackageTier[] = ["normal", "silver", "gold", "vip"];

function VisibilityHint({
  kind,
  t,
}: {
  kind: "patient" | "internal";
  t: (key: string) => string;
}) {
  return (
    <p className="text-[11px] leading-snug text-muted-foreground">
      {kind === "patient" ? t("newRequestVisibilityPatient") : t("newRequestVisibilityInternal")}
    </p>
  );
}

export function PatientNewRequestDialog({
  open,
  onOpenChange,
  patient,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
  onCreated: (request: Request) => void;
}) {
  const locale = useLocale();
  const t = useTranslations("crm.patientDetail");
  const tPortal = useTranslations("portal");
  const tCrm = useTranslations("crm");
  const tTreatments = useTranslations("treatments");
  const [form, setForm] = useState<IntakeForm>(() => defaultForm(patient));
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState(0);

  const pathEstimate = form.requestPath === "estimate";

  const stepTitles = useMemo(() => {
    const titles = [
      t("newRequestSectionCore"),
      t("newRequestSectionParty"),
      t("newRequestSectionPreferences"),
    ];
    if (pathEstimate) titles.push(t("newRequestSectionEstimate"));
    titles.push(t("newRequestSectionContact"), t("newRequestSectionNotes"));
    return titles;
  }, [pathEstimate, t]);

  const lastStep = stepTitles.length - 1;

  useEffect(() => {
    if (!open) return;
    setForm(defaultForm(patient));
    setStep(0);
  }, [open, patient.id, patient.phone]);

  useEffect(() => {
    setStep((s) => Math.min(s, stepTitles.length - 1));
  }, [stepTitles.length]);

  const set = useCallback(<K extends keyof IntakeForm>(key: K, value: IntakeForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const submittedAt = new Date().toISOString();
      const tc = form.travelerCount.trim();
      const travelersLine =
        tc && !Number.isNaN(Number.parseInt(tc, 10))
          ? t("newRequestTravelersLine", { count: tc })
          : undefined;
      const minUsd = form.estimateMinUsd.trim();
      const maxUsd = form.estimateMaxUsd.trim();
      const estimateLine =
        minUsd || maxUsd
          ? t("newRequestEstimateRangeLine", { min: minUsd || "—", max: maxUsd || "—" })
          : undefined;
      const provisionalRequest = buildProvisional(form, submittedAt, {
        travelersLine,
        estimateLine,
      });
      const notesParts: string[] = [];
      if (form.payerB2b) notesParts.push(t("newRequestPayerNoteLine"));
      if (form.internalNote.trim()) notesParts.push(form.internalNote.trim());
      const notes = notesParts.length > 0 ? notesParts.join("\n\n") : undefined;
      const created = await crm.requests.createForPatient(
        patient.id,
        {
          treatmentSlug: form.treatmentSlug,
          ...(notes ? { notes } : {}),
          ...(form.requestPriority ? { requestPriority: form.requestPriority } : {}),
          ...(provisionalRequest ? { provisionalRequest } : {}),
        },
        {},
      );
      onCreated(created);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  }

  const treatmentOptions = listTreatmentsSync();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={locale === "ar" ? "rtl" : "ltr"}
        size="xl"
        layout="scrollable"
        className="flex max-h-[min(90dvh,var(--dialog-max-height))] flex-col sm:max-w-2xl"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>{t("newRequestTitle")}</DialogTitle>
        </DialogHeader>

        <nav
          aria-label={t("newRequestStepperAria")}
          className="-mx-1 shrink-0 overflow-x-auto px-1 pb-3"
        >
          <ol className="flex min-w-0 flex-wrap gap-1.5">
            {stepTitles.map((title, i) => (
              <li key={`${title}-${i}`}>
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-3 py-1.5 text-start text-xs font-semibold transition-colors",
                    i === step
                      ? "border-primary bg-primary/10 text-primary"
                      : i < step
                        ? "border-border/80 bg-muted/40 text-foreground hover:bg-muted/60"
                        : "border-transparent bg-muted/25 text-muted-foreground hover:bg-muted/45",
                  )}
                >
                  <span className="tabular-nums text-muted-foreground">{i + 1}.</span> {title}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <DialogBody className="min-h-[12rem] space-y-4 pe-1">
          {step === 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="nr-treatment">{t("newRequestTreatment")}</Label>
                <select
                  id="nr-treatment"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.treatmentSlug}
                  onChange={(e) => set("treatmentSlug", e.target.value)}
                >
                  {treatmentOptions.map((tr) => (
                    <option key={tr.slug} value={tr.slug}>
                      {patientTreatmentTitle(tr.slug, (k) => tTreatments(k))}
                    </option>
                  ))}
                </select>
                <VisibilityHint kind="patient" t={t} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nr-path">{t("newRequestCarePath")}</Label>
                <select
                  id="nr-path"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.requestPath}
                  onChange={(e) => set("requestPath", e.target.value as CarePath)}
                >
                  <option value="estimate">{tPortal("carePathEstimate")}</option>
                  <option value="talk">{tPortal("carePathCallback")}</option>
                  <option value="book">{tPortal("carePathBook")}</option>
                </select>
                <VisibilityHint kind="patient" t={t} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nr-payer">{t("newRequestPayer")}</Label>
                <select
                  id="nr-payer"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.payerB2b ? "b2b" : "self"}
                  onChange={(e) => set("payerB2b", e.target.value === "b2b")}
                >
                  <option value="self">{t("newRequestPayerSelf")}</option>
                  <option value="b2b">{t("newRequestPayerInsurance")}</option>
                </select>
                <VisibilityHint kind="internal" t={t} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nr-timing">{t("newRequestTiming")}</Label>
                <select
                  id="nr-timing"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.timing}
                  onChange={(e) => set("timing", e.target.value as Timing)}
                >
                  <option value="">{t("newRequestTimingAny")}</option>
                  <option value="asap">{tPortal("onboardingTimingValue.asap")}</option>
                  <option value="one_month">{tPortal("onboardingTimingValue.one_month")}</option>
                  <option value="three_months">{tPortal("onboardingTimingValue.three_months")}</option>
                </select>
                <VisibilityHint kind="patient" t={t} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nr-priority">{t("newRequestCrmPriority")}</Label>
                <select
                  id="nr-priority"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.requestPriority}
                  onChange={(e) => set("requestPriority", e.target.value as "" | RequestPriority)}
                >
                  <option value="">{t("newRequestPriorityUnset")}</option>
                  <option value="low">{t("newRequestPriorityLow")}</option>
                  <option value="normal">{t("newRequestPriorityNormal")}</option>
                  <option value="hot">{t("newRequestPriorityHot")}</option>
                </select>
                <VisibilityHint kind="internal" t={t} />
              </div>
            </div>
          ) : step === 1 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nr-party">{t("newRequestPartySize")}</Label>
                <select
                  id="nr-party"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.partySize}
                  onChange={(e) => set("partySize", e.target.value as Party)}
                >
                  <option value="">{t("newRequestPartyUnset")}</option>
                  <option value="1">{t("newRequestPartyOne")}</option>
                  <option value="2">{t("newRequestPartyTwo")}</option>
                </select>
                <VisibilityHint kind="patient" t={t} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nr-travelers">{t("newRequestTravelers")}</Label>
                <Input
                  id="nr-travelers"
                  inputMode="numeric"
                  value={form.travelerCount}
                  onChange={(e) => set("travelerCount", e.target.value)}
                  placeholder="2"
                />
                <VisibilityHint kind="patient" t={t} />
              </div>
            </div>
          ) : step === 2 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nr-doctor">{t("newRequestDoctorId")}</Label>
                <Input
                  id="nr-doctor"
                  value={form.doctorId}
                  onChange={(e) => set("doctorId", e.target.value)}
                  placeholder="rashad_bishara"
                />
                <VisibilityHint kind="patient" t={t} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nr-hospital">{t("newRequestHospitalId")}</Label>
                <Input
                  id="nr-hospital"
                  value={form.hospitalId}
                  onChange={(e) => set("hospitalId", e.target.value)}
                  placeholder="hospital_cairo_main"
                />
                <VisibilityHint kind="patient" t={t} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nr-travel-start">{t("newRequestTravelStart")}</Label>
                <Input
                  id="nr-travel-start"
                  type="date"
                  value={form.travelDateStart}
                  onChange={(e) => set("travelDateStart", e.target.value)}
                />
                <VisibilityHint kind="patient" t={t} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nr-travel-end">{t("newRequestTravelEnd")}</Label>
                <Input
                  id="nr-travel-end"
                  type="date"
                  value={form.travelDateEnd}
                  onChange={(e) => set("travelDateEnd", e.target.value)}
                />
                <VisibilityHint kind="patient" t={t} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nr-tier">{t("newRequestAccommodationTier")}</Label>
                <select
                  id="nr-tier"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.accommodationTier}
                  onChange={(e) => set("accommodationTier", e.target.value as "" | PackageTier)}
                >
                  <option value="">{t("newRequestTierUnset")}</option>
                  {TIERS.map((tier) => (
                    <option key={tier} value={tier}>
                      {tCrm(`packageTier.${tier}`)}
                    </option>
                  ))}
                </select>
                <VisibilityHint kind="patient" t={t} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nr-flight-intent">{t("newRequestFlightIntent")}</Label>
                <select
                  id="nr-flight-intent"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.flightIntent}
                  onChange={(e) => set("flightIntent", e.target.value as FlightIntent)}
                >
                  <option value="">{t("newRequestFlightUnset")}</option>
                  <option value="yes">{tCrm("requestDetailFlightIntentYes")}</option>
                  <option value="no">{tCrm("requestDetailFlightIntentNo")}</option>
                  <option value="unsure">{tCrm("requestDetailFlightIntentUnsure")}</option>
                </select>
                <VisibilityHint kind="patient" t={t} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="nr-origin">{t("newRequestOriginRegion")}</Label>
                <Input
                  id="nr-origin"
                  value={form.originRegion}
                  onChange={(e) => set("originRegion", e.target.value)}
                />
                <VisibilityHint kind="patient" t={t} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="nr-transport-pref">{t("newRequestTransportPreference")}</Label>
                <Input
                  id="nr-transport-pref"
                  value={form.transportPreference}
                  onChange={(e) => set("transportPreference", e.target.value)}
                />
                <VisibilityHint kind="patient" t={t} />
              </div>
            </div>
          ) : pathEstimate && step === 3 ? (
            <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                {(
                  [
                    ["includeFlights", tPortal("onboardingEstimateIncludeFlights")],
                    ["includeAccommodation", tPortal("onboardingEstimateIncludeAccommodation")],
                    ["includeTransport", tPortal("onboardingEstimateIncludeTransport")],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-input"
                      checked={form[key]}
                      onChange={(e) => set(key, e.target.checked)}
                    />
                    {label}
                  </label>
                ))}
                <VisibilityHint kind="patient" t={t} />
              </div>
          ) : step === (pathEstimate ? 4 : 3) ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nr-phone">{t("newRequestCallbackPhone")}</Label>
                <Input
                  id="nr-phone"
                  type="tel"
                  value={form.callbackPhone}
                  onChange={(e) => set("callbackPhone", e.target.value)}
                />
                <VisibilityHint kind="patient" t={t} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nr-contact-time">{t("newRequestContactWindow")}</Label>
                <Input
                  id="nr-contact-time"
                  value={form.contactTime}
                  onChange={(e) => set("contactTime", e.target.value)}
                  placeholder={tPortal("onboardingContactPlaceholder")}
                />
                <VisibilityHint kind="patient" t={t} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="nr-booking">{t("newRequestBookingRef")}</Label>
                <Input
                  id="nr-booking"
                  value={form.bookingReference}
                  onChange={(e) => set("bookingReference", e.target.value)}
                />
                <VisibilityHint kind="patient" t={t} />
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nr-patient-note">{t("newRequestPatientNote")}</Label>
                <textarea
                  id="nr-patient-note"
                  rows={3}
                  value={form.patientNote}
                  onChange={(e) => set("patientNote", e.target.value)}
                  className={cn(
                    "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                    "placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  )}
                />
                <VisibilityHint kind="patient" t={t} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="nr-est-min">{t("newRequestEstimateMinUsd")}</Label>
                  <Input
                    id="nr-est-min"
                    inputMode="decimal"
                    value={form.estimateMinUsd}
                    onChange={(e) => set("estimateMinUsd", e.target.value)}
                  />
                  <VisibilityHint kind="patient" t={t} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nr-est-max">{t("newRequestEstimateMaxUsd")}</Label>
                  <Input
                    id="nr-est-max"
                    inputMode="decimal"
                    value={form.estimateMaxUsd}
                    onChange={(e) => set("estimateMaxUsd", e.target.value)}
                  />
                  <VisibilityHint kind="patient" t={t} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nr-internal">{t("newRequestInternalNote")}</Label>
                <textarea
                  id="nr-internal"
                  rows={2}
                  value={form.internalNote}
                  onChange={(e) => set("internalNote", e.target.value)}
                  className={cn(
                    "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                    "placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  )}
                />
                <VisibilityHint kind="internal" t={t} />
              </div>
            </div>
          )}
        </DialogBody>
        <DialogFooter className="shrink-0 flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            {step > 0 ? (
              <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                {t("newRequestStepBack")}
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {step < lastStep ? (
              <Button type="button" onClick={() => setStep((s) => s + 1)}>
                {t("newRequestStepNext")}
              </Button>
            ) : (
              <Button type="button" disabled={creating} onClick={() => void handleCreate()}>
                {creating ? t("creating") : t("createRequest")}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
