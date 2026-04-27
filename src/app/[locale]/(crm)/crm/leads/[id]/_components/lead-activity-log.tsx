"use client";

/**
 * CRM lead activity log: chronological status transitions (from → to) with actor, time, and notes.
 * This is not the funnel view — see JourneyTimelineVertical for the canonical pipeline progress UI.
 */

import { useLocale, useTranslations } from "next-intl";
import { ScrollText } from "lucide-react";
import { getStatusLabel } from "@/lib/services/state-machine.service";
import { formatDateTime } from "@/components/crm/date-format";
import { useLangKey } from "@/components/crm/use-lang-key";
import { RolePill } from "@/components/crm/role-pill";
import type { Lead } from "@/types";

export function LeadActivityLog({ lead }: { lead: Lead }) {
  const t = useTranslations("crm");
  const locale = useLocale();
  const langKey = useLangKey();

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
        {lead.statusHistory.length === 0 ? (
          <p className="py-12 text-center text-xs font-medium text-muted-foreground">
            {t("noActivityLog")}
          </p>
        ) : (
          <div className="relative space-y-8 before:absolute before:inset-0 before:start-[11px] before:w-px before:bg-border/60">
            {[...lead.statusHistory].reverse().map((entry, idx) => (
              <div key={idx} className="group relative ps-10">
                <div className="absolute start-0 top-1.5 z-10 flex size-[24px] items-center justify-center rounded-full border-2 border-primary/20 bg-background transition-all group-hover:border-primary group-hover:scale-110">
                  <div className="size-2 rounded-full bg-primary/40 transition-colors group-hover:bg-primary" />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-bold text-foreground">
                      {getStatusLabel(entry.from)[langKey]} →{" "}
                      {getStatusLabel(entry.to)[langKey]}
                    </span>
                    <span className="amanak-app-meta text-muted-foreground/80">
                      {formatDateTime(entry.timestamp, locale)}
                    </span>
                  </div>
                  <div>
                    <RolePill role={entry.actorRole} />
                  </div>
                  {entry.note ? (
                    <div className="mt-3 rounded-xl border border-border/40 bg-muted/30 p-4 text-[13px] font-medium leading-relaxed text-muted-foreground shadow-sm">
                      {entry.note}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
