import { describe, expect, it } from "vitest";
import {
  getTransitionActionForSystemTaskCompletion,
  isSystemTask,
} from "@/lib/services/lead-task-rules";
import type { Lead, LeadTask } from "@/types";

function baseLead(overrides: Partial<Lead> & Pick<Lead, "id" | "status">): Lead {
  return {
    patientId: "p",
    patientName: "P",
    patientPhone: "+1",
    patientCountry: "X",
    treatmentSlug: "t",
    clientType: "b2c",
    statusHistory: [],
    documents: [],
    quotations: [],
    tasks: [],
    appointments: [],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function sysTask(key: NonNullable<LeadTask["templateKey"]>): LeadTask {
  return {
    id: "t1",
    title: "T",
    completed: false,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    kind: key,
    source: "system",
    templateKey: key,
    resolution: "open",
  };
}

describe("getTransitionActionForSystemTaskCompletion", () => {
  it("returns null for manual tasks", () => {
    const lead = baseLead({ id: "l", status: "estimate_reviewed" });
    const manual: LeadTask = {
      id: "m",
      title: "Manual",
      completed: false,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      kind: "manual",
      source: "user",
      resolution: "open",
    };
    expect(isSystemTask(manual)).toBe(false);
    expect(getTransitionActionForSystemTaskCompletion(lead, manual)).toBeNull();
  });

  it("maps lead_qualification at new to BEGIN_INTAKE", () => {
    expect(
      getTransitionActionForSystemTaskCompletion(
        baseLead({ id: "l", status: "new" }),
        sysTask("lead_qualification"),
      ),
    ).toBe("BEGIN_INTAKE");
  });

  it("maps prepare_quotation from estimate and review stages", () => {
    expect(
      getTransitionActionForSystemTaskCompletion(
        baseLead({ id: "l", status: "estimate_requested" }),
        sysTask("prepare_quotation"),
      ),
    ).toBe("REVIEW_ESTIMATE");
    expect(
      getTransitionActionForSystemTaskCompletion(
        baseLead({ id: "l", status: "estimate_reviewed" }),
        sysTask("prepare_quotation"),
      ),
    ).toBe("DELIVER_QUOTATION");
    expect(
      getTransitionActionForSystemTaskCompletion(
        baseLead({ id: "l", status: "changes_requested" }),
        sysTask("prepare_quotation"),
      ),
    ).toBe("DELIVER_QUOTATION_REVISION");
  });

  it("maps follow-up and logistics templates", () => {
    expect(
      getTransitionActionForSystemTaskCompletion(
        baseLead({ id: "l", status: "in_treatment" }),
        sysTask("treatment_followup"),
      ),
    ).toBe("COMPLETE_TREATMENT");
    expect(
      getTransitionActionForSystemTaskCompletion(
        baseLead({ id: "l", status: "quotation_accepted" }),
        sysTask("create_order"),
      ),
    ).toBe("START_BOOKING");
    expect(
      getTransitionActionForSystemTaskCompletion(
        baseLead({ id: "l", status: "booking" }),
        sysTask("assign_specialist"),
      ),
    ).toBe("MARK_ARRIVED");
    expect(
      getTransitionActionForSystemTaskCompletion(
        baseLead({ id: "l", status: "arrived" }),
        sysTask("send_contract"),
      ),
    ).toBe("START_TREATMENT");
  });
});
