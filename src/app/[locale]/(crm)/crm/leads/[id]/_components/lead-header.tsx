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
import { useLeadModals } from "@/lib/crm/hooks/use-lead-modals";
import { CRM_TASK_ASSIGNEE_IDS } from "@/lib/crm/client.types";
import { getStatusLabel } from "@/lib/services/state-machine.service";
import type { Lead, StateTransition } from "@/types";
import { cn } from "@/lib/utils";
import { crmTeamMemberName } from "./lead-task-badges";
import { Clock, ChevronDown, UserPlus } from "lucide-react";

type LeadHeaderProps = {
  lead: Lead;
  locale: string;
  availableTransitions: StateTransition[];
  onPendingTransitionSelect: (tr: StateTransition) => void;
  onUpdateOwner: (ownerId: string) => void | Promise<void>;
  onUpdateDueDate: (date: string) => void | Promise<void>;
};

export function LeadHeader({
  lead,
  locale,
  availableTransitions,
  onPendingTransitionSelect,
  onUpdateOwner,
  onUpdateDueDate,
}: LeadHeaderProps) {
  const t = useTranslations("crm");
  const langKey = useLangKey();
  const modals = useLeadModals();

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="amanak-app-page-title">{lead.patientName}</h1>
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
                <DialogBody className="grid gap-2 py-4">
                  {availableTransitions.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">{t("noActions")}</p>
                  ) : (
                    availableTransitions.map((tr) => (
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
                    ))
                  )}
                </DialogBody>
              </DialogContent>
            </Dialog>
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
              <span className="text-foreground">{formatDueDate(lead.updatedAt, locale)}</span>
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
