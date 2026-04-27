"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/crm/empty-state";
import { formatDate } from "@/components/crm/date-format";
import { useLangKey } from "@/components/crm/use-lang-key";
import { StatusBadge } from "@/components/crm/status-badge";
import {
  ORDERED_STATES,
  getStatusLabel,
} from "@/lib/services/state-machine.service";
import type { Lead, LeadStatus } from "@/types";
import { cn } from "@/lib/utils";
import {
  Search,
  Filter,
  ChevronRight,
  Calendar,
  MapPin,
  Activity,
  X,
} from "lucide-react";

const ALL_STATUSES: (LeadStatus | "all")[] = ["all", ...ORDERED_STATES];

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const t = useTranslations("crm");
  const locale = useLocale();
  const langKey = useLangKey();
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterOpen) return;
    const close = () => setFilterOpen(false);
    const onPointerDown = (e: PointerEvent) => {
      if (filterPanelRef.current?.contains(e.target as Node)) return;
      close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [filterOpen]);

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

  const hasActiveFilters =
    statusFilter !== "all" || searchQuery.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-row items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("filterByCountry") + " / " + t("patientName")}
              className={cn(
                "h-11 min-h-11 w-full rounded-lg border-border bg-background ps-10 pe-3 shadow-none",
                "text-base md:text-sm dark:bg-input/30",
                "placeholder:text-muted-foreground",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              )}
            />
          </div>
          <div className="relative shrink-0" ref={filterPanelRef}>
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-expanded={filterOpen}
              aria-haspopup="listbox"
              aria-label={t("filterByStatus")}
              onClick={() => setFilterOpen((o) => !o)}
              className={cn(
                "min-h-11 min-w-11 rounded-lg border-border bg-background shadow-none",
                statusFilter !== "all" && "border-primary/40 text-primary"
              )}
            >
              <Filter className="size-4" />
            </Button>
          {filterOpen ? (
            <div
              role="listbox"
              aria-label={t("filterByStatus")}
              className="absolute end-0 top-[calc(100%+0.5rem)] z-30 w-[min(calc(100vw-2rem),18rem)] rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none"
            >
              <p className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
                {t("filterByStatus")}
              </p>
              <div className="max-h-[min(60vh,20rem)] overflow-y-auto">
                {ALL_STATUSES.map((s) => {
                  const label = s === "all" ? t("allStatuses") : getStatusLabel(s)[langKey];
                  const selected = statusFilter === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setStatusFilter(s);
                        setFilterOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center rounded-lg px-2.5 py-2 text-start text-sm transition-colors",
                        selected
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          </div>
        </div>

        {hasActiveFilters ? (
          <div
            className="flex flex-wrap gap-2"
            role="list"
            aria-label={t("activeFilters")}
          >
            {statusFilter !== "all" ? (
              <span
                role="listitem"
                className="inline-flex max-w-full items-center gap-0.5 rounded-full border border-border bg-muted/40 py-0.5 ps-2.5 pe-0.5 text-sm text-foreground dark:bg-muted/30"
              >
                <span className="max-w-[min(100%,14rem)] truncate">
                  {getStatusLabel(statusFilter)[langKey]}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="size-7 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                  aria-label={`${t("removeFilter")}: ${getStatusLabel(statusFilter)[langKey]}`}
                  onClick={() => setStatusFilter("all")}
                >
                  <X className="size-3.5" />
                </Button>
              </span>
            ) : null}
            {searchQuery.trim() ? (
              <span
                role="listitem"
                className="inline-flex max-w-full items-center gap-0.5 rounded-full border border-border bg-muted/40 py-0.5 ps-2.5 pe-0.5 text-sm text-foreground dark:bg-muted/30"
              >
                <Search className="ms-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="max-w-[min(100%,16rem)] truncate">{searchQuery.trim()}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="size-7 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                  aria-label={`${t("removeFilter")}: ${searchQuery.trim()}`}
                  onClick={() => setSearchQuery("")}
                >
                  <X className="size-3.5" />
                </Button>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <EmptyState icon={Search} title={t("noResults")} />
        ) : (
          <div className="grid gap-3">
            {/* Desktop Header */}
            <div className="hidden lg:grid grid-cols-[2fr_1fr_1.2fr_1.4fr_0.8fr_1fr_0.8fr] items-center gap-4 px-6 py-2.5 bg-muted/50 rounded-lg border border-border/60 text-xs font-semibold text-muted-foreground">
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
                className="group relative bg-card hover:bg-accent/5 transition-all duration-200 rounded-xl border border-border shadow-sm hover:shadow-md ring-1 ring-black/5 overflow-hidden"
              >
                <div className="lg:grid lg:grid-cols-[2fr_1fr_1.2fr_1.4fr_0.8fr_1fr_0.8fr] lg:items-center lg:gap-4 p-4 lg:px-6 lg:py-4">
                  {/* Name & Mobile Info */}
                  <div className="flex items-start justify-between lg:block mb-3 lg:mb-0">
                    <div>
                      <h3 className="font-bold text-foreground text-base lg:text-[15px] group-hover:text-primary transition-colors">
                        {lead.patientName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 lg:hidden">
                        <Badge variant="outline" className="text-xs font-medium py-0">
                          {lead.clientType}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="size-3" />
                          {lead.patientCountry}
                        </span>
                      </div>
                    </div>
                    <div className="lg:hidden">
                      <StatusBadge status={lead.status} langKey={langKey} variant="table" className="px-2 py-0.5" />
                    </div>
                  </div>

                  {/* Desktop Only Columns */}
                  <div className="hidden lg:flex items-center gap-1.5 text-sm text-foreground/80">
                    <MapPin className="size-3.5 text-muted-foreground/60" />
                    <span>{lead.patientCountry}</span>
                  </div>
                  <div className="hidden lg:flex items-center gap-1.5 text-sm text-foreground/80">
                    <Activity className="size-3.5 text-muted-foreground/60" />
                    <span className="truncate">{lead.treatmentSlug}</span>
                  </div>
                  <div className="hidden lg:block">
                    <StatusBadge
                      status={lead.status}
                      langKey={langKey}
                      variant="table"
                      className="px-2.5"
                    />
                  </div>
                  <div className="hidden lg:block">
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {lead.clientType}
                    </span>
                  </div>
                  <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <Calendar className="size-3.5 opacity-60" />
                    <span>{formatDate(lead.updatedAt, locale)}</span>
                  </div>

                  {/* Mobile Details Row */}
                  <div className="flex items-center justify-between lg:hidden border-t border-border/40 pt-3 mt-3">
                    <div className="flex flex-col gap-1">
                      <span className="amanak-app-field-label">
                        {t("treatment")}
                      </span>
                      <span className="text-xs font-medium">{lead.treatmentSlug}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="amanak-app-field-label">
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
