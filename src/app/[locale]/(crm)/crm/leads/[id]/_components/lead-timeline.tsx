"use client";

/**
 * Unified lead timeline (overview card). CRM view omits the "upcoming" bucket
 * (future tasks, appointments, journey stages). Rows are ordered now-bucket
 * then history-bucket; section breaks use locale date+time when the calendar
 * day changes. Long lists collapse with load more / show less.
 */

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDateTime, formatDueDate } from "@/components/crm/date-format";
import { useLangKey } from "@/components/crm/use-lang-key";
import { RolePill } from "@/components/crm/role-pill";
import { getStatusLabel } from "@/lib/services/state-machine.service";
import {
  JOURNEY_STAGE_I18N_SUFFIX,
} from "@/lib/lead-journey-stage";
import {
  getSystemTaskTitle,
  LEAD_PATIENT_ASSIGNEE_ID,
} from "@/lib/services/lead-task-rules";
import type {
  ActorRole,
  Lead,
  LeadAppointment,
  LeadConversationItem,
  LeadDocument,
  LeadJourneyStage,
  LeadTask,
} from "@/types";
import { crmTeamMemberName, leadTaskDueBadge } from "./lead-task-badges";
import {
  buildLeadTimelineRows,
  partitionTimelineRowsByBucket,
  type LeadTimelineRow,
} from "./lead-timeline-events";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  FileText,
  ListTodo,
  Mail,
  MessageSquare,
  Phone,
  Route,
  Smartphone,
  UserCircle2,
  Video,
} from "lucide-react";
import { getConversationBodyText } from "./lead-conversation-utils";

/** Fits a typical 13" laptop viewport without pushing the rest of the page away. */
const TIMELINE_COLLAPSED_ROW_COUNT = 12;

/** Calendar day in local time — used to insert date/time section breaks between rows. */
function timelineDayKey(sortAtMs: number, locale: string): string {
  return new Date(sortAtMs).toLocaleDateString(
    locale === "ar" ? "ar-EG" : "en-US",
    { year: "numeric", month: "2-digit", day: "2-digit" },
  );
}

const TIMELINE_CONV_PREVIEW_CHARS = 140;

type LeadTimelineProps = {
  lead: Lead;
  /** Full conversation list for this lead (same source as the Conversations tab). */
  conversations?: readonly LeadConversationItem[];
  nowMs: number;
  successFlash: boolean;
  taskActionError: string | null;
  onOpenTaskDetail: (taskId: string) => void;
};

