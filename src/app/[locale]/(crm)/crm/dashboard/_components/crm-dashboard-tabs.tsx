"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const KPIS = [
  { key: "newLeads", value: "250" },
  { key: "waitlistVolume", value: "18" },
  { key: "docsMissingCases", value: "12" },
  { key: "avgConsultantReview", value: "1.5d" },
  { key: "ordersCreated", value: "75" },
  { key: "postTreatmentCheckins", value: "120" },
] as const;

const FUNNEL = [
  { label: "leadCreated", count: 250 },
  { label: "assigned", count: 220 },
  { label: "docsComplete", count: 150 },
  { label: "quotationGenerated", count: 90 },
  { label: "contractSigned", count: 60 },
  { label: "inTreatment", count: 40 },
] as const;

const REJECTION_REASONS = [
  "priceHigh",
  "medicalNotFeasible",
  "patientUnresponsive",
] as const;

type DashTab = "overview" | "pipeline" | "rejections";

const DASH_TABS: DashTab[] = ["overview", "pipeline", "rejections"];

export function CrmDashboardTabs() {
  const t = useTranslations("crm");
  const [tab, setTab] = useState<DashTab>("overview");
  const max = FUNNEL[0].count;

  const labels: Record<DashTab, string> = {
    overview: t("dashTabOverview"),
    pipeline: t("dashTabPipeline"),
    rejections: t("dashTabRejections"),
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-8">
      <header className="space-y-2 border-b border-border/40 pb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("dashboard")}
        </h1>
      </header>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as DashTab)}
        className="gap-6"
      >
        <div className="-mx-1 overflow-x-auto overscroll-x-contain pb-px">
          <TabsList variant="underline" aria-label={t("dashboardTabsAria")}>
            {DASH_TABS.map((id) => (
              <TabsTrigger key={id} value={id} className="min-w-[5.5rem] sm:min-w-0">
                {labels[id]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="min-h-[12rem]">
          <TabsContent
            value="overview"
            className="grid grid-cols-2 gap-3 animate-in fade-in duration-200 sm:grid-cols-3 lg:grid-cols-6"
          >
            {KPIS.map((kpi) => (
              <Card key={kpi.key} size="sm">
                <CardHeader>
                  <CardTitle className="text-xs text-muted-foreground">
                    {t(`kpis.${kpi.key}`)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold tabular-nums text-primary">
                    {kpi.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="pipeline" className="animate-in fade-in duration-200">
            <Card>
              <CardHeader>
                <CardTitle>{t("conversionFunnel")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {FUNNEL.map((row) => {
                  const pct = Math.round((row.count / max) * 100);
                  return (
                    <div key={row.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">
                          {t(`funnel.${row.label}`)}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {row.count}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejections" className="animate-in fade-in duration-200">
            <Card>
              <CardHeader>
                <CardTitle>{t("rejectionReasons")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {REJECTION_REASONS.map((reason) => (
                    <li
                      key={reason}
                      className="flex items-center justify-between rounded-xl border border-border/50 bg-card px-4 py-3"
                    >
                      <span className="text-foreground">
                        {t(`rejection.${reason}`)}
                      </span>
                      <span className="text-xs text-muted-foreground">—</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
