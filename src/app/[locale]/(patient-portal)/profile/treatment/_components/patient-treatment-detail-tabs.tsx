"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MapPin,
  CalendarClock,
  Phone,
  Video,
} from "lucide-react";
import { TreatmentRequestStageVertical } from "@/components/portal/journey-timeline-vertical";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PATIENT_PENDING_FOLLOWUPS_EVENT,
  listPatientPendingFollowUps,
  markPatientPendingFollowUpContacted,
} from "@/lib/patient-pending-follow-ups";
import type { PatientNextActionModalId, PatientNextActionPlan } from "@/lib/patient-next-action";
import type {
  ConsultantProfile,
  ConsultationSlot,
  Lead,
  Patient,
  PatientPendingFollowUp,
  Quotation,
} from "@/types";
import { DocumentsSection } from "../../_components/documents-section";
import { QuotationSection } from "../../_components/quotation-section";
import { PatientNextActionModals } from "./patient-next-action-modals";

type TabId = "overview" | "quotes" | "files";

const TAB_IDS: TabId[] = ["overview", "quotes", "files"];
const EMPTY_PENDING: PatientPendingFollowUp[] = [];

function subscribePending(onStoreChange: () => void) {
  const onCustom = () => onStoreChange();
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key?.includes("amanak_patient_pending_followups")) onStoreChange();
  };
  window.addEventListener(PATIENT_PENDING_FOLLOWUPS_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(PATIENT_PENDING_FOLLOWUPS_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

function getPendingSnapshot(): PatientPendingFollowUp[] {
  return listPatientPendingFollowUps();
}

function getPendingServerSnapshot(): PatientPendingFollowUp[] {
  return EMPTY_PENDING;
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

export function PatientTreatmentDetailTabs({
  lead,
  patient,
  nextActionPlan,
  initialTab = "overview",
  initialPaymentUpload,
  consultationInitialSlots,
  consultationConsultant,
}: {
  lead: Lead;
  patient: Patient | null;
  nextActionPlan: PatientNextActionPlan;
  initialTab?: TabId;
  initialPaymentUpload?: "downpayment" | "remaining" | null;
  consultationInitialSlots: ConsultationSlot[];
  consultationConsultant: ConsultantProfile;
}) {
  const t = useTranslations("portal");
  const tCrm = useTranslations("crm");
  const locale = useLocale();
  const router = useRouter();
  const langKey = locale === "ar" ? "ar" : "en";
  const [tab, setTab] = useState<TabId>(initialTab);
  const [isActivityExpanded, setIsActivityExpanded] = useState(false);
  const [nextActionModal, setNextActionModal] = useState<PatientNextActionModalId | null>(null);
  const pendingFollowUps = useSyncExternalStore(
    subscribePending,
    getPendingSnapshot,
    getPendingServerSnapshot,
  );

  const openPendingForRequest = useMemo(
    () => pendingFollowUps.filter((row) => row.requestId === lead.id && row.status === "open"),
    [pendingFollowUps, lead.id],
  );
  const pendingCallbacks = useMemo(
    () => openPendingForRequest.filter((row) => row.kind === "callback"),
    [openPendingForRequest],
  );
  const pendingConsultations = useMemo(
    () => openPendingForRequest.filter((row) => row.kind === "consultation"),
    [openPendingForRequest],
  );

  /** Accepted quote preferred; otherwise the active / latest sent quote so payment uploads show on Files. */
  const quotationForPaymentProofs = useMemo((): Quotation | undefined => {
    const sent = lead.quotations.filter((q) => q.status === "sent_to_patient");
    if (sent.length === 0) return undefined;
    if (lead.activeQuotationId) {
      const match = sent.find((q) => q.id === lead.activeQuotationId);
      if (match) return match;
    }
    return sent.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
  }, [lead.activeQuotationId, lead.quotations]);

  const tabLabel: Record<TabId, string> = {
    overview: t("tabOverview"),
    quotes: t("tabQuotes"),
    files: t("tabFiles"),
  };
  const taskHref =
    nextActionPlan.task.cta.kind === "link"
      ? `${nextActionPlan.task.cta.href}${nextActionPlan.task.cta.href.includes("?") ? "&" : "?"}patient=${encodeURIComponent(lead.patientId)}`
      : undefined;

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  return (
    <div className="space-y-6">
      <PatientNextActionModals
        activeModal={nextActionModal}
        onOpenChange={(open) => {
          if (!open) setNextActionModal(null);
        }}
        lead={lead}
        initialSlots={consultationInitialSlots}
        consultant={consultationConsultant}
        onDocumentsUpdated={() => {
          router.refresh();
        }}
      />
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)} className="gap-6">
        <div className="-mx-1 overflow-x-auto overscroll-x-contain pb-px">
          <TabsList variant="underline" aria-label={t("profileTabsAria")}>
            {TAB_IDS.map((id) => (
              <TabsTrigger key={id} value={id} className="min-w-[5.5rem] sm:min-w-0">
                {tabLabel[id]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="min-h-[12rem]">
          <TabsContent value="overview" className="space-y-4 animate-in fade-in duration-200">
            <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
              <div className="flex flex-col gap-3">
                <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm sm:p-5">
                  <div className="flex items-center justify-between gap-3 border-b border-primary/15 pb-3">
                    <h2 className="amanak-app-panel-title text-primary">{t("nextActionTitle")}</h2>
                  </div>
                  <div className="mt-3 space-y-2">
                    <p className="text-base font-semibold text-foreground">
                      {nextActionPlan.task.title[langKey]}
                    </p>
                    {nextActionPlan.task.cta.kind === "link" && taskHref ? (
                      <Button asChild size="sm" className="mt-1">
                        <Link href={taskHref} prefetch={false}>
                          {nextActionPlan.task.ctaLabel[langKey]}
                        </Link>
                      </Button>
                    ) : null}
                    {nextActionPlan.task.cta.kind === "modal" ? (
                      <Button
                        type="button"
                        size="sm"
                        className="mt-1"
                        onClick={() => {
                          const cta = nextActionPlan.task.cta;
                          if (cta.kind === "modal") setNextActionModal(cta.modalId);
                        }}
                      >
                        {nextActionPlan.task.ctaLabel[langKey]}
                      </Button>
                    ) : null}
                    {pendingCallbacks.length > 0 ? (
                      <div className="mt-4 space-y-3 border-t border-primary/15 pt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                          {t("pendingFollowUpCallbackHeading")}
                        </p>
                        {pendingCallbacks.map((row) => (
                          <div
                            key={row.id}
                            className="rounded-xl border border-primary/20 bg-background/60 p-3 text-sm"
                          >
                            <p className="text-muted-foreground">{t("pendingFollowUpAwaitingTeam")}</p>
                            {row.contactTime ? (
                              <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                                <CalendarClock className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                                <span>{t("pendingFollowUpPreferredTime", { time: row.contactTime })}</span>
                              </p>
                            ) : null}
                            {row.phone ? (
                              <p className="mt-1 flex items-start gap-2 text-xs text-muted-foreground">
                                <Phone className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                                <span>{t("pendingFollowUpPhone", { phone: row.phone })}</span>
                              </p>
                            ) : null}
                            <p className="mt-2 text-xs text-muted-foreground">
                              {t("pendingFollowUpRequestedAt", {
                                datetime: formatDateTime(row.createdAt, locale),
                              })}
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-3"
                              onClick={() => markPatientPendingFollowUpContacted(row.id)}
                            >
                              {t("pendingFollowUpMarkContactedDemo")}
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </section>

                {nextActionPlan.upcomingEvent || pendingConsultations.length > 0 ? (
                  <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm sm:p-5">
                    <div className="flex items-center justify-between gap-3 border-b border-primary/15 pb-3">
                      <h2 className="amanak-app-panel-title text-primary">{t("nextActionUpcomingEvent")}</h2>
                    </div>
                    <div className="mt-3 space-y-6">
                      {nextActionPlan.upcomingEvent ? (
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {nextActionPlan.upcomingEvent.title[langKey]}
                          </p>
                          <p className="mt-2 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                            <CalendarClock className="size-3.5 shrink-0 text-primary" aria-hidden />
                            <span className="tabular-nums">
                              {formatDateTime(nextActionPlan.upcomingEvent.startsAt, locale)}
                            </span>
                          </p>
                          <div className="mt-3 flex flex-col gap-2">
                            {nextActionPlan.upcomingEvent.mapUrl ? (
                              <p className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                                <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden />
                                <a
                                  href={nextActionPlan.upcomingEvent.mapUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={nextActionPlan.upcomingEvent.mapUrl}
                                  className="min-w-0 flex-1 truncate font-mono text-primary underline-offset-2 hover:underline"
                                >
                                  {nextActionPlan.upcomingEvent.mapUrl}
                                </a>
                              </p>
                            ) : null}
                            {nextActionPlan.upcomingEvent.meetingUrl ? (
                              <Button asChild variant="outline" size="sm">
                                <a
                                  href={nextActionPlan.upcomingEvent.meetingUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {t("nextActionJoinCall")}
                                  <ExternalLink className="ms-1 size-3.5" />
                                </a>
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                      {pendingConsultations.length > 0 ? (
                        <div className={nextActionPlan.upcomingEvent ? "border-t border-primary/15 pt-4" : ""}>
                          <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                            {t("pendingFollowUpConsultationHeading")}
                          </p>
                          {pendingConsultations.map((row) => (
                            <div key={row.id} className="mt-3 rounded-xl border border-primary/20 bg-background/60 p-3">
                              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                                <Video className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                                <span>{t("pendingFollowUpConsultationPendingDetail")}</span>
                              </p>
                              {row.bookingId ? (
                                <p className="mt-2 font-mono text-xs text-foreground">
                                  {t("pendingFollowUpBookingRef", { id: row.bookingId })}
                                </p>
                              ) : null}
                              <p className="mt-2 text-xs text-muted-foreground">
                                {t("pendingFollowUpRequestedAt", {
                                  datetime: formatDateTime(row.createdAt, locale),
                                })}
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-3"
                                onClick={() => markPatientPendingFollowUpContacted(row.id)}
                              >
                                {t("pendingFollowUpMarkContactedDemo")}
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </section>
                ) : null}

              </div>

              <section className="rounded-2xl border border-border/50 bg-card shadow-sm">
                <div className="border-b border-border/40 px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2">
                    <Activity className="size-4 text-primary" aria-hidden />
                    <h2 className="amanak-app-panel-title">{t("leadJourney.sectionTitle")}</h2>
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <TreatmentRequestStageVertical lead={lead} isExpanded={isActivityExpanded} />
                  <div className="mt-3 flex justify-center border-t border-border/40 pt-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="group h-8 w-full gap-2 text-sm font-medium text-primary hover:bg-primary/5"
                      onClick={() => setIsActivityExpanded((prev) => !prev)}
                    >
                      {isActivityExpanded ? (
                        <>
                          {tCrm("convShowLess")}
                          <ChevronUp className="size-3.5 transition-transform group-hover:-translate-y-0.5" />
                        </>
                      ) : (
                        <>
                          {tCrm("convShowMore")}
                          <ChevronDown className="size-3.5 transition-transform group-hover:translate-y-0.5" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </section>
            </div>

          </TabsContent>

          <TabsContent value="quotes" className="animate-in fade-in duration-200">
            <QuotationSection
              quotations={lead.quotations}
              activeQuotationId={lead.activeQuotationId}
              treatmentSlug={lead.treatmentSlug}
              clientType={patient?.clientType ?? "b2c"}
              leadId={lead.id}
              onPaymentProofUploaded={() => {
                router.refresh();
              }}
            />
          </TabsContent>

          <TabsContent value="files" className="animate-in fade-in duration-200">
            <DocumentsSection
              leadId={lead.id}
              initialDocuments={lead.documents}
              paymentQuotation={quotationForPaymentProofs}
              initialPaymentUpload={initialPaymentUpload}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
