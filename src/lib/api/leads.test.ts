import { describe, expect, it } from "vitest";
import { ORDERED_STATES } from "@/lib/services/state-machine.service";
import { processLeadTasks } from "@/lib/services/lead-task-rules";
import type { Lead, LeadStatus, LeadTask, Quotation } from "@/types";
import {
  addLeadTask,
  deleteLeadTask,
  getLeadById,
  listLeads,
  sortLeadTasksForDisplay,
  updateLeadTask,
} from "./leads";

const ALL_LEAD_STATUSES: LeadStatus[] = [...ORDERED_STATES, "rejected"];

describe("listLeads mock seed", () => {
  it("includes at least one lead per LeadStatus", async () => {
    const leads = await listLeads();
    const seen = new Set(leads.map((l) => l.status));
    for (const status of ALL_LEAD_STATUSES) {
      expect(seen.has(status), `missing mock lead for status: ${status}`).toBe(
        true,
      );
    }
    expect(seen.size).toBe(ALL_LEAD_STATUSES.length);
  });
});

describe("sortLeadTasksForDisplay", () => {
  const ref = Date.parse("2024-06-15T12:00:00Z");

  function task(partial: Partial<LeadTask> & Pick<LeadTask, "id" | "title">): LeadTask {
    return {
      completed: false,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      ...partial,
    };
  }

  it("lists incomplete tasks before completed", () => {
    const sorted = sortLeadTasksForDisplay(
      [
        task({ id: "done", title: "Done", completed: true, updatedAt: "2024-06-10T00:00:00.000Z" }),
        task({ id: "open", title: "Open", updatedAt: "2024-06-01T00:00:00.000Z" }),
      ],
      ref,
    );
    expect(sorted.map((t) => t.id)).toEqual(["open", "done"]);
  });

  it("orders incomplete: overdue, then future due, then no due", () => {
    const sorted = sortLeadTasksForDisplay(
      [
        task({
          id: "future",
          title: "Future",
          dueAt: "2024-06-20T12:00:00.000Z",
        }),
        task({
          id: "nodue",
          title: "No due",
        }),
        task({
          id: "overdue",
          title: "Overdue",
          dueAt: "2024-06-10T12:00:00.000Z",
        }),
      ],
      ref,
    );
    expect(sorted.map((t) => t.id)).toEqual(["overdue", "future", "nodue"]);
  });

  it("among overdue, earlier due (more overdue) first", () => {
    const sorted = sortLeadTasksForDisplay(
      [
        task({
          id: "less",
          title: "Less overdue",
          dueAt: "2024-06-14T12:00:00.000Z",
        }),
        task({
          id: "more",
          title: "More overdue",
          dueAt: "2024-06-01T12:00:00.000Z",
        }),
      ],
      ref,
    );
    expect(sorted.map((t) => t.id)).toEqual(["more", "less"]);
  });

  it("tie-breaks incomplete by updatedAt descending", () => {
    const sorted = sortLeadTasksForDisplay(
      [
        task({
          id: "old",
          title: "Old",
          dueAt: "2024-06-20T12:00:00.000Z",
          updatedAt: "2024-06-01T00:00:00.000Z",
        }),
        task({
          id: "new",
          title: "New",
          dueAt: "2024-06-20T12:00:00.000Z",
          updatedAt: "2024-06-05T00:00:00.000Z",
        }),
      ],
      ref,
    );
    expect(sorted.map((t) => t.id)).toEqual(["new", "old"]);
  });
});

describe("lead task CRUD", () => {
  it("adds, updates, and deletes a task on a lead", async () => {
    const before = await getLeadById("lead_7");
    const initialManual = before?.tasks.filter((t) => t.kind === "manual" || !t.source) ?? [];
    expect(initialManual).toEqual([]);

    const added = await addLeadTask("lead_7", {
      title: "Unit test task",
      createdByUserId: "admin_1",
    });
    const manualTasks = added.tasks.filter((t) => t.kind === "manual");
    expect(manualTasks).toHaveLength(1);
    const tid = manualTasks[0].id;

    const toggled = await updateLeadTask("lead_7", tid, { completed: true });
    const row = toggled.tasks.find((t) => t.id === tid);
    expect(row?.completed).toBe(true);
    expect(row?.completedReason).toBe("user");
    expect(row?.resolution).toBe("completed_manual");

    const removed = await deleteLeadTask("lead_7", tid);
    const afterManual = removed.tasks.filter((t) => t.kind === "manual");
    expect(afterManual).toHaveLength(0);
  });
});

function sampleLead(
  overrides: Partial<Lead> & Pick<Lead, "id" | "status">,
): Lead {
  return {
    patientId: "patient_test",
    patientName: "Test Patient",
    patientPhone: "+1000000000",
    patientCountry: "Testland",
    treatmentSlug: "joint-replacement",
    clientType: "b2c",
    statusHistory: [],
    documents: [],
    quotations: [],
    tasks: [],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("processLeadTasks (hybrid auto tasks)", () => {
  const at = "2024-06-01T12:00:00.000Z";

  it("ensures lead_qualification for new status", () => {
    const lead = sampleLead({ id: "syn_new", status: "new" });
    const out = processLeadTasks(lead, lead, at);
    const t = out.tasks.find((x) => x.templateKey === "lead_qualification");
    expect(t).toBeDefined();
    expect(t?.completed).toBe(false);
    expect(t?.source).toBe("system");
  });

  it("auto-completes lead_qualification when status moves past new", () => {
    const newLead = sampleLead({ id: "syn_q", status: "new" });
    const withQ = processLeadTasks(newLead, newLead, at);
    const assigned = { ...withQ, status: "assigned" as const };
    const out = processLeadTasks(withQ, assigned, at);
    const t = out.tasks.find((x) => x.templateKey === "lead_qualification");
    expect(t?.completed).toBe(true);
    expect(t?.resolution).toBe("completed_rule");
    expect(t?.completedReason).toBe("status_transition");
  });

  it("auto-completes prepare_quotation when a quotation is sent to patient", () => {
    const lead = sampleLead({
      id: "syn_quote",
      status: "approved",
      assignedCsId: "cs_sara",
    });
    const withPrep = processLeadTasks(lead, lead, at);
    const prepOpen = withPrep.tasks.find((x) => x.templateKey === "prepare_quotation");
    expect(prepOpen?.completed).toBe(false);

    const quote: Quotation = {
      id: "quote_syn",
      leadId: "syn_quote",
      packageTier: "normal",
      items: [{ label: { ar: "x", en: "x" }, amountUSD: 100 }],
      totalUSD: 100,
      status: "sent_to_patient",
      downpaymentRequired: false,
      termsAndConditions: "t",
      createdAt: at,
      version: 1,
    };
    const sent = {
      ...withPrep,
      quotations: [quote],
    };
    const out = processLeadTasks(withPrep, sent, at);
    const prep = out.tasks.find((x) => x.templateKey === "prepare_quotation");
    expect(prep?.completed).toBe(true);
    expect(prep?.completedReason).toBe("quotation_sent");
  });
});
