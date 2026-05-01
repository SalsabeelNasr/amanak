import { describe, expect, it } from "vitest";
import { PIPELINE_MOCK_SEED } from "@/lib/api/requests-pipeline-seed";
import {
  ORDERED_JOURNEY_STAGES,
  firstEnteredJourneyStageTimestamps,
  getJourneyStageIndex,
  journeyDisplayFromStatus,
  journeyStageFromStatus,
} from "@/lib/lead-journey-stage";
import type { Lead, LeadStatus } from "@/types";

function leadById(id: string) {
  const lead = PIPELINE_MOCK_SEED.find((l) => l.id === id);
  if (!lead) throw new Error(`missing ${id}`);
  return lead;
}

describe("journeyStageFromStatus", () => {
  const cases: [LeadStatus, string][] = [
    ["new", "request_sent"],
    ["interested", "request_sent"],
    ["estimate_requested", "request_sent"],
    ["estimate_reviewed", "quotation_in_negotiation"],
    ["quotation_sent", "quotation_in_negotiation"],
    ["changes_requested", "quotation_in_negotiation"],
    ["quotation_accepted", "booked"],
    ["booking", "booked"],
    ["arrived", "arrived"],
    ["in_treatment", "in_treatment"],
    ["completed", "completed"],
  ];

  it.each(cases)("maps %s → %s", (status, expected) => {
    expect(journeyStageFromStatus(status)).toBe(expected);
  });

  it("throws for lost", () => {
    expect(() => journeyStageFromStatus("lost")).toThrow();
  });
});

describe("journeyDisplayFromStatus", () => {
  it("returns lost for lost status", () => {
    expect(journeyDisplayFromStatus("lost")).toBe("lost");
  });
});

describe("ORDERED_JOURNEY_STAGES", () => {
  it("has six stages in funnel order", () => {
    expect(ORDERED_JOURNEY_STAGES).toHaveLength(6);
    expect(getJourneyStageIndex("request_sent")).toBe(0);
    expect(getJourneyStageIndex("completed")).toBe(5);
  });
});

describe("firstEnteredJourneyStageTimestamps", () => {
  it("records first timestamp per stage from history", () => {
    const lead = leadById("lead_1");
    const ts = firstEnteredJourneyStageTimestamps(lead);
    expect(Object.keys(ts).length).toBeGreaterThan(0);
    for (const v of Object.values(ts)) {
      expect(typeof v).toBe("string");
    }
  });

  it("ignores transitions to lost", () => {
    const base = leadById("lead_1");
    const lead: Lead = {
      ...base,
      statusHistory: [
        ...base.statusHistory,
        {
          from: "quotation_sent",
          to: "lost",
          action: "MARK_LOST",
          actorRole: "cs",
          actorId: "cs_sara",
          timestamp: new Date().toISOString(),
        },
      ],
    };
    const ts = firstEnteredJourneyStageTimestamps(lead);
    expect(ts.completed).toBeUndefined();
  });
});
