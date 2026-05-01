"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDueDate } from "@/components/crm/date-format";
import { useLangKey } from "@/components/crm/use-lang-key";
import { statusOverviewBadgeClass } from "@/components/crm/status-badge";
import { useRequestModals } from "@/lib/crm/hooks/use-request-modals";
import { CRM_TASK_ASSIGNEE_IDS } from "@/lib/crm/client.types";
import { getStatusLabel } from "@/lib/services/state-machine.service";
import type { Lead, LeadStatus, Patient, StateTransition } from "@/types";
import { cn } from "@/lib/utils";
import { crmTeamMemberName } from "./lead-task-badges";
import { Clock, ChevronDown, UserPlus } from "lucide-react";

type LeadHeaderProps = {
  lead: Lead;
  /** Resolved from {@link Patient} store (request row no longer embeds contact fields). */
  patient?: Patient | null;
  locale: string;
  /** Align overdue checks with task rows (`leadTaskDueBadge`). */
  nowMs: number;
  availableTransitions: StateTransition[];
  /** Statuses reachable as a direct override; rendered under a "Skip to" section. */
  skipToStatuses: LeadStatus[];
  onPendingTransitionSelect: (tr: StateTransition) => void;
  onPendingSkipSelect: (toStatus: LeadStatus) => void;
  onUpdateOwner: (ownerId: string) => void | Promise<void>;
  onUpdateDueDate: (date: string) => void | Promise<void>;
};

export function LeadHeader({
  lead,
  patient,
  locale,
  nowMs,
  availableTransitions,
  skipToStatuses,
  onPendingTransitionSelect,
  onPendingSkipSelect,
  onUpdateOwner,
  onUpdateDueDate,
}: LeadHeaderProps) {
  const t = useTranslations("crm");
  const langKey = useLangKey();
  const modals = useRequestModals();

  const overdueTaskCount = lead.tasks.filter(
    (tk) =>
      !tk.completed &&
      tk.dueAt &&
      new Date(tk.dueAt).getTime() < nowMs,
  ).length;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="amanak-app-page-title">
              {patient?.name ?? lead.patientId}
            </h1>
            <Dialog
              open={modals.state.open === "status-change"}
              onOpenChange={(o) => {
                if (!o) modals.close();
              }}
            >
              <button
                type="button"
                className="group"
                onClick={() => modals.openStatusChange()}
              >
                <Badge
                  className={cn(
                    "cursor-pointer px-2 py-0.5 text-xs font-semibold tracking-tight shadow-sm ring-1 ring-black/5 transition-all group-hover:ring-primary/50",
                    statusOverviewBadgeClass(lead.status),
                  )}
                >
                  {getStatusLabel(lead.status)[langKey]}
                  <ChevronDown className="ms-1 size-2.5 opacity-50 transition-transform group-hover:translate-y-0.5" />
                </Badge>
              </button>
              <DialogContent
                dir={locale === "ar" ? "rtl" : "ltr"}
                size="sm"
                layout="scrollable"
              >
                <DialogHeader>
                  <DialogTitle>{t("changeStatus")}</DialogTitle>
                </DialogHeader>
                <DialogBody className="space-y-5 py-4">
                  {availableTransitions.length === 0 && skipToStatuses.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">{t("noActions")}</p>
                  ) : null}

                  {availableTransitions.length > 0 ? (
                    <section className="space-y-2">
                      <p className="amanak-app-field-label text-muted-foreground">
                        {t("nextStepSection")}
                      </p>
                      <div className="grid gap-2">
                        {availableTransitions.map((tr) => (
                          <Button
                            key={tr.action}
                            variant="outline"
                            className="justify-start text-sm font-medium"
                            onClick={() => {
                              onPendingTransitionSelect(tr);
                              modals.close();
                            }}
                          >
                            {tr.label[langKey]}
                          </Button>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {skipToStatuses.length > 0 ? (
                    <section className="space-y-2">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="amanak-app-field-label text-muted-foreground">
                          {t("skipToSection")}
                        </p>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-amber-700/80 dark:text-amber-400/80">
                          {t("skipToSectionHint")}
                        </p>
                      </div>
                      <div className="grid gap-2">
                        {skipToStatuses.map((s) => (
                          <Button
                            key={s}
                            variant="ghost"
                            className="justify-start text-sm font-medium border border-dashed border-border/60 hover:border-amber-500/40 hover:bg-amber-500/5"
                            onClick={() => {
                              onPendingSkipSelect(s);
                              modals.close();
                            }}
                          >
                            {t("skipToEntry", { status: getStatusLabel(s)[langKey] })}
                          </Button>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </DialogBody>
              </DialogContent>
            </Dialog>
            {overdueTaskCount > 0 ? (
              <Badge
                variant="outline"
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium shadow-none",
                  "border-destructive/40 bg-destructive/10 text-destructive ring-1 ring-destructive/15",
                )}
              >
                <Clock className="size-3 shrink-0 opacity-90" aria-hidden />
                {t("leadHeaderOverdueBadge", { count: overdueTaskCount })}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-border/40 pt-4 sm:border-t-0 sm:pt-0">
          <Dialog
            open={modals.state.open === "owner"}
            onOpenChange={(o) => {
              if (!o) modals.close();
            }}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-2 rounded-xl border-border/60 px-4 text-sm font-medium hover:bg-muted"
              onClick={() => modals.openOwner()}
            >
              <UserPlus className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{t("owner")}:</span>
              <span className="text-foreground">{crmTeamMemberName(t, lead.ownerId)}</span>
              <ChevronDown className="size-3 opacity-40" />
            </Button>
            <DialogContent
              dir={locale === "ar" ? "rtl" : "ltr"}
              size="xs"
              layout="scrollable"
            >
              <DialogHeader>
                <DialogTitle>{t("changeOwner")}</DialogTitle>
              </DialogHeader>
              <DialogBody className="grid gap-2 py-4">
                {CRM_TASK_ASSIGNEE_IDS.map((id) => (
                  <Button
                    key={id}
                    variant={lead.ownerId === id ? "default" : "outline"}
                    className="justify-start text-sm font-medium"
                    onClick={() => onUpdateOwner(id)}
                  >
                    {t(`taskAssignees.${id}` as Parameters<typeof t>[0])}
                  </Button>
                ))}
              </DialogBody>
            </DialogContent>
          </Dialog>

          <Dialog
            open={modals.state.open === "due-date"}
            onOpenChange={(o) => {
              if (!o) modals.close();
            }}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-2 rounded-xl border-border/60 px-4 text-sm font-medium hover:bg-muted"
              onClick={() => modals.openDueDate()}
            >
              <Clock className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{t("dueDate")}:</span>
              <span className="text-foreground">
                {lead.followUpDueAt
                  ? formatDueDate(lead.followUpDueAt, locale)
                  : t("taskDueNone")}
              </span>
              <ChevronDown className="size-3 opacity-40" />
            </Button>
            <DialogContent
              dir={locale === "ar" ? "rtl" : "ltr"}
              size="xs"
              layout="scrollable"
            >
              <DialogHeader>
                <DialogTitle>{t("changeDueDate")}</DialogTitle>
              </DialogHeader>
              <DialogBody className="py-4">
                <Input
                  type="date"
                  className="rounded-xl"
                  onChange={(e) => e.target.value && onUpdateDueDate(e.target.value)}
                />
              </DialogBody>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
