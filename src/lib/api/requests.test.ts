import { afterEach, describe, expect, it } from "vitest";
import { resetCrmSettingsForTests } from "@/lib/api/crm-settings";
import { REQUEST_TASK_TEMPLATE_TITLES, processRequestTasks } from "@/lib/services/lead-task-rules";
import { ORDERED_STATES } from "@/lib/services/state-machine.service";
import type {
  Request,
  RequestDocument,
  RequestStatus,
  RequestTask,
  Quotation,
} from "@/types";
import type { MockUser } from "@/types";
import { listAvailableSlots } from "./consultation-booking";
import { computeRequestFollowUpDueAt } from "@/lib/lead-follow-up-due";
import {
  addRequestAppointment,
  addRequestTask,
  createDraftQuotation,
  deleteRequestTask,
  getRequestById,
  listRequests,
  sendDraftQuotationToPatient,
  setRequestStatus,
  sortRequestTasksForDisplay,
  updateRequest,
  updateRequestTask,
  uploadRequestDocument,
} from "./requests";
import { REQUEST_PATIENT_ASSIGNEE_ID } from "@/lib/services/lead-task-rules";

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

const MOCK_PATIENT: MockUser = {
  id: "patient_1",
  name: "Patient",
  role: "patient",
  email: "p@example.com",
};

const ALL_LEAD_STATUSES: RequestStatus[] = [...ORDERED_STATES];

describe("listRequests mock seed", () => {
  it("includes at least one lead per RequestStatus", async () => {
    const leads = await listRequests();
    const seen = new Set(leads.map((l) => l.status));
    for (const status of ALL_LEAD_STATUSES) {
      expect(seen.has(status), `missing mock lead for status: ${status}`).toBe(
        true,
      );
    }
    expect(seen.size).toBe(ALL_LEAD_STATUSES.length);
  });
});

