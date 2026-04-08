"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ORDERED_STATES,
  getStatusLabel,
} from "@/lib/services/state-machine.service";
import type { Lead, LeadStatus } from "@/types";
import { cn } from "@/lib/utils";

const ALL_STATUSES: (LeadStatus | "all")[] = ["all", ...ORDERED_STATES, "rejected"];

function statusBadgeClass(status: LeadStatus): string {
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

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const t = useTranslations("crm");
  const locale = useLocale();
  const langKey = locale === "ar" ? "ar" : "en";
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [country, setCountry] = useState("");

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (country && !l.patientCountry.toLowerCase().includes(country.toLowerCase()))
        return false;
      return true;
    });
  }, [leads, statusFilter, country]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "all")}
            className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t("filterByStatus")}
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? t("allStatuses") : getStatusLabel(s)[langKey]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <Input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder={t("filterByCountry")}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Header row */}
          <div className="hidden grid-cols-[2fr_1fr_1.2fr_1.4fr_0.8fr_1fr_0.8fr] items-center gap-3 border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground sm:grid">
            <span>{t("patientName")}</span>
            <span>{t("country")}</span>
            <span>{t("treatment")}</span>
            <span>{t("status")}</span>
            <span>{t("clientType")}</span>
            <span>{t("lastUpdated")}</span>
            <span className="text-end">{t("actions")}</span>
          </div>

          <div className="divide-y divide-border">
            {filtered.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                {t("noResults")}
              </p>
            )}
            {filtered.map((lead) => (
              <div
                key={lead.id}
                className="grid grid-cols-1 items-center gap-2 px-4 py-3 text-sm sm:grid-cols-[2fr_1fr_1.2fr_1.4fr_0.8fr_1fr_0.8fr] sm:gap-3"
              >
                <span className="font-medium text-foreground">
                  {lead.patientName}
                </span>
                <span className="text-muted-foreground">{lead.patientCountry}</span>
                <span className="text-muted-foreground">{lead.treatmentSlug}</span>
                <span>
                  <Badge className={cn(statusBadgeClass(lead.status))}>
                    {getStatusLabel(lead.status)[langKey]}
                  </Badge>
                </span>
                <span className="uppercase text-xs text-muted-foreground">
                  {lead.clientType}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(lead.updatedAt, locale)}
                </span>
                <span className="sm:text-end">
                  <Link href={`/crm/leads/${lead.id}`} prefetch={false}>
                    <Button type="button" variant="ghost" size="sm">
                      {t("view")}
                    </Button>
                  </Link>
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
