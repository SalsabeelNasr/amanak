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
  quotationWizardPackageStepSchema,
  type QuotationWizardStep,
} from "@/lib/crm/schemas/quotation";
import { getDoctorsByIds } from "@/lib/api/doctors";
import {
  getQuotationTransportProfile,
  listQuotationDoctorIds,
  listQuotationHospitalsForDoctor,
  listQuotationHotelsForHospital,
} from "@/lib/api/quotation-catalog";
import { crm } from "@/lib/crm/client";
import { buildQuotationPricing } from "@/lib/quotation-price-engine";
import type { Lead, LeadStatus, PackageTier } from "@/types";
import type { Doctor } from "@/types";
import { cn } from "@/lib/utils";
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Stethoscope, 
  Building2, 
  Hotel, 
  Truck, 
  FileText,
  Package,
  Info,
  MapPin
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatUSD } from "@/components/crm/money";
import { useLangKey } from "@/components/crm/use-lang-key";

const PACKAGE_TIERS: PackageTier[] = ["normal", "silver", "gold", "vip"];

const BLOCKED_STATUSES: LeadStatus[] = [
  "new",
  "assigned",
  "docs_missing",
  "docs_partial",
  "docs_complete",
  "consultant_review_ready",
  "rejected",
];

export function leadCanCreateQuotation(lead: Lead): boolean {
  // Allow creation if medically approved or already in quotation stages
  return !BLOCKED_STATUSES.includes(lead.status);
}

function useWizardSteps(skipHotel: boolean): QuotationWizardStep[] {
  return useMemo(() => {
    const s: QuotationWizardStep[] = ["package", "doctor", "hospital"];
    if (!skipHotel) s.push("hotel");
    s.push("transport", "review");
    return s;
  }, [skipHotel]);
}

type Props = {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (lead: Lead) => void;
};

