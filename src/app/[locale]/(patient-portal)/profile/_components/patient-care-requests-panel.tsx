"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { patientTreatmentTitle } from "@/lib/patient-treatment-label";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Lead, PatientCareRequest } from "@/types";

function formatDateTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PatientCareRequestsPanel({
  lead,
  requests,
}: {
  lead: Lead;
  requests: PatientCareRequest[];
}) {
  const t = useTranslations("portal");
  const tTreatments = useTranslations("treatments");
  const locale = useLocale();

  const sorted = useMemo(
    () => [...requests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [requests],
  );

  return (
    <section className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-6">
      <h2 className="amanak-app-panel-title">{t("careRequestsTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("careRequestsIntro")}</p>
      {sorted.length > 0 ? (
        <ul className="mt-4 space-y-3">
          <li>
            <Link
              href={`${ROUTES.patientTreatmentDetails}?patient=${encodeURIComponent(lead.patientId)}`}
              prefetch={false}
              className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-primary/30 bg-card px-5 py-4 text-start shadow-sm transition-colors hover:bg-primary/5"
            >
              <div className="absolute start-0 top-0 h-full w-3 bg-primary" aria-hidden />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {patientTreatmentTitle(lead.treatmentSlug, (key) => tTreatments(key))}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("careRequestActiveCase")}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-transparent bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  {t("active")}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                  {t("careRequestViewDetails")}
                  <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                </span>
              </div>
            </Link>
          </li>
          {sorted.map((r) => {
            const href = `${ROUTES.patientTreatmentDetails}?patient=${encodeURIComponent(lead.patientId)}&request=${encodeURIComponent(r.id)}`;
            const title = patientTreatmentTitle(r.treatmentSlug, (key) => tTreatments(key));
            const matchesLead = r.treatmentSlug === lead.treatmentSlug;
            return (
              <li key={r.id}>
                <Link
                  href={href}
                  prefetch={false}
                  className={cn(
                    "relative flex flex-col gap-2 overflow-hidden rounded-2xl border bg-card px-5 py-4 text-start shadow-sm transition-colors sm:flex-row sm:items-center sm:justify-between",
                    matchesLead
                      ? "border-primary/30 hover:bg-primary/5"
                      : "border-border/50 hover:bg-muted/20",
                  )}
                >
                  {matchesLead ? (
                    <div className="absolute start-0 top-0 h-full w-3 bg-primary" aria-hidden />
                  ) : null}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t("careRequestSubmittedAt")}: {formatDateTime(r.createdAt, locale)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {matchesLead ? (
                      <span className="rounded-full border border-transparent bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {t("active")}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      {t("careRequestViewDetails")}
                      <ChevronRight className="size-3.5 rtl:rotate-180" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{t("careRequestsEmptyHint")}</p>
      )}
    </section>
  );
}
