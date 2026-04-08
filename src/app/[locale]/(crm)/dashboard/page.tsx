import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default async function CrmDashboardPage() {
  const t = await getTranslations("crm");
  const max = FUNNEL[0].count;

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-semibold text-foreground">{t("dashboard")}</h1>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
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

        <Card>
          <CardHeader>
            <CardTitle>{t("rejectionReasons")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {REJECTION_REASONS.map((reason) => (
                <li
                  key={reason}
                  className="flex items-center justify-between rounded-md border border-border/60 bg-card px-3 py-2"
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
      </section>
    </div>
  );
}