export function LeadQuotationWizardDialog({
  lead,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const t = useTranslations("crm.leadQuotation");
  const tDoctors = useTranslations("doctors");
  const locale = useLocale();
  const langKey = useLangKey();
  const isRtl = locale === "ar";

  const skipHotel = lead.clientType === "b2b" || lead.clientType === "g2b";
  const steps = useWizardSteps(skipHotel);

  const [stepIndex, setStepIndex] = useState(0);
  const [packageTier, setPackageTier] = useState<PackageTier | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hotelName, setHotelName] = useState<string | null>(null);
  const [doctorOptions, setDoctorOptions] = useState<Doctor[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const prevOpenRef = useRef(false);

  const resetWizard = useCallback(() => {
    setStepIndex(0);
    setPackageTier(null);
    setDoctorId(null);
    setHospitalId(null);
    setHotelName(null);
    setDoctorOptions([]);
    setValidationError(null);
    setSaveError(null);
  }, []);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      resetWizard();
    }
    prevOpenRef.current = open;
  }, [open, resetWizard]);

  const transport = useMemo(
    () => getQuotationTransportProfile(lead.treatmentSlug),
    [lead.treatmentSlug],
  );

  const hospitals = useMemo(() => {
    if (!doctorId) return [];
    return listQuotationHospitalsForDoctor(doctorId);
  }, [doctorId]);

  const hotels = useMemo(() => {
    if (!hospitalId || !packageTier) return [];
    return listQuotationHotelsForHospital(hospitalId, packageTier);
  }, [hospitalId, packageTier]);

  // Real-time pricing calculation
  const pricing = useMemo(() => {
    if (!packageTier) return null;
    return buildQuotationPricing({
      treatmentSlug: lead.treatmentSlug,
      packageTier,
      hospitalId: hospitalId ?? undefined,
      hotelName: hotelName ?? undefined,
      clientType: lead.clientType,
      transport,
    });
  }, [
    lead.treatmentSlug,
    lead.clientType,
    packageTier,
    hospitalId,
    hotelName,
    transport,
  ]);

  const currentStep = steps[stepIndex] ?? "package";

  const goNext = useCallback(() => {
    setValidationError(null);
    if (currentStep === "package") {
      if (
        !quotationWizardPackageStepSchema.safeParse({ packageTier })
          .success
      ) {
        setValidationError(t("validationPackage"));
        return;
      }
    }
    if (currentStep === "doctor") {
      if (!quotationWizardDoctorStepSchema.safeParse({ doctorId }).success) {
        setValidationError(t("validationDoctor"));
        return;
      }
    }
    if (currentStep === "hospital") {
      const corporate = lead.clientType === "b2b" || lead.clientType === "g2b";
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
  }, [
    currentStep,
    packageTier,
    doctorId,
    hospitalId,
    lead.clientType,
    steps.length,
    t,
  ]);

  const goBack = useCallback(() => {
    setValidationError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const skipHospital = useCallback(() => {
    setValidationError(null);
    setHospitalId(null);
    setHotelName(null);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [steps.length]);

  const skipHotelStep = useCallback(() => {
    setValidationError(null);
    setHotelName(null);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [steps.length]);

  const handleSave = useCallback(async () => {
    if (!pricing) return;
    const corporate = lead.clientType === "b2b" || lead.clientType === "g2b";
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
      if (p0 === "packageTier")
        setValidationError(t("validationPackage"));
      else if (p0 === "doctorId")
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
      const updated = await crm.leads.createDraftQuotation(
        lead.id,
        {
          packageTier: tier,
          doctorId: docId,
          hospitalId: hospId ?? undefined,
          hotelName: hotelName ?? undefined,
          transportMode: transport.modeLabel,
          transportRouteCount: transport.routeCount,
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
    packageTier,
    doctorId,
    hospitalId,
    hotelName,
    lead.id,
    lead.clientType,
    pricing,
    transport,
    onOpenChange,
    onSaved,
    t,
  ]);

  const stepLabel = (step: QuotationWizardStep): string => {
    switch (step) {
      case "package":
        return t("stepPackage");
      case "doctor":
        return t("stepDoctor");
      case "hospital":
        return t("stepHospital");
      case "hotel":
        return t("stepHotel");
      case "transport":
        return t("stepTransport");
      case "review":
        return t("stepReview");
    }
  };

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <DialogShell open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={dir}
        size="xl"
        layout="scrollableTall"
        className="max-w-4xl"
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
        <div className="bg-muted/30 px-6 py-3 border-b border-border overflow-x-auto scrollbar-hide">
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
                        "size-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border",
                        active ? "bg-primary border-primary text-primary-foreground" : 
                        done ? "bg-primary/10 border-primary text-primary" : "bg-muted border-transparent text-muted-foreground/40"
                      )}>
                        {done ? <Check className="size-3" /> : i + 1}
                      </div>
                      <span className={cn(
                        "text-[11px] font-semibold uppercase tracking-wider hidden sm:inline",
                        active ? "opacity-100" : "opacity-60"
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

        <DialogBody className="space-y-6 py-6">
          {validationError || saveError ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex gap-2 items-center text-destructive">
              <Info className="size-4 shrink-0" />
              <p className="text-xs font-medium">{validationError || saveError}</p>
            </div>
          ) : null}

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {currentStep === "package" && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">{t("packageHint")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PACKAGE_TIERS.map((tier) => (
                    <button
                      key={tier}
                      onClick={() => {
                        setPackageTier(tier);
                        setDoctorId(null);
                        setHospitalId(null);
                        setHotelName(null);
                        const ids = listQuotationDoctorIds(
                          lead.treatmentSlug,
                          tier,
                        );
                        void getDoctorsByIds(ids).then(setDoctorOptions);
                      }}
                      className={cn(
                        "flex flex-col p-4 rounded-xl border text-start transition-all",
                        packageTier === tier ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-muted/20 hover:bg-muted/40"
                      )}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={cn(
                          "text-xs font-bold uppercase tracking-wider",
                          packageTier === tier ? "text-primary" : "text-muted-foreground"
                        )}>{t(`tiers.${tier}`)}</span>
                        {packageTier === tier && <Check className="size-3.5 text-primary" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {tier === "vip" ? "Premium care with 5-star accommodation and dedicated support." : 
                         tier === "gold" ? "High-end medical journey with premium stay options." :
                         tier === "silver" ? "Balanced package with quality care and comfort." :
                         "Essential medical journey with standard accommodation."}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === "doctor" && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">{t("doctorHint")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {doctorOptions.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setDoctorId(d.id);
                        setHospitalId(null);
                        setHotelName(null);
                      }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-start transition-all",
                        doctorId === d.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-muted/20 hover:bg-muted/40"
                      )}
                    >
                      <div className="size-10 rounded-lg bg-muted overflow-hidden shrink-0 border border-border relative">
                        {d.image ? (
                          <Image 
                            src={d.image} 
                            alt="" 
                            fill
                            className="object-cover" 
                          />
                        ) : (
                          <div className="size-full flex items-center justify-center text-primary font-bold text-sm bg-primary/5">
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
                        <p className="text-xs font-bold text-foreground truncate">
                          {tDoctors(
                            d.nameKey.replace(
                              /^doctors\./,
                              "",
                            ) as Parameters<typeof tDoctors>[0],
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {tDoctors(
                            d.titleKey.replace(
                              /^doctors\./,
                              "",
                            ) as Parameters<typeof tDoctors>[0],
                          )}
                        </p>
                      </div>
                      {doctorId === d.id && <Check className="size-3.5 text-primary ms-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === "hospital" && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">{t("hospitalHint")}</p>
                <div className="grid grid-cols-1 gap-2">
                  {hospitals.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => {
                        setHospitalId(h.id);
                        setHotelName(null);
                      }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-start transition-all",
                        hospitalId === h.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-muted/20 hover:bg-muted/40"
                      )}
                    >
                      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Building2 className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground">{h.name}</p>
                        {h.location && (
                          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                            <MapPin className="size-2.5" />
                            <span>{h.location}</span>
                          </div>
                        )}
                      </div>
                      {hospitalId === h.id && <Check className="size-3.5 text-primary ms-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === "hotel" && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">{t("hotelHint")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hotels.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => setHotelName(h.name)}
                      className={cn(
                        "flex flex-col p-4 rounded-xl border text-start transition-all",
                        hotelName === h.name ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-muted/20 hover:bg-muted/40"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <Hotel className="size-4" />
                        </div>
                        {hotelName === h.name && <Check className="size-3.5 text-primary" />}
                      </div>
                      <p className="text-xs font-bold text-foreground">{h.name}</p>
                      {h.type && <p className="text-[10px] text-muted-foreground mt-0.5">{h.type}</p>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === "transport" && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">{t("transportHint")}</p>
                <div className="bg-muted/20 rounded-xl p-6 border border-border flex flex-col items-center text-center space-y-3">
                  <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Truck className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-foreground">{transport.modeLabel[langKey]}</h4>
                    <p className="text-xs text-muted-foreground">
                      {t("routesLabel")}: <span className="font-bold text-foreground">{transport.routeCount}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === "review" && pricing && (
              <div className="space-y-6">
                <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                  <div className="bg-muted/30 px-4 py-3 border-b border-border flex justify-between items-center">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("reviewHint")}</h4>
                    <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary border-none">
                      {t(`tiers.${packageTier}`)}
                    </Badge>
                  </div>
                  <div className="p-4 space-y-3">
                    {pricing.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">{item.label[langKey]}</span>
                        <span className="text-xs font-bold tabular-nums">
                          {formatUSD(item.amountUSD, locale)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-3 mt-1 border-t border-border flex justify-between items-center">
                      <span className="text-sm font-bold text-primary">{t("reviewTotal")}</span>
                      <span className="text-lg font-bold tabular-nums text-primary">
                        {formatUSD(pricing.totalUSD, locale)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                    <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-1">{t("downpaymentYes")}</p>
                    <p className="text-xl font-bold text-primary tabular-nums">
                      {formatUSD(
                        pricing.downpaymentRequired ? (pricing.downpaymentUSD ?? 0) : 0,
                        locale,
                      )}
                    </p>
                  </div>
                  <div className="bg-muted/20 rounded-xl p-4 border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t("termsLabel")}</p>
                    <p className="text-[10px] leading-relaxed text-muted-foreground italic">
                      {pricing.termsAndConditions}
                    </p>
                  </div>
                </div>
              </div>
            )}
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
              {(currentStep === "hospital" && lead.clientType === "b2c") || (currentStep === "hotel" && !skipHotel) ? (
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground" 
                  onClick={currentStep === "hospital" ? skipHospital : skipHotelStep}
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
