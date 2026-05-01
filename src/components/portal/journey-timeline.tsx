"use client";

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
    month: "short",
    day: "numeric",
  });
}

export function TreatmentRequestStage({ lead }: { lead: Lead }) {
  const locale = useLocale();
  const t = useTranslations("portal");

  if (lead.status === "lost") {
    return (
      <p className="text-sm text-muted-foreground text-center" role="status">
        {t("leadJourney.closedLost")}
      </p>
    );
  }

  const currentStage = journeyStageFromStatus(lead.status);
  const currentIndex = getJourneyStageIndex(currentStage);
  const stageTimes = firstEnteredJourneyStageTimestamps(lead);

  function labelForStage(stage: LeadJourneyStage): string {
    const suffix = JOURNEY_STAGE_I18N_SUFFIX[stage];
    return t(`leadJourney.${suffix}` as Parameters<typeof t>[0]);
  }

  function timestampForStage(stage: LeadJourneyStage): string | undefined {
    return stageTimes[stage];
  }

  return (
    <div className="overflow-x-auto pb-2">
      <ol className="flex min-w-max items-start gap-4">
        {ORDERED_JOURNEY_STAGES.map((stage, idx) => {
          const completed = idx < currentIndex;
          const current = idx === currentIndex;
          const ts = timestampForStage(stage);
          return (
            <li key={stage} className="flex w-28 shrink-0 flex-col items-center text-center">
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
                {labelForStage(stage)}
              </span>
              {ts ? (
                <span className="mt-1 text-[10px] text-muted-foreground/70">
                  {formatDate(ts, locale)}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