describe("sortRequestTasksForDisplay", () => {
  const ref = Date.parse("2024-06-15T12:00:00Z");

  function task(partial: Partial<RequestTask> & Pick<RequestTask, "id" | "title">): RequestTask {
    return {
      completed: false,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      ...partial,
    };
  }

  it("lists incomplete tasks before completed", () => {
    const sorted = sortRequestTasksForDisplay(
      [
        task({ id: "done", title: "Done", completed: true, updatedAt: "2024-06-10T00:00:00.000Z" }),
        task({ id: "open", title: "Open", updatedAt: "2024-06-01T00:00:00.000Z" }),
      ],
      ref,
    );
    expect(sorted.map((t) => t.id)).toEqual(["open", "done"]);
  });

  it("orders incomplete: overdue, then future due, then no due", () => {
    const sorted = sortRequestTasksForDisplay(
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
    const sorted = sortRequestTasksForDisplay(
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
    const sorted = sortRequestTasksForDisplay(
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

describe("updateRequestTask system-driven status", () => {
  it("rejects completing pipeline task when actor cannot run the transition", async () => {
    const lead = await getRequestById("lead_2");
    expect(lead?.status).toBe("new");
    const qTask = lead?.tasks.find((x) => x.templateKey === "lead_qualification");
    expect(qTask).toBeDefined();

    await expect(
      updateRequestTask("lead_2", qTask!.id, { completed: true }, { actor: MOCK_PATIENT }),
    ).rejects.toThrow();
  });

  it("advances lead status when admin completes lead_qualification on new lead", async () => {
    const lead = await getRequestById("lead_2");
    expect(lead?.status).toBe("new");
    const qTask = lead?.tasks.find((x) => x.templateKey === "lead_qualification");
    expect(qTask).toBeDefined();

    const out = await updateRequestTask("lead_2", qTask!.id, { completed: true }, {
      actor: MOCK_ADMIN,
    });
    expect(out.status).toBe("interested");
    const row = out.tasks.find((t) => t.id === qTask!.id);
    expect(row?.completed).toBe(true);
    expect(row?.completedReason).toBe("task_drove_transition");
    expect(out.statusHistory.length).toBeGreaterThan(0);
    expect(out.statusHistory[out.statusHistory.length - 1].action).toBe("BEGIN_INTAKE");
  });

  it("completing prepare_quotation on estimate_reviewed advances with actor", async () => {
    const lead = await getRequestById("lead_5");
    expect(lead?.status).toBe("estimate_reviewed");
    const prep = lead?.tasks.find(
      (x) => x.templateKey === "prepare_quotation" && !x.completed,
    );
    expect(prep).toBeDefined();
    const out = await updateRequestTask("lead_5", prep!.id, { completed: true }, {
      actor: MOCK_CS,
    });
    expect(out.status).toBe("quotation_sent");
  });
});

describe("lead follow-up due aggregation", () => {
  it("updates followUpDueAt and logs history when adding a dated task shifts the aggregate", async () => {
    const before = await getRequestById("lead_8");
    expect(before).toBeDefined();
    const prevHist = before!.followUpDueHistory ?? [];
    const prevComputed = computeRequestFollowUpDueAt(before!);

    const due = "2038-03-15T12:00:00.000Z";
    const after = await addRequestTask("lead_8", {
      title: "Aggregation test task",
      dueAt: due,
      createdByUserId: "admin_1",
    });

    expect(after.followUpDueAt).toBe(computeRequestFollowUpDueAt(after));
    const nextComputed = after.followUpDueAt;
    expect(nextComputed).toBeDefined();

    if (prevComputed !== nextComputed) {
      expect((after.followUpDueHistory ?? []).length).toBeGreaterThan(prevHist.length);
      const last = (after.followUpDueHistory ?? [])[
        (after.followUpDueHistory ?? []).length - 1
      ];
      expect(last?.nextFollowUpDueAt).toBe(nextComputed);
    }
  });

  it("records manual reminder changes via updateRequest with actor", async () => {
    await updateRequest(
      "lead_12",
      { followUpDueManualAt: "2035-06-01T12:00:00.000Z" },
      { actor: MOCK_CS },
    );
    const lead = await getRequestById("lead_12");
    expect(lead?.followUpDueManualAt).toBe("2035-06-01T12:00:00.000Z");
    expect(lead?.followUpDueAt).toBe("2035-06-01T12:00:00.000Z");
    expect(lead?.followUpDueHistory?.length).toBeGreaterThan(0);
  });
});

describe("lead task CRUD", () => {
  it("adds, updates, and deletes a task on a lead", async () => {
    const before = await getRequestById("lead_7");
    const initialManual = before?.tasks.filter((t) => t.kind === "manual" || !t.source) ?? [];
    expect(initialManual).toEqual([]);

    const added = await addRequestTask("lead_7", {
      title: "Unit test task",
      createdByUserId: "admin_1",
    });
    const manualTasks = added.tasks.filter((t) => t.kind === "manual");
    expect(manualTasks).toHaveLength(1);
    const tid = manualTasks[0].id;

    const toggled = await updateRequestTask("lead_7", tid, { completed: true });
    const row = toggled.tasks.find((t) => t.id === tid);
    expect(row?.completed).toBe(true);
    expect(row?.completedReason).toBe("user");
    expect(row?.resolution).toBe("completed_manual");

    const removed = await deleteRequestTask("lead_7", tid);
    const afterManual = removed.tasks.filter((t) => t.kind === "manual");
    expect(afterManual).toHaveLength(0);
  });
});

describe("updateRequestTask creation-type completion", () => {
  it("rejects complete when required creation fields are missing after merge", async () => {
    const withTask = await addRequestTask("lead_7", {
      title: "Internal",
      creationTypeId: "internal_follow_up",
      creationFields: { summary: "Initial summary text" },
      attachments: [],
      createdByUserId: "admin_1",
    });
    const tid = withTask.tasks.find(
      (t) => t.creationTypeId === "internal_follow_up",
    )!.id;

    await updateRequestTask("lead_7", tid, {
      creationFields: { summary: "" },
    });

    await expect(
      updateRequestTask("lead_7", tid, { completed: true }, { actor: MOCK_CS }),
    ).rejects.toThrow();
  });

  it("allows complete when creation fields satisfy the type", async () => {
    const withTask = await addRequestTask("lead_7", {
      title: "Internal two",
      creationTypeId: "internal_follow_up",
      creationFields: { summary: "Ready to close" },
      attachments: [],
      createdByUserId: "admin_1",
    });
    const tid = withTask.tasks.find((t) => t.title === "Internal two")!.id;

    const out = await updateRequestTask(
      "lead_7",
      tid,
      { completed: true },
      { actor: MOCK_CS },
    );
    expect(out.tasks.find((t) => t.id === tid)?.completed).toBe(true);
  });
});

function sampleRequest(
  overrides: Partial<Request> & Pick<Request, "id" | "status">,
): Request {
  return {
    patientId: "patient_test",
    treatmentSlug: "joint-replacement",
    recordType: "request",
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

describe("addRequestAppointment", () => {
  it("adds a treatment appointment without creating a task", async () => {
    const before = await getRequestById("lead_11");
    expect(before).toBeDefined();
    const countBefore = before!.appointments.length;
    const taskCountBefore = before!.tasks.length;

    const iso = new Date(Date.now() + 5 * 86_400_000).toISOString();
    const after = await addRequestAppointment("lead_11", {
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

    const before = await getRequestById("lead_11");
    const taskCountBefore = before!.tasks.length;
    const apptCountBefore = before!.appointments.length;

    const after = await addRequestAppointment("lead_11", {
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

describe("uploadRequestDocument", () => {
  it("updates an existing row for the same type to uploaded", async () => {
    const before = await getRequestById("lead_1");
    expect(before?.documents.find((d) => d.type === "visa")?.status).toBe("pending");

    const after = await uploadRequestDocument("lead_1", {
      type: "visa",
      fileName: "visa-proof.pdf",
      uploadedByUserId: "cs_layla",
    });

    const lab = after.documents.find((d) => d.type === "visa");
    expect(lab?.status).toBe("uploaded");
    expect(lab?.name).toBe("visa-proof.pdf");
    expect(lab?.uploadedBy).toBe("cs_layla");
  });

  it("appends a document when the lead has no row for that type", async () => {
    const before = await getRequestById("lead_8");
    expect(before?.documents.some((d) => d.type === "other")).toBe(false);
    const countBefore = before!.documents.length;

    const after = await uploadRequestDocument("lead_8", {
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
      uploadRequestDocument("lead_1", { type: "medical_report", fileName: "   " }),
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

describe("sendDraftQuotationToPatient", () => {
  it("sets quotation to sent_to_patient, moves estimate_reviewed to quotation_sent, and completes prepare_quotation", async () => {
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

    const withDraft = await createDraftQuotation("lead_5", base);
    const q = withDraft.quotations[withDraft.quotations.length - 1];
    expect(q.status).toBe("draft");

    const after = await sendDraftQuotationToPatient("lead_5", q.id);
    const updatedQ = after.quotations.find((x) => x.id === q.id);
    expect(updatedQ?.status).toBe("sent_to_patient");
    expect(after.status).toBe("quotation_sent");

    const prep = after.tasks.find((t) => t.templateKey === "prepare_quotation");
    expect(prep?.completed).toBe(true);

    await expect(sendDraftQuotationToPatient("lead_5", q.id)).rejects.toThrow(/draft/i);
  });
});

describe("processRequestTasks (hybrid auto tasks)", () => {
  const at = "2024-06-01T12:00:00.000Z";

  afterEach(() => {
    resetCrmSettingsForTests();
  });

  it("ensures lead_qualification for new status", () => {
    const lead = sampleRequest({ id: "syn_new", status: "new" });
    const out = processRequestTasks(lead, lead, at);
    const t = out.tasks.find((x) => x.templateKey === "lead_qualification");
    expect(t).toBeDefined();
    expect(t?.completed).toBe(false);
    expect(t?.source).toBe("system");
  });

  it("auto-completes lead_qualification when status moves past new", () => {
    const newLead = sampleRequest({ id: "syn_q", status: "new" });
    const withQ = processRequestTasks(newLead, newLead, at);
    const assigned = { ...withQ, status: "interested" as const };
    const out = processRequestTasks(withQ, assigned, at);
    const t = out.tasks.find((x) => x.templateKey === "lead_qualification");
    expect(t?.completed).toBe(true);
    expect(t?.resolution).toBe("completed_rule");
    expect(t?.completedReason).toBe("status_transition");
  });

  it("auto-completes prepare_quotation when a quotation is sent to patient", () => {
    const doc: RequestDocument = {
      id: "d_syn",
      type: "medical_report",
      name: "m",
      mandatory: true,
      status: "uploaded",
      uploadedAt: at,
      uploadedBy: "p",
    };
    const done = (
      id: string,
      k: "lead_qualification" | "collect_documents" | "initial_consultation",
    ): RequestTask => ({
      id,
      title: REQUEST_TASK_TEMPLATE_TITLES[k],
      completed: true,
      kind: k,
      source: "system",
      templateKey: k,
      resolution: "completed_rule",
      completedReason: "user",
      createdAt: at,
      updatedAt: at,
    });
    const lead = sampleRequest({
      id: "syn_quote",
      status: "estimate_reviewed",
      ownerId: "cs_sara",
      documents: [doc],
      tasks: [
        done("sq1", "lead_qualification"),
        done("sq2", "collect_documents"),
        done("sq3", "initial_consultation"),
      ],
    });
    const withPrep = processRequestTasks(lead, lead, at);
    const prepOpen = withPrep.tasks.find((x) => x.templateKey === "prepare_quotation");
    expect(prepOpen?.completed).toBe(false);

    const quote: Quotation = {
      id: "quote_syn",
      requestId: "syn_quote",
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
      status: "quotation_sent" as const,
      quotations: [quote],
    };
    const out = processRequestTasks(withPrep, sent, at);
    const prep = out.tasks.find((x) => x.templateKey === "prepare_quotation");
    expect(prep?.completed).toBe(true);
    expect(prep?.completedReason).toBe("quotation_sent");
  });

  it("does not add prepare_quotation before quotation gates are satisfied", () => {
    const lead = sampleRequest({ id: "syn_gate", status: "estimate_reviewed" });
    const out = processRequestTasks(lead, lead, at);
    const prep = out.tasks.filter((t) => t.templateKey === "prepare_quotation");
    expect(prep).toHaveLength(0);
  });

  it("adds open prepare_quotation when gates and mandatory documents are satisfied", () => {
    const doc: RequestDocument = {
      id: "d_gate2",
      type: "medical_report",
      name: "m",
      mandatory: true,
      status: "uploaded",
      uploadedAt: at,
      uploadedBy: "p",
    };
    const done = (
      id: string,
      k: "lead_qualification" | "collect_documents" | "initial_consultation",
    ): RequestTask => ({
      id,
      title: REQUEST_TASK_TEMPLATE_TITLES[k],
      completed: true,
      kind: k,
      source: "system",
      templateKey: k,
      resolution: "completed_rule",
      completedReason: "user",
      createdAt: at,
      updatedAt: at,
    });
    const lead = sampleRequest({
      id: "syn_ok",
      status: "estimate_reviewed",
      ownerId: "cs_sara",
      documents: [doc],
      tasks: [
        done("ok1", "lead_qualification"),
        done("ok2", "collect_documents"),
        done("ok3", "initial_consultation"),
      ],
    });
    const out = processRequestTasks(lead, lead, at);
    const prep = out.tasks.find((t) => t.templateKey === "prepare_quotation" && !t.completed);
    expect(prep).toBeDefined();
  });

  it("spawns await_patient_estimate at status=interested once lead_qualification is done", () => {
    const done = (
      id: string,
      k: "lead_qualification" | "collect_documents" | "initial_consultation",
    ): RequestTask => ({
      id,
      title: REQUEST_TASK_TEMPLATE_TITLES[k],
      completed: true,
      kind: k,
      source: "system",
      templateKey: k,
      resolution: "completed_rule",
      completedReason: "status_transition",
      createdAt: at,
      updatedAt: at,
    });
    const lead = sampleRequest({
      id: "syn_await_estimate",
      status: "interested",
      ownerId: "cs_sara",
      tasks: [done("aq1", "lead_qualification")],
    });
    const out = processRequestTasks(lead, lead, at);
    const await_t = out.tasks.find(
      (t) => t.templateKey === "await_patient_estimate" && !t.completed,
    );
    expect(await_t).toBeDefined();
    expect(await_t?.assigneeId).toBe(REQUEST_PATIENT_ASSIGNEE_ID);
    expect(await_t?.source).toBe("system");
  });

  it("auto-completes await_patient_estimate when status moves past interested", () => {
    const done = (
      id: string,
      k: "lead_qualification",
    ): RequestTask => ({
      id,
      title: REQUEST_TASK_TEMPLATE_TITLES[k],
      completed: true,
      kind: k,
      source: "system",
      templateKey: k,
      resolution: "completed_rule",
      completedReason: "status_transition",
      createdAt: at,
      updatedAt: at,
    });
    const lead = sampleRequest({
      id: "syn_await_estimate2",
      status: "interested",
      ownerId: "cs_sara",
      tasks: [done("aq1", "lead_qualification")],
    });
    const seeded = processRequestTasks(lead, lead, at);
    expect(
      seeded.tasks.find((t) => t.templateKey === "await_patient_estimate" && !t.completed),
    ).toBeDefined();

    const moved = { ...seeded, status: "estimate_requested" as const };
    const after = processRequestTasks(seeded, moved, at);
    const closed = after.tasks.find(
      (t) => t.templateKey === "await_patient_estimate",
    );
    expect(closed?.completed).toBe(true);
    expect(closed?.completedReason).toBe("patient_action");
  });

  it("spawns await_patient_quote_response when a quotation is sent_to_patient and status=quotation_sent", () => {
    const lead = sampleRequest({
      id: "syn_await_quote",
      status: "quotation_sent",
      ownerId: "cs_sara",
      quotations: [
        {
          id: "qsr",
          requestId: "syn_await_quote",
          packageTier: "normal",
          items: [{ label: { ar: "x", en: "x" }, amountUSD: 100 }],
          totalUSD: 100,
          status: "sent_to_patient",
          downpaymentRequired: false,
          termsAndConditions: "t",
          createdAt: at,
          version: 1,
        },
      ],
    });
    const out = processRequestTasks(lead, lead, at);
    const t = out.tasks.find(
      (x) => x.templateKey === "await_patient_quote_response" && !x.completed,
    );
    expect(t).toBeDefined();
    expect(t?.assigneeId).toBe(REQUEST_PATIENT_ASSIGNEE_ID);
  });
});

describe("setRequestStatus (skip override)", () => {
  it("appends SET_STATUS history, cancels orphaned system tasks, spawns new status's tasks", async () => {
    const before = await getRequestById("lead_1");
    expect(before).toBeDefined();
    const fromStatus = before!.status;
    const orphanedKeys = before!.tasks
      .filter((t) => !t.completed && t.source === "system" && t.templateKey)
      .map((t) => t.templateKey!);

    const after = await setRequestStatus("lead_1", "booking", {
      actor: MOCK_CS,
      note: "Patient confirmed booking by phone",
    });

    expect(after.status).toBe("booking");
    const lastEntry = after.statusHistory[after.statusHistory.length - 1];
    expect(lastEntry.action).toBe("SET_STATUS");
    expect(lastEntry.from).toBe(fromStatus);
    expect(lastEntry.to).toBe("booking");
    expect(lastEntry.note).toBe("Patient confirmed booking by phone");

    for (const key of orphanedKeys) {
      const matching = after.tasks.filter((t) => t.templateKey === key);
      const stillOpen = matching.some(
        (t) => !t.completed && t.source === "system",
      );
      if (key === "send_contract") continue;
      expect(stillOpen).toBe(false);
    }

    const cancelled = after.tasks.filter(
      (t) =>
        t.completed &&
        t.completedReason === "status_skipped" &&
        t.resolution === "cancelled",
    );
    expect(cancelled.length).toBeGreaterThan(0);

    const newTask = after.tasks.find(
      (t) => !t.completed && t.templateKey === "assign_specialist",
    );
    expect(newTask).toBeDefined();
  });

  it("backward skip cancels create_order and re-spawns prepare_quotation", async () => {
    const before = await getRequestById("lead_7");
    expect(before).toBeDefined();
    expect(before!.status).toBe("quotation_accepted");
    const after = await setRequestStatus(before!.id, "estimate_reviewed", {
      actor: MOCK_CS,
      note: "Reverting back — patient changed mind",
    });
    expect(after.status).toBe("estimate_reviewed");
    const stillOpenCreateOrder = after.tasks.some(
      (t) => !t.completed && t.templateKey === "create_order",
    );
    expect(stillOpenCreateOrder).toBe(false);
    const cancelled = after.tasks.find(
      (t) =>
        t.templateKey === "create_order" &&
        t.completed &&
        t.completedReason === "status_skipped",
    );
    expect(cancelled).toBeDefined();
  });

  it("rejects skip with empty note", async () => {
    const lead = await getRequestById("lead_5");
    expect(lead).toBeDefined();
    const otherStatus: RequestStatus =
      lead!.status === "booking" ? "interested" : "booking";
    await expect(
      setRequestStatus(lead!.id, otherStatus, { actor: MOCK_CS, note: "  " }),
    ).rejects.toThrow(/non-empty note/i);
  });

  it("rejects skip from terminal state", async () => {
    const completed = await getRequestById("lead_11");
    expect(completed).toBeDefined();
    expect(completed!.status).toBe("completed");
    await expect(
      setRequestStatus(completed!.id, "booking", {
        actor: MOCK_CS,
        note: "Test override",
      }),
    ).rejects.toThrow(/terminal state/i);
  });

  it("rejects skip when actor role is patient", async () => {
    const lead = await getRequestById("lead_4");
    expect(lead).toBeDefined();
    const otherStatus: RequestStatus =
      lead!.status === "booking" ? "interested" : "booking";
    await expect(
      setRequestStatus(lead!.id, otherStatus, {
        actor: MOCK_PATIENT,
        note: "Trying as patient",
      }),
    ).rejects.toThrow(/cannot override/i);
  });
});
