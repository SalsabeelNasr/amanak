import { describe, expect, it } from "vitest";
import {
  computeLeadFollowUpDueAt,
  followUpDueInstantChanged,
} from "@/lib/lead-follow-up-due";
import type { Lead } from "@/types";

function minimalLead(partial: Partial<Lead>): Lead {
  return {
    id: "t",
    patientId: "p",
    patientName: "P",
    patientPhone: "+1",
    patientCountry: "EG",
    treatmentSlug: "x",
    clientType: "b2c",
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

describe("computeLeadFollowUpDueAt", () => {
  it("returns the earliest incomplete task due among candidates", () => {
    const lead = minimalLead({
      tasks: [
        {
          id: "a",
          title: "Later",
          completed: false,
          dueAt: "2030-06-02T12:00:00.000Z",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
          resolution: "open",
        },
        {
          id: "b",
          title: "Sooner",
          completed: false,
          dueAt: "2030-06-01T12:00:00.000Z",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
          resolution: "open",
        },
      ],
    });
    expect(computeLeadFollowUpDueAt(lead)).toBe("2030-06-01T12:00:00.000Z");
  });

  it("includes appointments and manual reminder in the minimum", () => {
    const lead = minimalLead({
      tasks: [],
      appointments: [
        {
          id: "ap1",
          leadId: "t",
          kind: "treatment",
          startsAt: "2030-03-01T08:00:00.000Z",
          locationLabel: "Hospital",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ],
      followUpDueManualAt: "2030-02-01T10:00:00.000Z",
    });
    expect(computeLeadFollowUpDueAt(lead)).toBe("2030-02-01T10:00:00.000Z");
  });

  it("ignores completed tasks", () => {
    const lead = minimalLead({
      tasks: [
        {
          id: "done",
          title: "Done",
          completed: true,
          dueAt: "2020-01-01T12:00:00.000Z",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
          resolution: "completed_manual",
        },
      ],
    });
    expect(computeLeadFollowUpDueAt(lead)).toBeUndefined();
  });
});

describe("followUpDueInstantChanged", () => {
  it("treats undefined and absent as equal", () => {
    expect(followUpDueInstantChanged(undefined, undefined)).toBe(false);
  });

  it("detects instant changes", () => {
    expect(
      followUpDueInstantChanged(
        "2030-01-01T00:00:00.000Z",
        "2030-01-02T00:00:00.000Z",
      ),
    ).toBe(true);
  });
});
