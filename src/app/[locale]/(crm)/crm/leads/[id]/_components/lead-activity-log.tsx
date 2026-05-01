"use client";

/**
 * CRM lead activity log: pipeline transitions plus follow-up due changes (aggregated from
 * tasks, appointments, manual reminder).
 */

import { useLocale, useTranslations } from "next-intl";
import { CalendarClock, ScrollText } from "lucide-react";
import { getStatusLabel } from "@/lib/services/state-machine.service";
import { formatDateTime } from "@/components/crm/date-format";
import { useLangKey } from "@/components/crm/use-lang-key";
import { RolePill } from "@/components/crm/role-pill";
import { crmTeamMemberName } from "./lead-task-badges";
import type { FollowUpDueHistoryEntry, Lead, StatusHistoryEntry } from "@/types";
import { useMemo } from "react";

type ActivityRow =
  | { kind: "status"; entry: StatusHistoryEntry }
  | { kind: "followUp"; entry: FollowUpDueHistoryEntry };

export function LeadActivityLog({ lead }: { lead: Lead }) {
  const t = useTranslations("crm");
  const locale = useLocale();
  const langKey = useLangKey();

  const rows = useMemo((): ActivityRow[] => {
    const merged: ActivityRow[] = [
      ...lead.statusHistory.map((entry) => ({
        kind: "status" as const,
        entry,
      })),
      ...(lead.followUpDueHistory ?? []).map((entry) => ({
        kind: "followUp" as const,
        entry,
      })),
    ];
    merged.sort(
      (a, b) =>
        Date.parse(b.entry.timestamp) - Date.parse(a.entry.timestamp),
    );
    return merged;
  }, [lead.statusHistory, lead.followUpDueHistory]);

  function labelForDueInstant(iso: string | undefined): string {
    if (!iso) return t("followUpDueNoneLabel");
    return formatDateTime(iso, locale);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-black/5">
      <div className="flex gap-3 border-b border-border bg-muted/30 px-6 py-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ScrollText className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 space-y-1">
          <h2 className="amanak-app-panel-title">{t("activityLog")}</h2>
          <p className="text-[10px] font-medium leading-snug text-muted-foreground/80">
            {t("activityLogDescription")}
          </p>
        </div>
      </div>
      <div className="p-6">
        {rows.length === 0 ? (
          <p className="py-12 text-center text-xs font-medium text-muted-foreground">
            {t("noActivityLog")}
          </p>
        ) : (
          <div className="relative space-y-8 before:absolute before:inset-0 before:start-[11px] before:w-px before:bg-border/60">
            {rows.map((row, idx) =>
              row.kind === "status" ? (
                <div
                  key={`status-${row.entry.timestamp}-${idx}`}
                  className="group relative ps-10"
                >
                  <div className="absolute start-0 top-1.5 z-10 flex size-[24px] items-center justify-center rounded-full border-2 border-primary/20 bg-background transition-all group-hover:border-primary group-hover:scale-110">
                    <div className="size-2 rounded-full bg-primary/40 transition-colors group-hover:bg-primary" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-bold text-foreground">
                        {getStatusLabel(row.entry.from)[langKey]} →{" "}
                        {getStatusLabel(row.entry.to)[langKey]}
                      </span>
                      <span className="amanak-app-meta text-muted-foreground/80">
                        {formatDateTime(row.entry.timestamp, locale)}
                      </span>
                    </div>
                    <div>
                      <RolePill role={row.entry.actorRole} />
                    </div>
                    {row.entry.note ? (
                      <div className="mt-3 rounded-xl border border-border/40 bg-muted/30 p-4 text-[13px] font-medium leading-relaxed text-muted-foreground shadow-sm">
                        {row.entry.note}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div
                  key={`follow-${row.entry.timestamp}-${idx}`}
                  className="group relative ps-10"
                >
                  <div className="absolute start-0 top-1.5 z-10 flex size-[24px] items-center justify-center rounded-full border-2 border-amber-500/25 bg-background transition-all group-hover:border-amber-500 group-hover:scale-110">
                    <CalendarClock
                      className="size-3.5 text-amber-600/90 dark:text-amber-400"
                      aria-hidden
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-bold text-foreground">
                        {t("activityFollowUpDueHeading")}
                      </span>
                      <span className="amanak-app-meta text-muted-foreground/80">
                        {formatDateTime(row.entry.timestamp, locale)}
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold leading-snug text-muted-foreground">
                      <span className="text-foreground">
                        {labelForDueInstant(row.entry.previousFollowUpDueAt)}
                      </span>
                      {" → "}
                      <span className="text-foreground">
                        {labelForDueInstant(row.entry.nextFollowUpDueAt)}
                      </span>
                    </p>
                    <div className="text-[11px] font-medium text-muted-foreground">
                      {crmTeamMemberName(t, row.entry.actorId)}
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}
