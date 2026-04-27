"use client";

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
    month: "short",
    day: "numeric",
  });
}

export function JourneyTimeline({ lead }: { lead: Lead }) {
  const locale = useLocale();
  const langKey = locale === "ar" ? "ar" : "en";
  const isLost = lead.status === "lost";
  const currentIndex = isLost
    ? getStateIndex("quotation_sent")
    : getStateIndex(lead.status);

  function timestampForState(state: string): string | undefined {
    const entry = lead.statusHistory.find((h) => h.to === state);
    return entry?.timestamp;
  }

  return (
    <div className="overflow-x-auto pb-2">
      <ol className="flex min-w-max items-start gap-4">
        {ORDERED_STATES.map((state, idx) => {
          const completed = idx < currentIndex;
          const current = idx === currentIndex && !isLost;
          const ts = timestampForState(state);
          return (
            <li
              key={state}
              className="flex w-28 shrink-0 flex-col items-center text-center"
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                  completed && "border-primary bg-primary text-primary-foreground",
                  current &&
                    "border-primary bg-card text-primary ring-4 ring-primary/20 animate-pulse",
                  !completed && !current && "border-border bg-card text-muted-foreground",
                )}
              >
                {idx + 1}
              </span>
              <span
                className={cn(
                  "mt-2 text-[11px] font-medium leading-tight",
                  current ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {getStatusLabel(state)[langKey]}
              </span>
              {ts && (
                <span className="mt-1 text-[10px] text-muted-foreground/70">
                  {formatDate(ts, locale)}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {isLost && (
        <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {getStatusLabel("lost")[langKey]}
          {(() => {
            const lostEntry = lead.statusHistory.find((h) => h.to === "lost");
            return lostEntry?.note ? ` — ${lostEntry.note}` : "";
          })()}
        </p>
      )}
    </div>
  );
}
