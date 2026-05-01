"use client";

/** Coarse journey stages (informational). Dates from `statusHistory` when each stage was first reached. */

import { useLocale, useTranslations } from "next-intl";
import {
  ORDERED_JOURNEY_STAGES,
  JOURNEY_STAGE_I18N_SUFFIX,
  firstEnteredJourneyStageTimestamps,
  getJourneyStageIndex,
  journeyStageFromStatus,
} from "@/lib/lead-journey-stage";
import type { Lead, LeadJourneyStage } from "@/types";
import { cn } from "@/lib/utils";

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TreatmentRequestStageVertical({
  lead,
  isExpanded = true,
}: {
  lead: Lead;
  isExpanded?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("portal");

  if (lead.status === "lost") {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        {t("leadJourney.closedLost")}
      </p>
    );
  }

  const currentStage = journeyStageFromStatus(lead.status);
  const currentIndex = getJourneyStageIndex(currentStage);
  const stageTimes = firstEnteredJourneyStageTimestamps(lead);

  const visibleStages = isExpanded
    ? ORDERED_JOURNEY_STAGES
    : ORDERED_JOURNEY_STAGES.slice(0, currentIndex + 1);

  function labelForStage(stage: LeadJourneyStage): string {
    const suffix = JOURNEY_STAGE_I18N_SUFFIX[stage];
    return t(`leadJourney.${suffix}` as Parameters<typeof t>[0]);
  }

  function timestampForStage(stage: LeadJourneyStage): string | undefined {
    return stageTimes[stage];
  }

  return (
    <div className="space-y-1">
      <ol className="space-y-0">
        {visibleStages.map((stage, idx) => {
          const completed = idx < currentIndex;
          const current = idx === currentIndex;
          const ts = timestampForStage(stage);
          const isLast = idx === visibleStages.length - 1;

          return (
            <li key={stage} className="flex gap-4">
              <div className="flex w-8 shrink-0 flex-col items-center pt-0.5">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-semibold transition-colors",
                    completed && "border-primary bg-primary text-primary-foreground",
                    current && "border-primary bg-card text-primary ring-2 ring-primary/25",
                    !completed && !current && "border-border bg-card text-muted-foreground",
                  )}
                  aria-hidden
                >
                  {idx + 1}
                </span>
                {!isLast ? (
                  <div className="mt-1 w-px min-h-6 grow bg-border" aria-hidden />
                ) : null}
              </div>
              <div
                className={cn(
                  "min-w-0 flex-1 pb-5",
                  isLast && !isExpanded && "pb-0",
                  isLast && isExpanded && "pb-0",
                )}
              >
                <p
                  className={cn(
                    "text-sm font-medium leading-snug",
                    current ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {labelForStage(stage)}
                </p>
                {ts ? (
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(ts, locale)}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
