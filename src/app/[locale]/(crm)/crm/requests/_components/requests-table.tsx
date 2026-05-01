"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/crm/empty-state";
import { formatDate } from "@/components/crm/date-format";
import { useLangKey } from "@/components/crm/use-lang-key";
import { StatusBadge } from "@/components/crm/status-badge";
import { Link } from "@/i18n/navigation";
import {
  ORDERED_STATES,
  getStatusLabel,
} from "@/lib/services/state-machine.service";
import type { Patient, Request, RequestStatus, RequestTaskTemplateKey } from "@/types";
import type { CrmSettings } from "@/lib/api/crm-settings";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
  Search,
  Filter,
  ChevronRight,
  MapPin,
  X,
  ArrowUpDown,
  Clock,
} from "lucide-react";

const ALL_STATUSES: (RequestStatus | "all")[] = ["all", ...ORDERED_STATES];

type SortOption = "prioritize" | "newest" | "oldest";

function translatedClientType(
  clientType: Patient["clientType"],
  t: (key: string) => string,
): string {
  switch (clientType) {
    case "b2c":
      return t("clientTypes.b2c");
    case "b2b":
      return t("clientTypes.b2b");
    case "g2b":
      return t("clientTypes.g2b");
    default:
      return clientType;
  }
}

export function RequestsTable({
  requests,
  patientsById,
  settings,
}: {
  requests: Request[];
  patientsById: Record<string, Patient>;
  settings: CrmSettings;
}) {
  const t = useTranslations("crm");
  const locale = useLocale();
  const langKey = useLangKey();
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("prioritize");
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

  const getCountryName = (code: string) => {
    try {
      return t(`countries.${code}`);
    } catch {
      return code;
    }
  };

  const prioritizedLeads = useMemo(() => {
    const now = Date.now();
    const startOfToday = new Date().setHours(0, 0, 0, 0);

    const getRequestScore = (req: Request) => {
      let score = 0;
      const enabledRules = settings.sortingRules.filter((r) => r.enabled);

      enabledRules.forEach((rule, index) => {
        const weight = Math.pow(10, enabledRules.length - index);

        switch (rule.id) {
          case "overdue_tasks":
            if (
              req.tasks.some(
                (tk) =>
                  !tk.completed &&
                  tk.dueAt &&
                  new Date(tk.dueAt).getTime() < startOfToday,
              )
            ) {
              score += weight;
            }
            break;
          case "tasks_due_today":
            if (
              req.tasks.some(
                (tk) =>
                  !tk.completed &&
                  tk.dueAt &&
                  new Date(tk.dueAt).getTime() >= startOfToday &&
                  new Date(tk.dueAt).getTime() < startOfToday + 86400000,
              )
            ) {
              score += weight;
            }
            break;
          case "hot_priority":
            if (req.requestPriority === "hot") {
              score += weight;
            }
            break;
          case "new_leads":
            if (req.status === "new") {
              score += weight;
            }
            break;
          case "recent_activity": {
            const lastUpdate = new Date(req.updatedAt).getTime();
            const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24);
            if (daysSinceUpdate < 1) score += weight;
            break;
          }
          case "open_matching_tasks": {
            const keys = (rule.taskTemplateKeys ?? []).filter(Boolean) as RequestTaskTemplateKey[];
            if (keys.length === 0) break;
            const openByTemplate = new Set(
              req.tasks
                .filter((tk) => !tk.completed && tk.templateKey && keys.includes(tk.templateKey))
                .map((tk) => tk.templateKey as RequestTaskTemplateKey),
            );
            const mode = rule.taskOpenMatch ?? "any";
            const matches =
              mode === "all"
                ? keys.every((k) => openByTemplate.has(k))
                : keys.some((k) => openByTemplate.has(k));
            if (matches) score += weight;
            break;
          }
        }
      });
      return score;
    };

    const scored = requests.map((r) => ({ request: r, score: getRequestScore(r) }));

    if (sortBy === "prioritize") {
      return scored
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return (
            new Date(b.request.updatedAt).getTime() -
            new Date(a.request.updatedAt).getTime()
          );
        })
        .map((s) => s.request);
    }
    if (sortBy === "newest") {
      return [...requests].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    }
    if (sortBy === "oldest") {
      return [...requests].sort(
        (a, b) =>
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      );
    }
    return requests;
  }, [requests, sortBy, settings.sortingRules]);

  const filtered = useMemo(() => {
    return prioritizedLeads.filter((req) => {
      if (statusFilter !== "all" && req.status !== statusFilter) return false;
      const p = patientsById[req.patientId];
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = p?.name ?? "";
        const country = p?.country ?? "";
        return (
          name.toLowerCase().includes(query) ||
          getCountryName(country).toLowerCase().includes(query) ||
          req.treatmentSlug.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [prioritizedLeads, statusFilter, searchQuery, t, patientsById]);

  const hasActiveFilters = statusFilter !== "all" || searchQuery.trim().length > 0;
  const startOfToday = new Date().setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      {/* Search and Sort Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("leadsSearchPlaceholder")}
            className="h-11 border-border/50 bg-background ps-10 focus:ring-primary/20"
          />
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-border/50 bg-background px-3 shadow-none">
            <ArrowUpDown className="size-3.5 shrink-0 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-full min-w-0 cursor-pointer bg-background text-sm font-medium focus:outline-none focus:ring-0"
            >
              <option value="prioritize">{t("sortPrioritize")}</option>
              <option value="newest">{t("sortNewest")}</option>
              <option value="oldest">{t("sortOldest")}</option>
            </select>
          </div>

          <div className="relative z-10" ref={filterPanelRef}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-expanded={filterOpen}
              aria-haspopup="listbox"
              aria-label={t("filterByStatus")}
              onClick={() => setFilterOpen((o) => !o)}
              className={cn(
                "h-10 px-3 gap-2 border-border/50",
                statusFilter !== "all" && "border-primary/40 bg-primary/5 text-primary",
              )}
            >
              <Filter className="size-3.5" />
              <span className="text-sm font-medium">{t("filterByStatus")}</span>
            </Button>

            {filterOpen && (
              <div
                role="listbox"
                aria-label={t("filterByStatus")}
                className="absolute end-0 top-[calc(100%+0.5rem)] z-50 w-[min(calc(100vw-2rem),18rem)] rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in zoom-in-95 duration-100"
              >
                <p className="px-2.5 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("filterByStatus")}
                </p>
                <div className="max-h-80 overflow-y-auto">
                  {ALL_STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="option"
                      aria-selected={statusFilter === s}
                      onClick={() => {
                        setStatusFilter(s);
                        setFilterOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center rounded-lg px-2.5 py-2 text-start text-sm transition-colors",
                        statusFilter === s ? "bg-primary/10 font-bold text-primary" : "hover:bg-muted"
                      )}
                    >
                      {s === "all" ? t("allStatuses") : getStatusLabel(s)[langKey]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="gap-1.5 px-3 py-1 bg-primary/5 text-primary border-primary/10">
              {getStatusLabel(statusFilter)[langKey]}
              <X className="size-3.5 cursor-pointer hover:text-primary/80" onClick={() => setStatusFilter("all")} />
            </Badge>
          )}
          {searchQuery && (
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              {searchQuery}
              <X className="size-3.5 cursor-pointer hover:text-foreground/80" onClick={() => setSearchQuery("")} />
            </Badge>
          )}
        </div>
      )}

      {/* Leads List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <EmptyState icon={Search} title={t("noResults")} />
        ) : (
          <div className="flex flex-col gap-3 sm:gap-4">
            {filtered.map((lead) => {
              const patient = patientsById[lead.patientId];
              const hasOverdue = lead.tasks.some(tk => !tk.completed && tk.dueAt && new Date(tk.dueAt).getTime() < startOfToday);
              const hasToday = lead.tasks.some(tk => !tk.completed && tk.dueAt && new Date(tk.dueAt).getTime() >= startOfToday && new Date(tk.dueAt).getTime() < startOfToday + 86400000);

              const urgencyBadges = (
                <>
                  {hasOverdue && (
                    <Badge variant="destructive" className="h-5 shrink-0 px-1.5 text-[10px] font-bold uppercase">
                      {t("crmTodayOverdue")}
                    </Badge>
                  )}
                  {hasToday && (
                    <Badge variant="outline" className="h-5 shrink-0 border-primary/20 bg-primary/5 px-1.5 text-[10px] font-bold uppercase text-primary">
                      {t("crmTodayToday")}
                    </Badge>
                  )}
                </>
              );

              return (
                <Link
                  key={lead.id}
                  href={`${ROUTES.crmRequests}/${lead.id}`}
                  className="group block min-w-0"
                >
                  <div
                    className={cn(
                      "flex min-h-[8.75rem] flex-col overflow-hidden amanak-app-surface-card shadow-none",
                      "transition-shadow duration-200 hover:shadow-sm hover:shadow-primary/5 active:scale-[0.99]",
                      "lg:min-h-[5.75rem]",
                      "p-4 lg:p-3",
                    )}
                  >
                    {/* Mobile: original stacked layout */}
                    <div className="flex min-h-0 flex-1 flex-col justify-between gap-3 lg:hidden">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="flex max-w-full min-w-0 flex-row flex-nowrap items-center gap-1 text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                            <span className="min-w-0 flex-1 truncate">{patient?.name ?? lead.patientId}</span>
                            {lead.requestPriority === "hot" ? (
                              <Badge className="shrink-0 border-orange-200 bg-orange-500/10 px-1.5 py-0 text-[10px] font-bold uppercase leading-none text-orange-600">
                                Hot
                              </Badge>
                            ) : null}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="size-3.5 shrink-0" />
                              {getCountryName(patient?.country ?? "")}
                            </span>
                            <span className="text-muted-foreground/30">•</span>
                            <span className="font-medium text-foreground/80">
                              {lead.treatmentSlug}
                              <span className="font-normal text-muted-foreground">
                                {" "}
                                · {translatedClientType(patient?.clientType ?? "b2c", t)}
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <StatusBadge status={lead.status} langKey={langKey} variant="table" />
                          <div className="flex flex-wrap justify-end gap-1">{urgencyBadges}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border/40 pt-3">
                        <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3.5 shrink-0" />
                            {formatDate(lead.updatedAt, locale)}
                          </div>
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-1 group-hover:text-primary rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                        </div>
                      </div>
                    </div>

                    {/* Desktop: single compact row */}
                    <div className="hidden min-h-0 flex-1 lg:flex lg:items-center lg:justify-between lg:gap-2 xl:gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="flex max-w-full min-w-0 flex-row flex-nowrap items-center gap-1 text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                          <span className="min-w-0 flex-1 truncate">{patient?.name ?? lead.patientId}</span>
                          {lead.requestPriority === "hot" ? (
                            <Badge className="h-5 shrink-0 border-orange-200 bg-orange-500/10 px-1.5 py-0 text-[10px] font-bold uppercase leading-none text-orange-600">
                              Hot
                            </Badge>
                          ) : null}
                        </h3>
                        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="flex min-w-0 max-w-full items-center gap-0.5">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate">{getCountryName(patient?.country ?? "")}</span>
                          </span>
                          <span className="text-muted-foreground/30">•</span>
                          <span className="min-w-0 max-w-full truncate text-xs font-medium text-foreground/75">
                            {lead.treatmentSlug}
                            <span className="font-normal text-muted-foreground">
                              {" "}
                              · {translatedClientType(patient?.clientType ?? "b2c", t)}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-1.5 xl:flex-nowrap xl:gap-2">
                        <div className="flex flex-wrap justify-end gap-1">{urgencyBadges}</div>
                        <StatusBadge status={lead.status} langKey={langKey} variant="table" />
                        <div className="flex items-center gap-0.5 whitespace-nowrap text-[11px] font-medium text-muted-foreground tabular-nums">
                          <Clock className="size-3 shrink-0 opacity-70" />
                          {formatDate(lead.updatedAt, locale)}
                        </div>
                        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/35 transition-all group-hover:translate-x-0.5 group-hover:text-primary rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
