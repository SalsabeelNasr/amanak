"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JourneyTimelineVertical } from "@/components/portal/journey-timeline-vertical";
import {
  applyTransition,
  getAvailableTransitions,
  getStatusLabel,
  isTerminalState,
} from "@/lib/services/state-machine.service";
import { updateLead } from "@/lib/api/leads";
import { useSession } from "@/lib/mock-session";
import type { Lead, StateTransition } from "@/types";
import { cn } from "@/lib/utils";
import {
  Activity,
  Phone,
  Globe,
  Stethoscope,
  UserCheck,
  FileText,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  FileCheck,
  User,
  Calendar,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

type TabId = "overview" | "activity" | "quotes" | "files";

const TAB_IDS: TabId[] = ["overview", "activity", "quotes", "files"];

function formatDateTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusOverviewClass(status: Lead["status"]): string {
  switch (status) {
    case "rejected":
      return "bg-destructive/10 text-destructive border-transparent";
    case "in_treatment":
    case "post_treatment":
    case "specialized_doctor_assigned":
    case "order_created":
      return "bg-primary text-primary-foreground border-transparent";
    case "approved":
    case "quotation_generated":
    case "contract_sent":
    case "customer_accepted":
    case "payment_verified":
      return "bg-primary/10 text-primary border-transparent";
    default:
      return "bg-muted text-muted-foreground border-transparent";
  }
}

export function LeadDetail({ initialLead }: { initialLead: Lead }) {
  const t = useTranslations("crm");
  const tPortal = useTranslations("portal");
  const locale = useLocale();
  const langKey = locale === "ar" ? "ar" : "en";
  const { session } = useSession();
  const [lead, setLead] = useState<Lead>(initialLead);
  const [tab, setTab] = useState<TabId>("overview");
  const [pendingTransition, setPendingTransition] =
    useState<StateTransition | null>(null);
  const [note, setNote] = useState("");
  const [successFlash, setSuccessFlash] = useState(false);

  const availableTransitions = useMemo(
    () =>
      session.isAuthenticated
        ? getAvailableTransitions(lead.status, session.user.role)
        : [],
    [lead.status, session],
  );

  useEffect(() => {
    if (!successFlash) return;
    const timer = setTimeout(() => setSuccessFlash(false), 2000);
    return () => clearTimeout(timer);
  }, [successFlash]);

  async function handleConfirm() {
    if (!pendingTransition || !session.isAuthenticated) return;
    if (pendingTransition.requiresNote && !note.trim()) return;
    try {
      const updated = applyTransition(
        lead,
        pendingTransition.action,
        session.user,
        note.trim() || undefined,
      );
      setLead(updated);
      setPendingTransition(null);
      setNote("");
      setSuccessFlash(true);
      void updateLead(lead.id, updated);
    } catch (err) {
      console.error(err);
    }
  }

  const activeQuotation = lead.activeQuotationId
    ? lead.quotations.find((q) => q.id === lead.activeQuotationId)
    : undefined;

  const tabLabel: Record<TabId, string> = {
    overview: t("tabOverview"),
    activity: t("tabActivity"),
    quotes: t("tabQuotes"),
    files: t("tabFiles"),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-8">
      <div className="flex flex-col gap-4 border-b border-border/40 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/crm/leads"
            className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ChevronLeft className="size-3 rtl:rotate-180" />
            {t("leads")}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {lead.patientName}
            </h1>
            <Badge
              variant="outline"
              className="bg-muted/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
            >
              {lead.clientType}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col gap-1 sm:items-end sm:text-end">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {t("status")}
          </p>
          <Badge
            className={cn(
              "w-fit px-3 py-1 text-xs font-semibold shadow-sm",
              statusOverviewClass(lead.status),
            )}
          >
            {getStatusLabel(lead.status)[langKey]}
          </Badge>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TabId)}
        className="gap-6"
      >
        <div className="-mx-1 overflow-x-auto overscroll-x-contain pb-px">
          <TabsList variant="underline" aria-label={t("leadDetailTabsAria")}>
            {TAB_IDS.map((id) => (
              <TabsTrigger key={id} value={id} className="min-w-[5.5rem] sm:min-w-0">
                {tabLabel[id]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="min-h-[12rem]">
          <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-200">
            <section className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("currentStatus")}
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Badge
                  className={cn(
                    "w-fit px-3 py-1 text-sm font-semibold",
                    statusOverviewClass(lead.status),
                  )}
                >
                  {getStatusLabel(lead.status)[langKey]}
                </Badge>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  <span>
                    {t("lastUpdatedDetail")}: {formatDateTime(lead.updatedAt, locale)}
                  </span>
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/40 bg-muted/5 px-5 py-4 sm:px-6">
                <User className="size-4 text-primary" aria-hidden />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  {tPortal("personalInfo")}
                </h2>
              </div>
              <div className="space-y-5 p-5 sm:p-6">
                <div className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/5">
                    <Phone className="size-4 text-primary" aria-hidden />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {tPortal("phone")}
                    </p>
                    <p className="font-semibold text-foreground">{lead.patientPhone}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/5">
                    <Globe className="size-4 text-primary" aria-hidden />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {tPortal("country")}
                    </p>
                    <p className="font-semibold text-foreground">{lead.patientCountry}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/5">
                    <Stethoscope className="size-4 text-primary" aria-hidden />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t("treatment")}
                    </p>
                    <p className="font-semibold text-foreground">{lead.treatmentSlug}</p>
                  </div>
                </div>
                {lead.assignedCsId ? (
                  <div className="flex gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/5">
                      <UserCheck className="size-4 text-primary" aria-hidden />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {t("assignedCs")}
                      </p>
                      <p className="font-semibold text-foreground">{lead.assignedCsId}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/40 bg-muted/5 px-5 py-4 sm:px-6">
                <Activity className="size-4 text-primary" aria-hidden />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  {t("availableActions")}
                </h2>
              </div>
              <div className="space-y-4 p-5 sm:p-6">
                {successFlash ? (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-600 animate-in fade-in slide-in-from-top-1">
                    <CheckCircle2 className="size-3.5" aria-hidden />
                    {t("updated")}
                  </div>
                ) : null}

                {isTerminalState(lead.status) || availableTransitions.length === 0 ? (
                  <div className="py-4 text-center">
                    <Clock className="mx-auto mb-2 size-8 text-muted-foreground/20" aria-hidden />
                    <p className="text-xs text-muted-foreground">{t("noActions")}</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableTransitions.map((tr) => (
                      <Button
                        key={tr.action + tr.from}
                        type="button"
                        size="sm"
                        variant={
                          pendingTransition?.action === tr.action ? "default" : "outline"
                        }
                        className={cn(
                          "rounded-full px-4 text-xs font-medium transition-all",
                          pendingTransition?.action === tr.action
                            ? "shadow-md"
                            : "hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
                        )}
                        onClick={() => {
                          setPendingTransition(tr);
                          setNote("");
                        }}
                      >
                        {tr.label[langKey]}
                      </Button>
                    ))}
                  </div>
                )}

                {pendingTransition ? (
                  <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        {pendingTransition.label[langKey]}
                      </p>
                      <button
                        type="button"
                        className="rounded-md text-muted-foreground transition-colors hover:text-destructive"
                        onClick={() => setPendingTransition(null)}
                        aria-label={t("cancel")}
                      >
                        <XCircle className="size-4" />
                      </button>
                    </div>

                    {pendingTransition.requiresNote ? (
                      <div className="space-y-2">
                        <Label
                          htmlFor="action-note"
                          className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                        >
                          {t("addNote")}
                        </Label>
                        <textarea
                          id="action-note"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="..."
                          className="min-h-20 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                      </div>
                    ) : null}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1 rounded-lg shadow-sm"
                        onClick={handleConfirm}
                        disabled={pendingTransition.requiresNote && !note.trim()}
                      >
                        {t("confirm")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => {
                          setPendingTransition(null);
                          setNote("");
                        }}
                      >
                        {t("cancel")}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6 animate-in fade-in duration-200">
            <section className="rounded-2xl border border-border/50 bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/40 bg-muted/5 px-5 py-4 sm:px-6">
                <Activity className="size-4 text-primary" aria-hidden />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  {tPortal("journey")}
                </h2>
              </div>
              <div className="p-5 sm:p-6">
                <JourneyTimelineVertical lead={lead} />
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/40 bg-muted/5 px-5 py-4 sm:px-6">
                <History className="size-4 text-primary" aria-hidden />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  {t("statusHistory")}
                </h2>
              </div>
              <div className="p-5 sm:p-6">
                {lead.statusHistory.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    {t("noHistory")}
                  </p>
                ) : (
                  <div className="relative space-y-6 before:absolute before:inset-0 before:start-[11px] before:w-px before:bg-border/60">
                    {[...lead.statusHistory].reverse().map((entry, idx) => (
                      <div key={idx} className="group relative ps-8">
                        <div className="absolute start-0 top-1 z-10 flex size-[22px] items-center justify-center rounded-full border-2 border-primary/20 bg-background transition-colors group-hover:border-primary">
                          <div className="size-1.5 rounded-full bg-primary/40 transition-colors group-hover:bg-primary" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-foreground">
                              {getStatusLabel(entry.from)[langKey]} →{" "}
                              {getStatusLabel(entry.to)[langKey]}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60">
                              {formatDateTime(entry.timestamp, locale)}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{entry.actorRole}</p>
                          {entry.note ? (
                            <div className="mt-2 rounded-lg border border-border/20 bg-muted/30 p-2 text-[11px] text-muted-foreground">
                              {entry.note}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="quotes" className="animate-in fade-in duration-200">
            {activeQuotation ? (
              <section className="overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-2">
                    <FileCheck className="size-4" aria-hidden />
                    <h2 className="text-sm font-bold uppercase tracking-wider">
                      {t("activeQuotation")}
                    </h2>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-white/20 text-[10px] font-bold uppercase tracking-widest text-white"
                  >
                    {activeQuotation.packageTier}
                  </Badge>
                </div>
                <div className="space-y-4 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/60">
                        {tPortal("total")}
                      </p>
                      <p className="text-3xl font-bold tracking-tight">
                        ${activeQuotation.totalUSD.toLocaleString()}
                      </p>
                    </div>
                    <Badge className="bg-white px-3 py-1 text-[10px] font-bold text-primary hover:bg-white/90">
                      {activeQuotation.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </section>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
                <p className="text-sm text-muted-foreground">{t("noActiveQuotation")}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="animate-in fade-in duration-200">
            <section className="rounded-2xl border border-border/50 bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/40 bg-muted/5 px-5 py-4 sm:px-6">
                <FileText className="size-4 text-primary" aria-hidden />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  {tPortal("documents")}
                </h2>
              </div>
              <div className="p-5 sm:p-6">
                {lead.documents.length === 0 ? (
                  <div className="py-6 text-center">
                    <FileText className="mx-auto mb-2 size-8 text-muted-foreground/20" aria-hidden />
                    <p className="text-xs text-muted-foreground">{tPortal("noDocs")}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lead.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="group flex items-center justify-between rounded-xl border border-border/40 bg-muted/10 p-3 transition-colors hover:bg-muted/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-background shadow-sm">
                            <FileText className="size-3.5 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden />
                          </div>
                          <span className="text-xs font-medium text-foreground">{doc.name}</span>
                        </div>
                        {doc.status === "verified" ? (
                          <Badge className="border-transparent bg-emerald-500/10 px-2 py-0 text-[10px] text-emerald-600">
                            {tPortal("docVerified")}
                          </Badge>
                        ) : null}
                        {doc.status === "uploaded" ? (
                          <Badge variant="secondary" className="px-2 py-0 text-[10px]">
                            {tPortal("docUploaded")}
                          </Badge>
                        ) : null}
                        {doc.status === "pending" ? (
                          <Badge
                            variant="outline"
                            className="px-2 py-0 text-[10px] text-muted-foreground"
                          >
                            {tPortal("docPending")}
                          </Badge>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
