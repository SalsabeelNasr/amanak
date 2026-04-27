"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/components/crm/date-format";
import { formatUSD } from "@/components/crm/money";
import { EmptyState } from "@/components/crm/empty-state";
import type { Lead, Quotation } from "@/types";
import { cn } from "@/lib/utils";
import { FileCheck } from "lucide-react";

type LeadQuotationsTabProps = {
  lead: Lead;
  sortedQuotations: Quotation[];
  onViewQuotation: (q: Quotation) => void;
};

export function LeadQuotationsTab({
  lead,
  sortedQuotations,
  onViewQuotation,
}: LeadQuotationsTabProps) {
  const t = useTranslations("crm");
  const tPortal = useTranslations("portal");
  const locale = useLocale();

  if (sortedQuotations.length === 0) {
    return (
      <EmptyState
        icon={FileCheck}
        title={t("quotesTabEmpty")}
        className="rounded-2xl bg-card/50 p-16 shadow-sm ring-1 ring-black/5"
      />
    );
  }

  return (
    <div className="space-y-4">
      {sortedQuotations.map((q) => {
        const isActive = q.id === lead.activeQuotationId;
        const tierLabel = t(
          `leadQuotation.tiers.${q.packageTier}` as Parameters<typeof t>[0],
        );
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
                  {tierLabel} · v{q.version}
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
          </section>
        );
      })}
    </div>
  );
}
