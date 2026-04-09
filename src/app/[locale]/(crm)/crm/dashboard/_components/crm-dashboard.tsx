import { getTranslations } from "next-intl/server";
import { BarChart3, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

function WidgetSection({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

export async function CrmDashboard() {
  const t = await getTranslations("crm");
  const max = FUNNEL[0].count;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:space-y-8 sm:p-8">
      <header className="space-y-2 border-b border-border/40 pb-6 sm:pb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("dashboard")}
        </h1>
      </header>

      <div className="grid auto-rows-min gap-4 sm:gap-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {KPIS.map((kpi) => (
            <Card key={kpi.key} size="sm" className="shadow-sm ring-1 ring-border/40">
              <CardHeader>
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {t(`kpis.${kpi.key}`)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums text-primary">{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
          <WidgetSection className="lg:col-span-7 xl:col-span-8">
            <div className="flex items-center gap-2 border-b border-border/40 pb-4">
              <BarChart3 className="size-4 shrink-0 text-primary" aria-hidden />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {t("conversionFunnel")}
              </h2>
            </div>
            <div className="mt-5 space-y-3">
              {FUNNEL.map((row) => {
                const pct = Math.round((row.count / max) * 100);
                return (
                  <div key={row.label} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-foreground">
                        {t(`funnel.${row.label}`)}
                      </span>
                      <span className="tabular-nums text-muted-foreground">{row.count}</span>
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
            </div>
          </WidgetSection>

          <WidgetSection className="lg:col-span-5 xl:col-span-4">
            <div className="flex items-center gap-2 border-b border-border/40 pb-4">
              <ShieldAlert className="size-4 shrink-0 text-primary" aria-hidden />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {t("rejectionReasons")}
              </h2>
            </div>
            <ul className="mt-5 space-y-2 text-sm">
              {REJECTION_REASONS.map((reason) => (
                <li
                  key={reason}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3"
                >
                  <span className="text-foreground">{t(`rejection.${reason}`)}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">—</span>
                </li>
              ))}
            </ul>
          </WidgetSection>
        </div>
      </div>
    </div>
  );
}
