"use client";

/** Funnel timeline: fixed ORDERED_STATES; per-stage dates are taken from `lead.statusHistory` (append-only transition log). */

import { useLocale } from "next-intl";
import {
  ORDERED_STATES,
  getStateIndex,
  getStatusLabel,
} from "@/lib/services/state-machine.service";
import type { Lead } from "@/types";
import { cn } from "@/lib/utils";

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function JourneyTimelineVertical({ 
  lead, 
  isExpanded = true 
}: { 
  lead: Lead; 
  isExpanded?: boolean;
}) {
  const locale = useLocale();
  const langKey = locale === "ar" ? "ar" : "en";
  const isLost = lead.status === "lost";
  const currentIndex = isLost
    ? getStateIndex("quotation_sent")
    : getStateIndex(lead.status);

  const visibleStates = isExpanded 
    ? ORDERED_STATES 
    : ORDERED_STATES.slice(0, currentIndex + 1);

  function timestampForState(state: string): string | undefined {
    const entry = lead.statusHistory.find((h) => h.to === state);
    return entry?.timestamp;
  }

  return (
    <div className="space-y-1">
      <ol className="space-y-0">
        {visibleStates.map((state, idx) => {
          const completed = idx < currentIndex;
          const current = idx === currentIndex && !isLost;
          const ts = timestampForState(state);
          const isLast = idx === visibleStates.length - 1;

          return (
            <li key={state} className="flex gap-4">
              <div className="flex w-8 shrink-0 flex-col items-center pt-0.5">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-semibold transition-colors",
                    completed && "border-primary bg-primary text-primary-foreground",
                    current &&
                      "border-primary bg-card text-primary ring-2 ring-primary/25",
                    !completed &&
                      !current &&
                      "border-border bg-card text-muted-foreground",
                  )}
                  aria-hidden
                >
                  {idx + 1}
                </span>
                {!isLast ? (
                  <div
                    className="mt-1 w-px min-h-6 grow bg-border"
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className={cn("min-w-0 flex-1 pb-8", isLast && !isExpanded && "pb-0", isLast && isExpanded && "pb-0")}>
                <p
                  className={cn(
                    "text-sm font-medium leading-snug",
                    current ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {getStatusLabel(state)[langKey]}
                </p>
                {ts ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(ts, locale)}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {isLost ? (
        <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {getStatusLabel("lost")[langKey]}
          {(() => {
            const lostEntry = lead.statusHistory.find((h) => h.to === "lost");
            return lostEntry?.note ? ` — ${lostEntry.note}` : "";
          })()}
        </p>
      ) : null}
    </div>
  );
}
