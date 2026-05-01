import { describe, expect, it } from "vitest";
import { computeRequestQualificationDueAt } from "@/lib/services/lead-task-rules";
import type { Lead } from "@/types";

function minimalLead(partial: Partial<Lead>): Lead {
  return {
    id: "t",
    patientId: "p",
    treatmentSlug: "x",
    recordType: "request",
    status: "new",
    statusHistory: [],
    documents: [],
    quotations: [],
    tasks: [],
    appointments: [],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("computeRequestQualificationDueAt", () => {
  it("uses earliest appointment start when appointments exist", () => {
    const lead = minimalLead({
      appointments: [
        {
          id: "a1",
          requestId: "t",
          kind: "treatment",
          startsAt: "2031-06-15T14:00:00.000Z",
          locationLabel: "Clinic",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "a2",
          requestId: "t",
          kind: "online_meeting",
          startsAt: "2031-06-10T09:00:00.000Z",
          meetingUrl: "https://x.test/meet",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ],
    });
    expect(
      computeRequestQualificationDueAt(
        lead,
        "2031-01-01T12:00:00.000Z",
        24,
      ),
    ).toBe("2031-06-10T09:00:00.000Z");
  });

  it("uses SLA hours from qualification creation when no appointments", () => {
    const lead = minimalLead({});
    expect(
      computeRequestQualificationDueAt(
        lead,
        "2031-03-01T10:00:00.000Z",
        24,
      ),
    ).toBe("2031-03-02T10:00:00.000Z");
  });

  it("respects custom SLA hours", () => {
    const lead = minimalLead({});
    expect(
      computeRequestQualificationDueAt(
        lead,
        "2031-03-01T10:00:00.000Z",
        48,
      ),
    ).toBe("2031-03-03T10:00:00.000Z");
  });
});
