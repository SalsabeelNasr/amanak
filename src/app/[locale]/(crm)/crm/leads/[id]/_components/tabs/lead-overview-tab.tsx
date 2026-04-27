"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { JourneyTimelineVertical } from "@/components/portal/journey-timeline-vertical";
import { LeadActivityLog } from "../lead-activity-log";
import { formatDateTime } from "@/components/crm/date-format";
import { useLangKey } from "@/components/crm/use-lang-key";
import { statusOverviewBadgeClass } from "@/components/crm/status-badge";
import { getStatusLabel } from "@/lib/services/state-machine.service";
import type { Lead, LeadTask, StateTransition } from "@/types";
import { cn } from "@/lib/utils";
import {
  crmTeamMemberName,
  leadTaskDueBadge,
  leadTaskSourceBadge,
} from "../lead-task-badges";
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Globe,
  ListTodo,
  Mail,
  Phone,
  Stethoscope,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

type LeadOverviewTabProps = {
  lead: Lead;
  otherLeads: Lead[];
  overviewActiveTasks: LeadTask[];
  successFlash: boolean;
  taskActionError: string | null;
  pendingTransition: StateTransition | null;
  onPendingTransition: (tr: StateTransition | null) => void;
  note: string;
  onNoteChange: (v: string) => void;
  onConfirmTransition: () => void;
  isActivityExpanded: boolean;
  onToggleActivityExpanded: () => void;
  onOpenTaskDetail: (taskId: string) => void;
  nowMs: number;
};

