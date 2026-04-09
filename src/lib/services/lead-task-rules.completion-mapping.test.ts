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
    const lead = baseLead({ id: "l", status: "approved" });
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

  it("maps prepare_quotation from approved only", () => {
    const task = sysTask("prepare_quotation");
    expect(
      getTransitionActionForSystemTaskCompletion(
        baseLead({ id: "l", status: "approved" }),
        task,
      ),
    ).toBe("GENERATE_QUOTATION");
    expect(
      getTransitionActionForSystemTaskCompletion(
        baseLead({ id: "l", status: "quotation_generated" }),
        task,
      ),
    ).toBeNull();
  });

  it("maps collect_documents by document status", () => {
    const task = sysTask("collect_documents");
    expect(
      getTransitionActionForSystemTaskCompletion(
        baseLead({ id: "l", status: "docs_missing" }),
        task,
      ),
    ).toBe("MARK_DOCS_PARTIAL");
    expect(
      getTransitionActionForSystemTaskCompletion(
        baseLead({ id: "l", status: "docs_partial" }),
        task,
      ),
    ).toBe("MARK_DOCS_COMPLETE");
  });

  it("maps lead_qualification at new to ASSIGN_CS", () => {
    expect(
      getTransitionActionForSystemTaskCompletion(
        baseLead({ id: "l", status: "new" }),
        sysTask("lead_qualification"),
      ),
    ).toBe("ASSIGN_CS");
  });

  it("maps remaining templates", () => {
    expect(
      getTransitionActionForSystemTaskCompletion(
        baseLead({ id: "l", status: "consultant_review_ready" }),
        sysTask("consultant_review"),
      ),
    ).toBe("APPROVE_MEDICAL");
    expect(
      getTransitionActionForSystemTaskCompletion(
        baseLead({ id: "l", status: "quotation_generated" }),
        sysTask("send_contract"),
      ),
    ).toBe("SEND_CONTRACT");
    expect(
      getTransitionActionForSystemTaskCompletion(
        baseLead({ id: "l", status: "awaiting_payment" }),
        sysTask("confirm_payment"),
      ),
    ).toBe("VERIFY_PAYMENT");
    expect(
      getTransitionActionForSystemTaskCompletion(
        baseLead({ id: "l", status: "payment_verified" }),
        sysTask("create_order"),
      ),
    ).toBe("CREATE_ORDER");
    expect(
      getTransitionActionForSystemTaskCompletion(
        baseLead({ id: "l", status: "order_created" }),
        sysTask("assign_specialist"),
      ),
    ).toBe("ASSIGN_DOCTOR");
    expect(
      getTransitionActionForSystemTaskCompletion(
        baseLead({ id: "l", status: "in_treatment" }),
        sysTask("treatment_followup"),
      ),
    ).toBe("COMPLETE_TREATMENT");
  });
});
