import { formatDateTime, formatDueDate } from "@/components/crm/date-format";
import { LEAD_PATIENT_ASSIGNEE_ID } from "@/lib/services/lead-task-rules";
import type { LeadTask } from "@/types";

/** `useTranslations("crm")` (narrow keys at call site). */
type CrmT = (key: string) => string;

export type LeadTaskDueBadgeResult =
  | { variant: "pill"; label: string; className: string }
  /** Open task past due: show datetime + red icon in UI — not a pill label. */
  | { variant: "overdue"; label: string };

export function crmTeamMemberName(t: CrmT, id: string | undefined): string {
  if (!id) return t("taskAssigneeNone");
  if (id === LEAD_PATIENT_ASSIGNEE_ID) return t("taskAssigneePatientBadge");
  /** Portal patient user ids from mock/BE (e.g. `patient_1`) — not `crm.taskAssignees.*`. */
  if (id.startsWith("patient_")) return t("actorRoles.patient");
  return t(`taskAssignees.${id}`);
}

export function leadTaskDueBadge(
  task: LeadTask,
  t: CrmT,
  locale: string,
  nowMs: number,
): LeadTaskDueBadgeResult {
  if (task.completed) {
    if (task.resolution === "cancelled") {
      return {
        variant: "pill",
        label: t("taskCancelledLabel"),
        className: "border-transparent bg-destructive/15 text-destructive",
      };
    }
    return {
      variant: "pill",
      label: t("taskCompletedLabel"),
      className: "border-transparent bg-muted text-muted-foreground",
    };
  }
  if (!task.dueAt) {
    return {
      variant: "pill",
      label: t("taskDueNone"),
      className: "border-border/60 text-muted-foreground",
    };
  }
  const dueMs = new Date(task.dueAt).getTime();
  if (dueMs < nowMs) {
    return {
      variant: "overdue",
      label: formatDateTime(task.dueAt, locale),
    };
  }
  return {
    variant: "pill",
    label: formatDueDate(task.dueAt, locale),
    className: "border-primary/30 bg-primary/5 text-primary",
  };
}
