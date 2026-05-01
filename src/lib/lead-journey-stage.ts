/**
 * Patient-facing journey stages vs granular {@link LeadStatus} (state machine).
 * Stages are informational only; all transitions and rules use `LeadStatus`.
 */
import type { Lead, LeadJourneyStage, LeadStatus } from "@/types";

export const ORDERED_JOURNEY_STAGES: LeadJourneyStage[] = [
  "request_sent",
  "quotation_in_negotiation",
  "booked",
  "arrived",
  "in_treatment",
  "completed",
];

/** Suffix for `portal.leadJourney.{suffix}` message keys. */
export const JOURNEY_STAGE_I18N_SUFFIX: Record<LeadJourneyStage, string> = {
  request_sent: "requestSent",
  quotation_in_negotiation: "quotationNegotiation",
  booked: "booked",
  arrived: "arrived",
  in_treatment: "inTreatment",
  completed: "completed",
};

export function getJourneyStageIndex(stage: LeadJourneyStage): number {
  return ORDERED_JOURNEY_STAGES.indexOf(stage);
}

/** Maps granular CRM status to a coarse journey stage. Do not pass `lost` — use {@link journeyDisplayFromStatus}. */
export function journeyStageFromStatus(status: LeadStatus): LeadJourneyStage {
  if (status === "lost") {
    throw new Error("journeyStageFromStatus: lost — use journeyDisplayFromStatus");
  }
  if (status === "completed") return "completed";
  if (status === "in_treatment") return "in_treatment";
  if (status === "arrived") return "arrived";
  if (status === "booking" || status === "quotation_accepted") return "booked";
  if (
    status === "estimate_reviewed" ||
    status === "quotation_sent" ||
    status === "changes_requested"
  ) {
    return "quotation_in_negotiation";
  }
  return "request_sent";
}

export type JourneyDisplay = LeadJourneyStage | "lost";

export function journeyDisplayFromStatus(status: LeadStatus): JourneyDisplay {
  if (status === "lost") return "lost";
  return journeyStageFromStatus(status);
}

/** First time the lead entered each stage, derived from `statusHistory` (by `to` status). */
export function firstEnteredJourneyStageTimestamps(lead: Lead): Partial<Record<LeadJourneyStage, string>> {
  const out: Partial<Record<LeadJourneyStage, string>> = {};
  const sorted = [...lead.statusHistory].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  for (const entry of sorted) {
    if (entry.to === "lost") continue;
    const stage = journeyStageFromStatus(entry.to);
    if (out[stage] == null) {
      out[stage] = entry.timestamp;
    }
  }
  return out;
}
