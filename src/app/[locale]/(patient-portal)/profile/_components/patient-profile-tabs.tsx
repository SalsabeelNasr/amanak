"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { User, Phone, Globe, Shield, Stethoscope, Calendar } from "lucide-react";
import { JourneyTimelineVertical } from "@/components/portal/journey-timeline-vertical";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStatusLabel } from "@/lib/services/state-machine.service";
import type { Lead } from "@/types";
import { cn } from "@/lib/utils";
import { DocumentsSection } from "./documents-section";
import { QuotationSection } from "./quotation-section";

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

export function PatientProfileTabs({ lead }: { lead: Lead }) {
  const t = useTranslations("portal");
  const locale = useLocale();
  const langKey = locale === "ar" ? "ar" : "en";
  const [tab, setTab] = useState<TabId>("overview");

  const activeQuotation = lead.activeQuotationId
    ? lead.quotations.find((q) => q.id === lead.activeQuotationId) ?? null
    : null;

  const tabLabel: Record<TabId, string> = {
    overview: t("tabOverview"),
    activity: t("tabActivity"),
    quotes: t("tabQuotes"),
    files: t("tabFiles"),
  };

  return (
    <div className="space-y-6">
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TabId)}
        className="gap-6"
      >
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
          <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-200">
            <section className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-6">
              <p className="amanak-app-field-label">{t("currentStatus")}</p>
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
                    {t("lastUpdated")}: {formatDateTime(lead.updatedAt, locale)}
                  </span>
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2 border-b border-border/40 pb-4">
                <User className="size-4 text-primary" aria-hidden />
                <h2 className="amanak-app-panel-title">{t("personalInfo")}</h2>
              </div>
              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex gap-3">
                  <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div>
                    <dt className="amanak-app-field-label">
                      {t("phone")}
                    </dt>
                    <dd className="mt-0.5 font-semibold text-foreground">{lead.patientPhone}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Globe className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div>
                    <dt className="amanak-app-field-label">
                      {t("country")}
                    </dt>
                    <dd className="mt-0.5 font-semibold text-foreground">{lead.patientCountry}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Stethoscope className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div>
                    <dt className="amanak-app-field-label">
                      {t("treatment")}
                    </dt>
                    <dd className="mt-0.5 font-semibold text-foreground">{lead.treatmentSlug}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Shield className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div>
                    <dt className="amanak-app-field-label">
                      {t("clientType")}
                    </dt>
                    <dd className="mt-1">
                      <Badge variant="secondary" className="text-xs font-medium">
                        {lead.clientType}
                      </Badge>
                    </dd>
                  </div>
                </div>
              </dl>
            </section>
          </TabsContent>

          <TabsContent value="activity" className="animate-in fade-in duration-200">
            <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-6">
              <JourneyTimelineVertical lead={lead} />
            </div>
          </TabsContent>

          <TabsContent value="quotes" className="animate-in fade-in duration-200">
            <QuotationSection quotation={activeQuotation} />
          </TabsContent>

          <TabsContent value="files" className="animate-in fade-in duration-200">
            <DocumentsSection leadId={lead.id} initialDocuments={lead.documents} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