export function LeadTimeline({
  lead,
  conversations,
  nowMs,
  successFlash,
  taskActionError,
  onOpenTaskDetail,
}: LeadTimelineProps) {
  const t = useTranslations("crm");
  const tPortal = useTranslations("portal");
  const locale = useLocale();
  const langKey = useLangKey();
  const [timelineExpanded, setTimelineExpanded] = useState(false);

  useEffect(() => {
    setTimelineExpanded(false);
  }, [lead.id]);

  const rows = useMemo(() => {
    const all = buildLeadTimelineRows(lead, nowMs, {
      conversations: conversations?.length ? conversations : undefined,
    });
    return all.filter((r) => r.bucket !== "upcoming");
  }, [lead, nowMs, conversations]);

  const { now: nowRows, history } = partitionTimelineRowsByBucket(rows);
  const hasAny = rows.length > 0;

  const orderedRows = useMemo(
    () => [...nowRows, ...history] as LeadTimelineRow[],
    [nowRows, history],
  );

  const totalRows = orderedRows.length;
  const needsLoadMore = totalRows > TIMELINE_COLLAPSED_ROW_COUNT;
  const visibleRows =
    timelineExpanded || !needsLoadMore
      ? orderedRows
      : orderedRows.slice(0, TIMELINE_COLLAPSED_ROW_COUNT);
  const hiddenCount = needsLoadMore ? totalRows - TIMELINE_COLLAPSED_ROW_COUNT : 0;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm ring-1 ring-black/5">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 via-primary/12 to-muted/40 text-primary shadow-sm ring-1 ring-primary/20 dark:from-primary/30 dark:via-primary/15 dark:to-muted/25 dark:ring-primary/25"
          aria-hidden
        >
          <Route className="size-[1.35rem] stroke-[1.65]" strokeLinecap="round" strokeLinejoin="round" />
        </div>
        <h2 className="amanak-app-panel-title">{t("timelineSectionTitle")}</h2>
      </div>

      <div className="space-y-4 p-6">
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

        {!hasAny ? (
          <div className="py-12 text-center">
            <ListTodo
              className="mx-auto mb-3 size-10 text-muted-foreground/20"
              aria-hidden
            />
            <p className="text-xs font-medium text-muted-foreground">
              {t("timelineEmpty")}
            </p>
          </div>
        ) : (
          <>
            <div className="relative">
              <div
                className="pointer-events-none absolute inset-y-0 start-[11px] w-px bg-border/60"
                aria-hidden
              />
              <ul className="space-y-4">
                {visibleRows.map((row, idx) => {
                  const dayKey = timelineDayKey(row.sortAt, locale);
                  const prevDayKey =
                    idx > 0 ? timelineDayKey(visibleRows[idx - 1]!.sortAt, locale) : null;
                  const showDateDivider = idx === 0 || dayKey !== prevDayKey;
                  const dividerLabel = formatDateTime(
                    new Date(row.sortAt).toISOString(),
                    locale,
                  );
                  return (
                    <li key={timelineRowKey(row)} className="space-y-4">
                      {showDateDivider ? (
                        <p
                          className="ps-8 text-xs font-semibold tabular-nums text-muted-foreground"
                          aria-label={dividerLabel}
                        >
                          {dividerLabel}
                        </p>
                      ) : null}
                      <TimelineRowView
                        row={row}
                        lead={lead}
                        nowMs={nowMs}
                        t={t}
                        tPortal={tPortal}
                        locale={locale}
                        langKey={langKey}
                        onOpenTaskDetail={onOpenTaskDetail}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>

            {needsLoadMore ? (
              <div className="flex flex-col items-center gap-1 border-t border-border/60 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-2 text-sm font-medium text-primary hover:bg-primary/5"
                  onClick={() => setTimelineExpanded((e) => !e)}
                >
                  {timelineExpanded ? (
                    <>
                      {t("timelineShowLess")}
                      <ChevronUp className="size-3.5" aria-hidden />
                    </>
                  ) : (
                    <>
                      {t("timelineLoadMore", { count: hiddenCount })}
                      <ChevronDown className="size-3.5" aria-hidden />
                    </>
                  )}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

function timelineRowKey(row: LeadTimelineRow): string {
  switch (row.kind) {
    case "task":
      return `task-${row.task.id}`;
    case "appointment":
      return `appt-${row.appointment.id}`;
    case "status":
      return `status-${row.entry.timestamp}-${row.entry.action}`;
    case "follow-up":
      return `follow-${row.entry.timestamp}`;
    case "journey-stage":
      return `journey-${row.stage}`;
    case "conversation":
      return `conv-${row.conversation.id}`;
    case "document":
      return `doc-${row.document.id}-${row.document.uploadedAt ?? ""}`;
  }
}

type CrmT = ReturnType<typeof useTranslations<"crm">>;
type PortalT = ReturnType<typeof useTranslations<"portal">>;

function TimelineRowView({
  row,
  lead,
  nowMs,
  t,
  tPortal,
  locale,
  langKey,
  onOpenTaskDetail,
}: {
  row: LeadTimelineRow;
  lead: Lead;
  nowMs: number;
  t: CrmT;
  tPortal: PortalT;
  locale: string;
  langKey: "ar" | "en";
  onOpenTaskDetail: (taskId: string) => void;
}) {
  if (row.kind === "task") {
    return (
      <TimelineTaskCard
        task={row.task}
        isOverdue={row.isOverdue}
        nowMs={nowMs}
        t={t}
        locale={locale}
        onOpenTaskDetail={onOpenTaskDetail}
      />
    );
  }
  if (row.kind === "appointment") {
    return (
      <TimelineAppointmentCard
        appointment={row.appointment}
        lead={lead}
        t={t}
        locale={locale}
      />
    );
  }
  if (row.kind === "status") {
    return (
      <TimelineStatusRow
        from={getStatusLabel(row.entry.from)[langKey]}
        to={getStatusLabel(row.entry.to)[langKey]}
        action={row.entry.action}
        actorRole={row.entry.actorRole}
        timestamp={row.entry.timestamp}
        note={row.entry.note}
        locale={locale}
        t={t}
      />
    );
  }
  if (row.kind === "follow-up") {
    return (
      <TimelineFollowUpRow
        previous={row.entry.previousFollowUpDueAt}
        next={row.entry.nextFollowUpDueAt}
        timestamp={row.entry.timestamp}
        actorId={row.entry.actorId}
        locale={locale}
        t={t}
      />
    );
  }
  if (row.kind === "conversation") {
    return (
      <TimelineConversationRow
        item={row.conversation}
        locale={locale}
        t={t}
      />
    );
  }
  if (row.kind === "document") {
    return (
      <TimelineDocumentRow
        document={row.document}
        locale={locale}
        t={t}
        tPortal={tPortal}
      />
    );
  }
  return (
    <TimelineJourneyRow
      stage={row.stage}
      reachedAt={row.reachedAt}
      state={row.state}
      tPortal={tPortal}
      locale={locale}
    />
  );
}

function SpineRow({
  dot,
  iconClass,
  children,
}: {
  dot: ReactNode;
  iconClass?: string;
  children: ReactNode;
}) {
  return (
    <div className="group relative ps-10">
      <div
        className={cn(
          "absolute start-0 top-1.5 z-10 flex size-[24px] items-center justify-center rounded-full border-2 transition-all",
          iconClass,
        )}
        aria-hidden
      >
        {dot}
      </div>
      {children}
    </div>
  );
}

function renderTaskClosureActor(task: LeadTask, t: CrmT): ReactNode {
  if (!task.completed) return null;
  if (task.completedByRole) {
    return <RolePill role={task.completedByRole} />;
  }
  if (task.completedReason === "patient_action") {
    return <RolePill role="patient" />;
  }
  if (
    task.resolution === "cancelled" ||
    task.completedReason === "status_skipped" ||
    task.completedReason === "status_transition" ||
    task.completedReason === "quotation_sent" ||
    task.completedReason === "lead_rejected"
  ) {
    return (
      <Badge
        variant="outline"
        className="border-border/60 text-xs font-medium text-muted-foreground"
      >
        {t("timelineAutomatedActor")}
      </Badge>
    );
  }
  return null;
}

function TimelineTaskCard({
  task,
  isOverdue,
  nowMs,
  t,
  locale,
  onOpenTaskDetail,
}: {
  task: LeadTask;
  isOverdue: boolean;
  nowMs: number;
  t: CrmT;
  locale: string;
  onOpenTaskDetail: (taskId: string) => void;
}) {
  const dueUi = leadTaskDueBadge(task, t, locale, nowMs);
  const isPatient = task.assigneeId === LEAD_PATIENT_ASSIGNEE_ID;
  const title = task.templateKey
    ? getSystemTaskTitle(task.templateKey, t as any)
    : task.title;
  const closureActor = task.completed ? renderTaskClosureActor(task, t) : null;

  return (
    <SpineRow
      iconClass={cn(
        "border-primary/20 bg-background group-hover:border-primary group-hover:scale-110",
        task.completed && "border-border bg-muted/40",
        isOverdue && "border-destructive/40 bg-destructive/10",
        isPatient && "border-amber-500/40 bg-amber-500/10",
      )}
      dot={
        isPatient ? (
          <UserCircle2 className="size-3 text-amber-600 dark:text-amber-300" aria-hidden />
        ) : task.completed ? (
          <CheckCircle2 className="size-3 text-muted-foreground" aria-hidden />
        ) : (
          <div
            className={cn(
              "size-2 rounded-full",
              isOverdue ? "bg-destructive" : "bg-primary/50",
            )}
          />
        )
      }
    >
      <button
        type="button"
        onClick={() => onOpenTaskDetail(task.id)}
        className="group/card flex w-full flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 text-start transition-all hover:border-primary/30 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="amanak-app-value">{title}</p>
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
                className={cn("px-2 py-0.5 text-xs font-medium", dueUi.className)}
              >
                {dueUi.label}
              </Badge>
            )}
            {isPatient ? (
              <Badge
                variant="outline"
                className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              >
                <UserCircle2 className="size-3" aria-hidden />
                {t("taskAssigneePatientBadge")}
              </Badge>
            ) : (
              <p className="amanak-app-field-label shrink-0">
                {t("taskAssigneeLabel")}: {crmTeamMemberName(t, task.assigneeId)}
              </p>
            )}
            {task.completed && task.completionOutcome ? (
              <Badge
                variant="outline"
                className="border-primary/25 bg-primary/5 text-xs font-semibold text-primary"
              >
                {task.completionOutcome === "accepted"
                  ? t("taskOutcomeAccepted")
                  : t("taskOutcomeChangesRequested")}
              </Badge>
            ) : null}
          </div>
          {task.completed ? (
            <div className="space-y-1.5 border-t border-border/40 pt-2">
              <p className="text-xs font-medium tabular-nums text-muted-foreground">
                {t("timelineTaskClosedCaption", {
                  datetime: formatDateTime(task.updatedAt, locale),
                })}
              </p>
              {closureActor ? (
                <div className="flex flex-wrap items-center gap-2">{closureActor}</div>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center self-start sm:self-center">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-80 group-hover/card:opacity-100">
            {t("taskViewDetails")}
            <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden />
          </span>
        </div>
      </button>
    </SpineRow>
  );
}

function TimelineAppointmentCard({
  appointment,
  lead,
  t,
  locale,
}: {
  appointment: LeadAppointment;
  lead: Lead;
  t: CrmT;
  locale: string;
}) {
  const Icon =
    appointment.kind === "online_meeting"
      ? Video
      : appointment.kind === "team_consultation"
        ? Activity
        : CalendarClock;

  let descriptor: string;
  if (appointment.kind === "treatment") {
    descriptor = t("timelineAppointmentTreatmentAt", {
      location: appointment.locationLabel,
    });
  } else if (appointment.kind === "online_meeting") {
    descriptor = t("timelineAppointmentOnlineLinked", {
      title: appointment.title?.trim() || appointment.meetingUrl,
    });
  } else {
    const linked = lead.tasks.find((tk) => tk.id === appointment.linkedTaskId);
    descriptor = t("timelineAppointmentConsultationLinked", {
      title: linked?.title ?? appointment.linkedTaskId,
    });
  }

  return (
    <SpineRow
      iconClass="border-primary/30 bg-primary/10"
      dot={<Icon className="size-3 text-primary" aria-hidden />}
    >
      <div className="space-y-2 rounded-xl border border-border/50 bg-card p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="amanak-app-value">{descriptor}</p>
          <span className="amanak-app-meta text-muted-foreground/80">
            {formatDateTime(appointment.startsAt, locale)}
          </span>
        </div>
        {appointment.notes ? (
          <p className="text-xs font-medium leading-relaxed text-muted-foreground">
            {appointment.notes}
          </p>
        ) : null}
      </div>
    </SpineRow>
  );
}

function TimelineStatusRow({
  from,
  to,
  action,
  actorRole,
  timestamp,
  note,
  locale,
  t,
}: {
  from: string;
  to: string;
  action: string;
  actorRole: ActorRole;
  timestamp: string;
  note: string | undefined;
  locale: string;
  t: CrmT;
}) {
  const isOverride = action === "SET_STATUS";
  return (
    <SpineRow
      iconClass={cn(
        "border-primary/20 bg-background group-hover:border-primary",
        isOverride && "border-amber-500/40 bg-amber-500/10",
      )}
      dot={
        <div
          className={cn(
            "size-2 rounded-full",
            isOverride ? "bg-amber-500" : "bg-primary/40",
          )}
        />
      }
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold text-foreground">
            {from} → {to}
          </span>
          <span className="amanak-app-meta text-muted-foreground/80">
            {formatDateTime(timestamp, locale)}
          </span>
          {isOverride ? (
            <Badge
              variant="outline"
              className="gap-1 border-amber-500/30 bg-amber-500/10 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300"
            >
              {t("historyEntryActionSetStatus")}
            </Badge>
          ) : null}
        </div>
        <RolePill role={actorRole} />
        {note ? (
          <div className="mt-2 rounded-xl border border-border/40 bg-muted/30 p-4 text-[13px] font-medium leading-relaxed text-muted-foreground shadow-sm">
            {note}
          </div>
        ) : null}
      </div>
    </SpineRow>
  );
}

function TimelineFollowUpRow({
  previous,
  next,
  timestamp,
  actorId,
  locale,
  t,
}: {
  previous: string | undefined;
  next: string | undefined;
  timestamp: string;
  actorId: string;
  locale: string;
  t: CrmT;
}) {
  const labelInstant = (iso: string | undefined) =>
    iso ? formatDateTime(iso, locale) : t("followUpDueNoneLabel");
  return (
    <SpineRow
      iconClass="border-amber-500/25 bg-background"
      dot={<CalendarClock className="size-3.5 text-amber-600/90 dark:text-amber-400" aria-hidden />}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold text-foreground">
            {t("activityFollowUpDueHeading")}
          </span>
          <span className="amanak-app-meta text-muted-foreground/80">
            {formatDateTime(timestamp, locale)}
          </span>
        </div>
        <p className="text-[13px] font-semibold leading-snug text-muted-foreground">
          <span className="text-foreground">{labelInstant(previous)}</span>
          {" → "}
          <span className="text-foreground">{labelInstant(next)}</span>
        </p>
        <div className="text-[11px] font-medium text-muted-foreground">
          {crmTeamMemberName(t, actorId)}
        </div>
      </div>
    </SpineRow>
  );
}

function TimelineJourneyRow({
  stage,
  reachedAt,
  state,
  tPortal,
  locale,
}: {
  stage: LeadJourneyStage;
  reachedAt: string | undefined;
  state: "completed" | "current" | "future";
  tPortal: PortalT;
  locale: string;
}) {
  const suffix = JOURNEY_STAGE_I18N_SUFFIX[stage];
  const label = tPortal(`leadJourney.${suffix}` as Parameters<typeof tPortal>[0]);
  return (
    <SpineRow
      iconClass={cn(
        state === "completed" && "border-primary bg-primary/10",
        state === "current" && "border-primary bg-card ring-2 ring-primary/25",
        state === "future" && "border-border bg-card",
      )}
      dot={
        state === "completed" ? (
          <CheckCircle2 className="size-3 text-primary" aria-hidden />
        ) : state === "current" ? (
          <div className="size-2 rounded-full bg-primary" />
        ) : (
          <div className="size-2 rounded-full bg-muted-foreground/40" />
        )
      }
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p
          className={cn(
            "text-sm font-semibold",
            state === "future" ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {label}
        </p>
        {reachedAt ? (
          <span className="amanak-app-meta text-muted-foreground/80">
            {formatDueDate(reachedAt, locale)}
          </span>
        ) : null}
      </div>
    </SpineRow>
  );
}
