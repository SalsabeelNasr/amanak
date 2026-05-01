"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TreatmentRequestStageVertical } from "@/components/portal/journey-timeline-vertical";
import { LeadActivityLog } from "../lead-activity-log";
import { formatDateTime } from "@/components/crm/date-format";
import { useLangKey } from "@/components/crm/use-lang-key";
import { statusOverviewBadgeClass } from "@/components/crm/status-badge";
import { getStatusLabel } from "@/lib/services/state-machine.service";
import type { Lead, LeadTask, StateTransition } from "@/types";
import { cn } from "@/lib/utils";
import { getSystemTaskTitle } from "@/lib/services/lead-task-rules";
import { crmTeamMemberName, leadTaskDueBadge } from "../lead-task-badges";
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
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

  function resolveTitle(task: LeadTask): string {
    if (task.templateKey) {
      return getSystemTaskTitle(task.templateKey, t as any);
    }
    return task.title;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
            <ListTodo className="size-5 text-muted-foreground" aria-hidden />
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
                  const dueUi = leadTaskDueBadge(taskItem, t, locale, nowMs);
                  return (
                    <li key={taskItem.id}>
                      <button
                        type="button"
                        onClick={() => onOpenTaskDetail(taskItem.id)}
                        className="group flex w-full flex-col gap-4 rounded-xl border border-border/50 bg-card p-4 text-start transition-all hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="amanak-app-value">{resolveTitle(taskItem)}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            {dueUi.variant === "overdue" ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "gap-1 px-2 py-0.5 text-xs font-medium tabular-nums shadow-none",
                                  "border-destructive/40 bg-destructive/10 text-destructive ring-1 ring-destructive/15",
                                )}
                              >
                                <Clock className="size-3 shrink-0 opacity-90" aria-hidden />
                                {dueUi.label}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "px-2 py-0.5 text-xs font-medium",
                                  dueUi.className,
                                )}
                              >
                                {dueUi.label}
                              </Badge>
                            )}
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
          <section className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
              <Users className="size-5 text-muted-foreground" aria-hidden />
              <h2 className="amanak-app-panel-title">{t("otherLeadsByCustomer")}</h2>
            </div>
            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {otherLeads.map((ol) => (
                  <Link
                    key={ol.id}
                    href={`/crm/leads/${ol.id}`}
                    className="group flex flex-col gap-3 rounded-xl border border-border/50 p-4 transition-all hover:bg-muted/30"
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
        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
            <User className="size-5 text-muted-foreground" aria-hidden />
            <h2 className="amanak-app-panel-title">{tPortal("personalInfo")}</h2>
          </div>
          <div className="flex flex-col p-2">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
              <Phone className="size-4 text-muted-foreground shrink-0" aria-hidden />
              <div className="min-w-0 flex-1 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{tPortal("phone")}</p>
                <p className="text-sm font-medium text-foreground text-end">{lead.patientPhone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
              <Mail className="size-4 text-muted-foreground shrink-0" aria-hidden />
              <div className="min-w-0 flex-1 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{t("email")}</p>
                <p
                  className={cn(
                    "text-sm font-medium text-end break-all",
                    !lead.patientEmail ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {lead.patientEmail ?? t("fieldNotProvided")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
              <Users className="size-4 text-muted-foreground shrink-0" aria-hidden />
              <div className="min-w-0 flex-1 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{t("clientType")}</p>
                <p className="text-sm font-medium text-foreground text-end">
                  {t(`clientTypes.${lead.clientType}` as Parameters<typeof t>[0])}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
              <Globe className="size-4 text-muted-foreground shrink-0" aria-hidden />
              <div className="min-w-0 flex-1 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{tPortal("country")}</p>
                <p className="text-sm font-medium text-foreground text-end">{lead.patientCountry}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
              <Stethoscope className="size-4 text-muted-foreground shrink-0" aria-hidden />
              <div className="min-w-0 flex-1 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{t("treatment")}</p>
                <p className="text-sm font-medium text-foreground text-end">{lead.treatmentSlug}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <div className="flex items-center gap-2.5">
              <Activity className="size-5 text-muted-foreground" aria-hidden />
              <h2 className="amanak-app-panel-title">{tPortal("leadJourney.sectionTitle")}</h2>
            </div>
          </div>
          <div className="p-6">
            <TreatmentRequestStageVertical lead={lead} isExpanded={isActivityExpanded} />

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
