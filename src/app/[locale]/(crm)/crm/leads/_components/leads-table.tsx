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
import { Search, Filter, ChevronRight, Calendar, MapPin, Activity } from "lucide-react";

const ALL_STATUSES: (LeadStatus | "all")[] = ["all", ...ORDERED_STATES, "rejected"];

function statusBadgeClass(status: LeadStatus): string {
  switch (status) {
    case "rejected":
      return "bg-destructive/10 text-destructive border-transparent hover:bg-destructive/20";
    case "in_treatment":
    case "post_treatment":
    case "specialized_doctor_assigned":
    case "order_created":
      return "bg-primary text-primary-foreground border-transparent hover:bg-primary/90";
    case "approved":
    case "quotation_generated":
    case "contract_sent":
    case "customer_accepted":
    case "payment_verified":
      return "bg-primary/10 text-primary border-transparent hover:bg-primary/20";
    default:
      return "bg-muted text-muted-foreground border-transparent hover:bg-muted/80";
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
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          l.patientName.toLowerCase().includes(query) ||
          l.patientCountry.toLowerCase().includes(query) ||
          l.treatmentSlug.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [leads, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border border-border/50 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("filterByCountry") + " / " + t("patientName")}
            className="ps-10 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "all")}
            className="h-10 min-w-[160px] rounded-md border-none bg-muted/30 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-colors"
            aria-label={t("filterByStatus")}
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? t("allStatuses") : getStatusLabel(s)[langKey]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-card rounded-xl border border-dashed border-border">
            <Search className="size-12 text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground font-medium">{t("noResults")}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {/* Desktop Header */}
            <div className="hidden lg:grid grid-cols-[2fr_1fr_1.2fr_1.4fr_0.8fr_1fr_0.8fr] items-center gap-4 px-6 py-3 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70">
              <span>{t("patientName")}</span>
              <span>{t("country")}</span>
              <span>{t("treatment")}</span>
              <span>{t("status")}</span>
              <span>{t("clientType")}</span>
              <span>{t("lastUpdated")}</span>
              <span className="text-end">{t("actions")}</span>
            </div>

            {/* Rows */}
            {filtered.map((lead) => (
              <div
                key={lead.id}
                className="group relative bg-card hover:bg-accent/5 transition-all duration-200 rounded-xl border border-border/50 shadow-sm hover:shadow-md overflow-hidden"
              >
                <div className="lg:grid lg:grid-cols-[2fr_1fr_1.2fr_1.4fr_0.8fr_1fr_0.8fr] lg:items-center lg:gap-4 p-4 lg:px-6 lg:py-4">
                  {/* Name & Mobile Info */}
                  <div className="flex items-start justify-between lg:block mb-3 lg:mb-0">
                    <div>
                      <h3 className="font-bold text-foreground text-base lg:text-sm group-hover:text-primary transition-colors">
                        {lead.patientName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 lg:hidden">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tight py-0">
                          {lead.clientType}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="size-3" />
                          {lead.patientCountry}
                        </span>
                      </div>
                    </div>
                    <div className="lg:hidden">
                      <Badge className={cn("text-[10px] px-2 py-0.5", statusBadgeClass(lead.status))}>
                        {getStatusLabel(lead.status)[langKey]}
                      </Badge>
                    </div>
                  </div>

                  {/* Desktop Only Columns */}
                  <div className="hidden lg:flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="size-3.5 opacity-50" />
                    <span>{lead.patientCountry}</span>
                  </div>
                  <div className="hidden lg:flex items-center gap-1.5 text-muted-foreground">
                    <Activity className="size-3.5 opacity-50" />
                    <span className="truncate">{lead.treatmentSlug}</span>
                  </div>
                  <div className="hidden lg:block">
                    <Badge className={cn("text-[10px] px-2.5 py-0.5 font-medium", statusBadgeClass(lead.status))}>
                      {getStatusLabel(lead.status)[langKey]}
                    </Badge>
                  </div>
                  <div className="hidden lg:block">
                    <span className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded">
                      {lead.clientType}
                    </span>
                  </div>
                  <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="size-3.5 opacity-50" />
                    <span>{formatDate(lead.updatedAt, locale)}</span>
                  </div>

                  {/* Mobile Details Row */}
                  <div className="flex items-center justify-between lg:hidden border-t border-border/40 pt-3 mt-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                        {t("treatment")}
                      </span>
                      <span className="text-xs font-medium">{lead.treatmentSlug}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                        {t("lastUpdated")}
                      </span>
                      <span className="text-xs">{formatDate(lead.updatedAt, locale)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 lg:mt-0 lg:text-end flex justify-end">
                    <Link href={`/crm/leads/${lead.id}`} prefetch={false} className="w-full lg:w-auto">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="w-full lg:w-auto group/btn hover:bg-primary hover:text-primary-foreground transition-all rounded-lg"
                      >
                        <span className="lg:hidden">{t("viewDetails")}</span>
                        <span className="hidden lg:inline">{t("view")}</span>
                        <ChevronRight className="ms-1 size-4 transition-transform group-hover/btn:translate-x-1 rtl:rotate-180 rtl:group-hover/btn:-translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
