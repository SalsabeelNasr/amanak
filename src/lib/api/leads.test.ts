import { describe, expect, it } from "vitest";
import { ORDERED_STATES } from "@/lib/services/state-machine.service";
import { processLeadTasks } from "@/lib/services/lead-task-rules";
import type { Lead, LeadStatus, LeadTask, Quotation } from "@/types";
import type { MockUser } from "@/types";
import { listAvailableSlots } from "./consultation-booking";
import {
  addLeadAppointment,
  addLeadTask,
  createDraftQuotation,
  deleteLeadTask,
  getLeadById,
  listLeads,
  sortLeadTasksForDisplay,
  updateLeadTask,
  uploadLeadDocument,
} from "./leads";

const MOCK_ADMIN: MockUser = {
  id: "admin_1",
  name: "Admin",
  role: "admin",
  email: "admin@amanak.com",
};

const MOCK_CS: MockUser = {
  id: "cs_sara",
  name: "Sara",
  role: "cs",
  email: "cs@amanak.com",
};

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

describe("updateLeadTask system-driven status", () => {
  it("rejects completing pipeline task when actor cannot run the transition", async () => {
    const lead = await getLeadById("lead_2");
    expect(lead?.status).toBe("new");
    const qTask = lead?.tasks.find((x) => x.templateKey === "lead_qualification");
    expect(qTask).toBeDefined();

    await expect(
      updateLeadTask("lead_2", qTask!.id, { completed: true }, { actor: MOCK_CS }),
    ).rejects.toThrow();
  });

  it("advances lead status when admin completes lead_qualification on new lead", async () => {
    const lead = await getLeadById("lead_2");
    expect(lead?.status).toBe("new");
    const qTask = lead?.tasks.find((x) => x.templateKey === "lead_qualification");
    expect(qTask).toBeDefined();

    const out = await updateLeadTask("lead_2", qTask!.id, { completed: true }, {
      actor: MOCK_ADMIN,
    });
    expect(out.status).toBe("assigned");
    const row = out.tasks.find((t) => t.id === qTask!.id);
    expect(row?.completed).toBe(true);
    expect(row?.completedReason).toBe("task_drove_transition");
    expect(out.statusHistory.length).toBeGreaterThan(0);
    expect(out.statusHistory[out.statusHistory.length - 1].action).toBe("ASSIGN_CS");
  });

  it("completing prepare_quotation at quotation_generated does not change status (no mapped action)", async () => {
    const lead = await getLeadById("lead_11");
    expect(lead?.status).toBe("quotation_generated");
    const prep = lead?.tasks.find(
      (x) => x.templateKey === "prepare_quotation" && !x.completed,
    );
    expect(prep).toBeDefined();
    const statusBefore = lead!.status;
    const out = await updateLeadTask("lead_11", prep!.id, { completed: true });
    expect(out.status).toBe(statusBefore);
    expect(out.tasks.find((t) => t.id === prep!.id)?.completed).toBe(true);
    expect(out.tasks.find((t) => t.id === prep!.id)?.completedReason).toBe("user");
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

describe("updateLeadTask creation-type completion", () => {
  it("rejects complete when required creation fields are missing after merge", async () => {
    const withTask = await addLeadTask("lead_7", {
      title: "Internal",
      creationTypeId: "internal_follow_up",
      creationFields: { summary: "Initial summary text" },
      attachments: [],
      createdByUserId: "admin_1",
    });
    const tid = withTask.tasks.find(
      (t) => t.creationTypeId === "internal_follow_up",
    )!.id;

    await updateLeadTask("lead_7", tid, {
      creationFields: { summary: "" },
    });

    await expect(
      updateLeadTask("lead_7", tid, { completed: true }, { actor: MOCK_CS }),
    ).rejects.toThrow();
  });

  it("allows complete when creation fields satisfy the type", async () => {
    const withTask = await addLeadTask("lead_7", {
      title: "Internal two",
      creationTypeId: "internal_follow_up",
      creationFields: { summary: "Ready to close" },
      attachments: [],
      createdByUserId: "admin_1",
    });
    const tid = withTask.tasks.find((t) => t.title === "Internal two")!.id;

    const out = await updateLeadTask(
      "lead_7",
      tid,
      { completed: true },
      { actor: MOCK_CS },
    );
    expect(out.tasks.find((t) => t.id === tid)?.completed).toBe(true);
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
    appointments: [],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("addLeadAppointment", () => {
  it("adds a treatment appointment without creating a task", async () => {
    const before = await getLeadById("lead_2");
    expect(before).toBeDefined();
    const countBefore = before!.appointments.length;
    const taskCountBefore = before!.tasks.length;

    const iso = new Date(Date.now() + 5 * 86_400_000).toISOString();
    const after = await addLeadAppointment("lead_2", {
      kind: "treatment",
      startsAt: iso,
      locationLabel: "Alexandria — Outpatient",
    });

    expect(after.appointments).toHaveLength(countBefore + 1);
    expect(after.tasks).toHaveLength(taskCountBefore);
    const last = after.appointments[after.appointments.length - 1];
    expect(last?.kind).toBe("treatment");
    expect(last && "locationLabel" in last && last.locationLabel).toBe(
      "Alexandria — Outpatient",
    );
  });

  it("creates a linked manual task for team_consultation", async () => {
    const now = new Date();
    const from = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const to = new Date(from.getTime() + 45 * 86_400_000);
    const slots = await listAvailableSlots({ from, to });
    const slot = slots[0];
    expect(slot, "need at least one mock slot").toBeDefined();

    const before = await getLeadById("lead_2");
    const taskCountBefore = before!.tasks.length;
    const apptCountBefore = before!.appointments.length;

    const after = await addLeadAppointment("lead_2", {
      kind: "team_consultation",
      slotId: slot!.id,
      taskTitle: "Team consultation — patient briefing",
      assigneeId: "cs_sara",
    });

    expect(after.appointments).toHaveLength(apptCountBefore + 1);
    expect(after.tasks).toHaveLength(taskCountBefore + 1);

    const appt = after.appointments[after.appointments.length - 1];
    expect(appt?.kind).toBe("team_consultation");
    expect(appt && "linkedTaskId" in appt && appt.linkedTaskId).toBeTruthy();

    const linkedId =
      appt && appt.kind === "team_consultation" ? appt.linkedTaskId : "";
    const task = after.tasks.find((t) => t.id === linkedId);
    expect(task?.title).toBe("Team consultation — patient briefing");
    expect(task?.dueAt).toBe(slot!.startsAt);
    expect(task?.assigneeId).toBe("cs_sara");
    expect(task?.kind).toBe("manual");
  });
});

describe("uploadLeadDocument", () => {
  it("updates an existing row for the same type to uploaded", async () => {
    const before = await getLeadById("lead_3");
    expect(before?.documents.find((d) => d.type === "lab_result")?.status).toBe(
      "pending",
    );

    const after = await uploadLeadDocument("lead_3", {
      type: "lab_result",
      fileName: "labs.pdf",
      uploadedByUserId: "cs_layla",
    });

    const lab = after.documents.find((d) => d.type === "lab_result");
    expect(lab?.status).toBe("uploaded");
    expect(lab?.name).toBe("labs.pdf");
    expect(lab?.uploadedBy).toBe("cs_layla");
  });

  it("appends a document when the lead has no row for that type", async () => {
    const before = await getLeadById("lead_8");
    expect(before?.documents.some((d) => d.type === "other")).toBe(false);
    const countBefore = before!.documents.length;

    const after = await uploadLeadDocument("lead_8", {
      type: "other",
      fileName: "extra-notes.pdf",
    });

    expect(after.documents).toHaveLength(countBefore + 1);
    const other = after.documents.find((d) => d.type === "other");
    expect(other?.name).toBe("extra-notes.pdf");
    expect(other?.status).toBe("uploaded");
    expect(other?.mandatory).toBe(false);
  });

  it("rejects an empty file name", async () => {
    await expect(
      uploadLeadDocument("lead_1", { type: "medical_report", fileName: "   " }),
    ).rejects.toThrow(/file name/i);
  });
});

describe("createDraftQuotation", () => {
  it("appends draft quotation, sets activeQuotationId, and bumps version", async () => {
    const base = {
      packageTier: "silver" as const,
      doctorId: "rashad_bishara",
      hospitalId: "hospital_cairo_1",
      transportMode: { en: "Limousine", ar: "ليموزين" },
      transportRouteCount: 4,
      items: [{ label: { ar: "عنصر", en: "Line" }, amountUSD: 900 }],
      totalUSD: 900,
      downpaymentRequired: true,
      downpaymentUSD: 200,
      termsAndConditions: "terms",
    };

    const first = await createDraftQuotation("lead_10", base);
    expect(first.quotations.length).toBeGreaterThanOrEqual(1);
    const q1 = first.quotations[first.quotations.length - 1];
    expect(q1.status).toBe("draft");
    expect(q1.version).toBeGreaterThanOrEqual(1);
    expect(first.activeQuotationId).toBe(q1.id);

    const second = await createDraftQuotation("lead_10", {
      ...base,
      packageTier: "gold",
      totalUSD: 1100,
      items: [{ label: { ar: "عنصر", en: "Line" }, amountUSD: 1100 }],
    });
    const q2 = second.quotations[second.quotations.length - 1];
    expect(q2.status).toBe("draft");
    expect(q2.version).toBe(q1.version + 1);
    expect(second.activeQuotationId).toBe(q2.id);
  });
});

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
      ownerId: "cs_sara",
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
