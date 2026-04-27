import { formatDueDate } from "@/components/crm/date-format";
import type { LeadTask } from "@/types";

/** `useTranslations("crm")` (narrow keys at call site). */
type CrmT = (key: string) => string;

export function crmTeamMemberName(t: CrmT, id: string | undefined): string {
  if (!id) return t("taskAssigneeNone");
  return t(`taskAssignees.${id}`);
}

export function leadTaskDueBadge(
  task: LeadTask,
  t: CrmT,
  locale: string,
  nowMs: number,
): { label: string; className: string } | null {
  if (task.completed) {
    if (task.resolution === "cancelled") {
      return {
        label: t("taskCancelledLabel"),
        className: "border-transparent bg-destructive/15 text-destructive",
      };
    }
    return {
      label: t("taskCompletedLabel"),
      className: "border-transparent bg-muted text-muted-foreground",
    };
  }
  if (!task.dueAt) {
    return {
      label: t("taskDueNone"),
      className: "border-border/60 text-muted-foreground",
    };
  }
  const dueMs = new Date(task.dueAt).getTime();
  if (dueMs < nowMs) {
    return {
      label: t("taskDueOverdue"),
      className: "border-transparent bg-destructive/10 text-destructive",
    };
  }
  return {
    label: formatDueDate(task.dueAt, locale),
    className: "border-primary/30 bg-primary/5 text-primary",
  };
}

export function leadTaskSourceBadge(task: LeadTask, t: CrmT): { label: string; className: string } | null {
  if (task.source === "system" || task.templateKey) {
    return {
      label: t("taskSourceAuto"),
      className: "border-primary/30 bg-primary/5 text-primary",
    };
  }
  return null;
}
