"use client";

import {
  type Dispatch,
  type SetStateAction,
  useState,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogShell } from "@/components/crm/dialog-shell";
import { formatDateTime } from "@/components/crm/date-format";
import { formatUSD } from "@/components/crm/money";
import { EmptyState } from "@/components/crm/empty-state";
import { crm } from "@/lib/crm/client";
import type { Lead, Quotation } from "@/types";
import { cn } from "@/lib/utils";
import { FileCheck } from "lucide-react";

type LeadQuotationsTabProps = {
  lead: Lead;
  sortedQuotations: Quotation[];
  displayedQuotations: Quotation[];
  onViewQuotation: (q: Quotation) => void;
  isAuthenticated: boolean;
  setLead: Dispatch<SetStateAction<Lead>>;
  onApproveQuotationSuccess?: () => void;
};

export function LeadQuotationsTab({
  lead,
  sortedQuotations,
  displayedQuotations,
  onViewQuotation,
  isAuthenticated,
  setLead,
  onApproveQuotationSuccess,
}: LeadQuotationsTabProps) {
  const t = useTranslations("crm");
  const tPortal = useTranslations("portal");
  const locale = useLocale();
  const [approveTargetId, setApproveTargetId] = useState<string | null>(null);
  const [approveSubmitting, setApproveSubmitting] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  const approveTarget =
    approveTargetId && lead.quotations.some((x) => x.id === approveTargetId)
      ? lead.quotations.find((x) => x.id === approveTargetId)
      : null;

  async function confirmApproveSend() {
    if (!approveTarget || !approveTarget.id) return;
    setApproveSubmitting(true);
    setApproveError(null);
    try {
      const updated = await crm.leads.sendDraftQuotationToPatient(
        lead.id,
        approveTarget.id,
        {},
      );
      setLead(updated);
      onApproveQuotationSuccess?.();
      setApproveTargetId(null);
    } catch (e) {
      console.error(e);
      setApproveError(t("leadQuotation.approveErrorGeneric"));
    } finally {
      setApproveSubmitting(false);
    }
  }

  if (sortedQuotations.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={FileCheck}
          title={t("quotesTabEmpty")}
          className="rounded-2xl bg-card/50 p-16 shadow-sm ring-1 ring-black/5"
        />
      </div>
    );
  }

  if (displayedQuotations.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={FileCheck}
          title={t("quotesTabEmptyFiltered")}
          className="rounded-2xl bg-card/50 p-16 shadow-sm ring-1 ring-black/5"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DialogShell
        open={Boolean(approveTargetId)}
        onOpenChange={(open) => {
          if (open) return;
          if (approveSubmitting) return;
          setApproveTargetId(null);
          setApproveError(null);
        }}
      >
        <DialogContent size="md" layout="default" showCloseButton>
          <DialogHeader>
            <DialogTitle>{t("leadQuotation.approveDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("leadQuotation.approveDialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {approveTarget ? (
              <p className="text-muted-foreground text-sm">
                {t("quotesTabHeading")}, v{approveTarget.version},{" "}
                {formatUSD(approveTarget.totalUSD, locale)}
              </p>
            ) : null}
            {approveError ? (
              <p className="text-destructive text-sm font-medium" role="alert">
                {approveError}
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter className="gap-2 border-t border-border pt-4 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl text-sm font-semibold"
              disabled={approveSubmitting}
              onClick={() => setApproveTargetId(null)}
            >
              {t("leadQuotation.approveCancel")}
            </Button>
            <Button
              type="button"
              className="rounded-xl text-sm font-semibold shadow-md"
              disabled={approveSubmitting || !approveTarget}
              onClick={confirmApproveSend}
            >
              {approveSubmitting
                ? t("leadQuotation.approveSubmitting")
                : t("leadQuotation.approveConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogShell>

      {displayedQuotations.map((q) => {
        const isActive = q.id === lead.activeQuotationId;
        const statusLabel = t(
          `leadQuotation.viewStatus.${q.status}` as Parameters<typeof t>[0],
        );
        return (
          <section
            key={q.id}
            className={cn(
              "overflow-hidden rounded-2xl border shadow-sm ring-1 ring-black/5",
              isActive
                ? "border-primary/30 bg-primary text-primary-foreground ring-primary/20"
                : "border-border bg-card",
            )}
          >
            <div
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6",
                isActive ? "border-white/10 bg-white/5" : "border-border bg-muted/30",
              )}
            >
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <FileCheck
                  className={cn("size-4 shrink-0", isActive ? "text-white" : "text-primary")}
                  aria-hidden
                />
                <h2
                  className={cn(
                    "truncate text-base font-semibold tracking-tight",
                    isActive ? "text-white" : "text-foreground",
                  )}
                >
                  {t("quotesTabHeading")}, v{q.version}
                </h2>
                {isActive ? (
                  <Badge
                    variant="outline"
                    className="border-white/25 text-[10px] font-bold uppercase tracking-wide text-white"
                  >
                    {t("quotesTabActiveBadge")}
                  </Badge>
                ) : null}
              </div>
              <Badge
                variant={isActive ? "outline" : "secondary"}
                className={cn("text-xs font-semibold", isActive && "border-white/20 text-white")}
              >
                {statusLabel}
              </Badge>
            </div>
            <div
              className={cn(
                "flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6",
                !isActive && "text-foreground",
              )}
            >
              <div>
                <p
                  className={cn(
                    "mb-1 text-xs font-medium",
                    isActive ? "text-white/70" : "text-muted-foreground",
                  )}
                >
                  {tPortal("total")}
                </p>
                <p
                  className={cn(
                    "text-3xl font-bold tabular-nums tracking-tight sm:text-4xl",
                    isActive ? "text-white" : "text-primary",
                  )}
                >
                  {formatUSD(q.totalUSD, locale)}
                </p>
                <p
                  className={cn(
                    "mt-2 text-[11px] font-medium",
                    isActive ? "text-white/60" : "text-muted-foreground",
                  )}
                >
                  {t("quotesTabCreated")}: {formatDateTime(q.createdAt, locale)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {q.status === "draft" && isAuthenticated ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-9 shrink-0 rounded-xl px-4 text-sm font-semibold",
                      isActive &&
                        "border-white/40 bg-white/10 text-white hover:bg-white/20",
                    )}
                    onClick={() => {
                      setApproveError(null);
                      setApproveTargetId(q.id);
                    }}
                  >
                    {t("leadQuotation.approveButton")}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant={isActive ? "secondary" : "default"}
                  className={cn(
                    "h-9 shrink-0 rounded-xl px-4 text-sm font-semibold shadow-sm",
                    isActive && "bg-white text-primary hover:bg-white/90",
                  )}
                  onClick={() => onViewQuotation(q)}
                >
                  {t("quotesTabView")}
                </Button>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
