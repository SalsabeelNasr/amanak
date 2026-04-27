"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { InfiniteCardList } from "@/components/crm/infinite-card-list";
import type { LeadTask } from "@/types";
import { cn } from "@/lib/utils";
import {
  crmTeamMemberName,
  leadTaskDueBadge,
  leadTaskSourceBadge,
} from "../lead-task-badges";
import type { LeadTasksSubtabFilter } from "../lead-detail-types";
import { ChevronRight, Pin } from "lucide-react";

type LeadTasksTabProps = {
  tasks: LeadTask[];
  tasksTabFilter: LeadTasksSubtabFilter;
  taskActionError: string | null;
  onOpenTaskDetail: (taskId: string) => void;
  nowMs: number;
};

export function LeadTasksTab({
  tasks,
  tasksTabFilter,
  taskActionError,
  onOpenTaskDetail,
  nowMs,
}: LeadTasksTabProps) {
  const t = useTranslations("crm");
  const locale = useLocale();

  return (
    <div className="space-y-6">
      {taskActionError ? (
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-bold text-destructive"
          role="alert"
        >
          {taskActionError}
        </div>
      ) : null}

      <InfiniteCardList
        key={String(tasksTabFilter)}
        items={tasks}
        getItemKey={(taskItem) => taskItem.id}
        initialVisible={12}
        pageSize={12}
        empty={
          <p className="py-6 text-center text-sm text-muted-foreground">
            {tasksTabFilter === "all"
              ? t("taskEmpty")
              : tasksTabFilter === "active"
                ? t("noActiveTasks")
                : t("noPreviousTasks")}
          </p>
        }
        renderItem={(taskItem) => {
          const isOpen = !taskItem.completed;
          const badge = leadTaskDueBadge(taskItem, t, locale, nowMs);
          const autoBadge = isOpen ? leadTaskSourceBadge(taskItem, t) : null;
          return (
            <button
              type="button"
              onClick={() => onOpenTaskDetail(taskItem.id)}
              className={cn(
                "group flex w-full flex-col gap-4 rounded-xl border border-border bg-card p-4 text-start shadow-sm ring-1 ring-black/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:flex-row sm:items-center sm:justify-between",
                isOpen ? "hover:bg-muted/5" : "opacity-60 grayscale-[0.5] hover:bg-muted/10",
              )}
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-start gap-2">
                  {isOpen ? (
                    <span
                      className="mt-0.5 inline-flex shrink-0 text-primary"
                      aria-label={t("taskPinnedAria")}
                    >
                      <Pin className="size-3.5" aria-hidden />
                    </span>
                  ) : null}
                  <p
                    className={cn(
                      "amanak-app-value min-w-0 flex-1",
                      !isOpen && "text-muted-foreground line-through",
                    )}
                  >
                    {taskItem.title}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex flex-wrap items-center gap-x-3 gap-y-1",
                    isOpen && "ms-[calc(0.875rem+0.5rem)]",
                  )}
                >
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
          );
        }}
      />
    </div>
  );
}