export function LeadOverviewTab({
  lead,
  otherLeads,
  overviewActiveTasks,
  successFlash,
  taskActionError,
  pendingTransition,
  onPendingTransition,
  note,
  onNoteChange,
  onConfirmTransition,
  isActivityExpanded,
  onToggleActivityExpanded,
  onOpenTaskDetail,
  nowMs,
}: LeadOverviewTabProps) {
  const t = useTranslations("crm");
  const tPortal = useTranslations("portal");
  const locale = useLocale();
  const langKey = useLangKey();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-2.5 border-b border-border bg-muted/30 px-6 py-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ListTodo className="size-4" aria-hidden />
            </div>
            <h2 className="amanak-app-panel-title">{t("activeTasksSectionTitle")}</h2>
          </div>
          <div className="space-y-5 p-6">
            {successFlash ? (
              <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-xs font-bold text-success animate-in fade-in slide-in-from-top-1">
                <CheckCircle2 className="size-4" aria-hidden />
                {t("updated")}
              </div>
            ) : null}

            {taskActionError ? (
              <div
                className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-bold text-destructive"
                role="alert"
              >
                {taskActionError}
              </div>
            ) : null}

            {overviewActiveTasks.length === 0 ? (
              <div className="py-12 text-center">
                <ListTodo className="mx-auto mb-3 size-10 text-muted-foreground/20" aria-hidden />
                <p className="text-xs font-medium text-muted-foreground">{t("noActiveTasks")}</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {overviewActiveTasks.map((taskItem) => {
                  const badge = leadTaskDueBadge(taskItem, t, locale, nowMs);
                  const autoBadge = leadTaskSourceBadge(taskItem, t);
                  return (
                    <li key={taskItem.id}>
                      <button
                        type="button"
                        onClick={() => onOpenTaskDetail(taskItem.id)}
                        className="group flex w-full flex-col gap-4 rounded-xl border border-border bg-card p-4 text-start shadow-sm ring-1 ring-black/5 transition-all hover:bg-muted/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="amanak-app-value">{taskItem.title}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            {autoBadge ? (
                              <Badge
                                variant="outline"
                                className={cn("px-2 py-0.5 text-xs font-medium", autoBadge.className)}
                              >
                                {autoBadge.label}
                              </Badge>
                            ) : null}
                            {badge ? (
                              <Badge
                                variant="outline"
                                className={cn("px-2 py-0.5 text-xs font-medium", badge.className)}
                              >
                                {badge.label}
                              </Badge>
                            ) : null}
                            <p className="amanak-app-field-label shrink-0">
                              {t("taskAssigneeLabel")}: {crmTeamMemberName(t, taskItem.assigneeId)}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center self-start sm:self-center">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-80 group-hover:opacity-100">
                            {t("taskViewDetails")}
                            <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden />
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {pendingTransition ? (
              <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-primary">
                    {pendingTransition.label[langKey]}
                  </p>
                  <button
                    type="button"
                    className="rounded-md text-muted-foreground transition-colors hover:text-destructive"
                    onClick={() => onPendingTransition(null)}
                    aria-label={t("cancel")}
                  >
                    <XCircle className="size-4" />
                  </button>
                </div>

                {pendingTransition.requiresNote ? (
                  <div className="space-y-2.5">
                    <Label htmlFor="action-note" className="amanak-app-field-label">
                      {t("addNote")}
                    </Label>
                    <textarea
                      id="action-note"
                      value={note}
                      onChange={(e) => onNoteChange(e.target.value)}
                      placeholder="..."
                      className="min-h-[100px] w-full resize-none rounded-xl border border-border bg-background p-4 text-sm font-medium transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    size="sm"
                    className="h-10 flex-1 rounded-xl text-sm font-semibold shadow-md"
                    onClick={onConfirmTransition}
                    disabled={pendingTransition.requiresNote && !note.trim()}
                  >
                    {t("confirm")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-10 rounded-xl text-sm font-medium"
                    onClick={() => {
                      onPendingTransition(null);
                      onNoteChange("");
                    }}
                  >
                    {t("cancel")}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <LeadActivityLog lead={lead} />

        {otherLeads.length > 0 && (
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-black/5">
            <div className="flex items-center gap-2.5 border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="size-4" aria-hidden />
              </div>
              <h2 className="amanak-app-panel-title">{t("otherLeadsByCustomer")}</h2>
            </div>
            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {otherLeads.map((ol) => (
                  <Link
                    key={ol.id}
                    href={`/crm/leads/${ol.id}`}
                    className="group flex flex-col gap-3 rounded-xl border border-border/40 bg-muted/10 p-4 transition-all hover:bg-muted/20 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {ol.treatmentSlug}
                        </p>
                        <p className="amanak-app-field-label">ID: {ol.id}</p>
                      </div>
                      <Badge
                        className={cn(
                          "px-2 py-0 text-xs font-semibold tracking-tight shadow-sm",
                          statusOverviewBadgeClass(ol.status),
                        )}
                      >
                        {getStatusLabel(ol.status)[langKey]}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/40 pt-3">
                      <span className="text-xs text-muted-foreground/50">
                        {formatDateTime(ol.createdAt, locale)}
                      </span>
                      <ChevronRight className="size-3 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="space-y-6">
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-2.5 border-b border-border bg-muted/30 px-6 py-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="size-4" aria-hidden />
            </div>
            <h2 className="amanak-app-panel-title">{tPortal("personalInfo")}</h2>
          </div>
          <div className="space-y-5 p-6">
            <div className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 ring-1 ring-border/50">
                <Phone className="size-4 text-primary" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="amanak-app-field-label">{tPortal("phone")}</p>
                <p className="amanak-app-value">{lead.patientPhone}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 ring-1 ring-border/50">
                <Mail className="size-4 text-primary" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="amanak-app-field-label">{t("email")}</p>
                <p
                  className={cn(
                    "amanak-app-value break-all",
                    !lead.patientEmail && "text-muted-foreground",
                  )}
                >
                  {lead.patientEmail ?? t("fieldNotProvided")}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 ring-1 ring-border/50">
                <Users className="size-4 text-primary" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="amanak-app-field-label">{t("clientType")}</p>
                <Badge
                  variant="outline"
                  className="mt-1 bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {t(
                    `clientTypes.${lead.clientType}` as Parameters<typeof t>[0],
                  )}
                </Badge>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 ring-1 ring-border/50">
                <Globe className="size-4 text-primary" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="amanak-app-field-label">{tPortal("country")}</p>
                <p className="amanak-app-value">{lead.patientCountry}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 ring-1 ring-border/50">
                <Stethoscope className="size-4 text-primary" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="amanak-app-field-label">{t("treatment")}</p>
                <p className="amanak-app-value">{lead.treatmentSlug}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Activity className="size-4" aria-hidden />
              </div>
              <h2 className="amanak-app-panel-title">{tPortal("journey")}</h2>
            </div>
          </div>
          <div className="p-6">
            <JourneyTimelineVertical lead={lead} isExpanded={isActivityExpanded} />

            <div className="mt-4 flex justify-center border-t border-border/40 pt-4">
              <Button
                variant="ghost"
                size="sm"
                className="group h-9 w-full gap-2 text-sm font-medium text-primary hover:bg-primary/5"
                onClick={onToggleActivityExpanded}
              >
                {isActivityExpanded ? (
                  <>
                    {t("convShowLess")}
                    <ChevronUp className="size-3.5 transition-transform group-hover:-translate-y-0.5" />
                  </>
                ) : (
                  <>
                    {t("convShowMore")}
                    <ChevronDown className="size-3.5 transition-transform group-hover:translate-y-0.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
