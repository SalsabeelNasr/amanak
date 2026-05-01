/**
 * Mock leads repository. Module-level Map acts as in-memory store.
 * NOTE: state resets on server restart — acceptable for the mock layer.
 * Phase 2 will replace this file with a real API client behind the same
 * function signatures.
 */
import type {
  Lead,
  LeadAppointment,
  LeadDocument,
  LeadStatus,
  LeadTask,
  LeadTaskAttachment,
  LeadTaskCreationTypeId,
  MockUser,
  PackageTier,
  Quotation,
  QuotationItem,
} from "@/types";
import {
  getTransitionActionForSystemTaskCompletion,
  processLeadTasks,
  reconcileSystemTasksAfterStatusJump,
} from "@/lib/services/lead-task-rules";
import {
  applySetStatus,
  applyTransition,
} from "@/lib/services/state-machine.service";
import { resolveConsultationSlotById } from "@/lib/api/consultation-booking";
import { mergeCreationAttachmentsIntoLeadDocuments } from "@/lib/lead-task-creation-documents";
import {
  defaultLeadTaskCreationFailureMessage,
  parseLeadTaskCreationInput,
  validateLeadTaskCreationCompletion,
} from "@/lib/lead-task-creation-schema";
import { applyFollowUpDueSync } from "@/lib/lead-follow-up-due";
import { applyMockDelay } from "./mock-delay";
import { PIPELINE_MOCK_SEED } from "./leads-pipeline-seed";

/** Used for CRM API actions that apply the formal pipeline transitions. */
const CRM_AUTOMATION_ACTOR: MockUser = {
  id: "crm_pipeline",
  name: "CRM",
  role: "admin",
  email: "crm@amanak.internal",
};

export {
  ensureSystemTasks,
  listLeadTaskTemplateKeys,
  processLeadTasks,
  resolveLeadTasksAfterLeadChange,
} from "@/lib/services/lead-task-rules";

function nowMinusDays(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function nowPlusDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

/** Local wall-clock time today (for seed data that should appear on the CRM “Today” dashboard). */
function isoTodayAt(hours: number, minutes = 0): string {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

/** CRM person ids for task assignees and lead owners (seed `ownerId` / consultant ids). */
export const CRM_TASK_ASSIGNEE_IDS = [
  "cs_sara",
  "cs_layla",
  "consultant_dr_amir",
  "admin_1",
  "spec_dr_kareem",
] as const;

export type AddLeadTaskAttachmentInput = {
  slotId: string;
  fileName: string;
  sizeBytes: number;
  mockUrl?: string;
};

export type AddLeadTaskInput = {
  title: string;
  dueAt?: string;
  assigneeId?: string;
  createdByUserId?: string;
  /** When set, `title` and uploads are validated against creation-type config. */
  creationTypeId?: LeadTaskCreationTypeId;
  creationFields?: Record<string, string>;
  attachments?: AddLeadTaskAttachmentInput[];
};

export type UpdateLeadTaskPatch = Partial<
  Pick<LeadTask, "title" | "completed" | "dueAt" | "assigneeId" | "completionOutcome">
> & {
  /** Merged with existing task `creationFields`. */
  creationFields?: Record<string, string>;
  /** Appended as new {@link LeadTaskAttachment} rows (with generated ids). */
  attachments?: AddLeadTaskAttachmentInput[];
};

export type UpdateLeadTaskOptions = {
  simulateDelay?: boolean;
  /** Required when completing a system task that drives a pipeline transition. */
  actor?: MockUser;
  note?: string;
};

/**
 * Sort for CRM task list: incomplete first (overdue → soonest future → no due),
 * then completed. Tie-break: `updatedAt` descending.
 */
export function sortLeadTasksForDisplay(
  tasks: readonly LeadTask[],
  nowMs: number = Date.now(),
): LeadTask[] {
  const incomplete: LeadTask[] = [];
  const complete: LeadTask[] = [];
  for (const task of tasks) {
    if (task.completed) complete.push(task);
    else incomplete.push(task);
  }

  const activeRank = (task: LeadTask): { group: number; dueKey: number } => {
    if (!task.dueAt) return { group: 2, dueKey: 0 };
    const due = new Date(task.dueAt).getTime();
    if (due < nowMs) return { group: 0, dueKey: due };
    return { group: 1, dueKey: due };
  };

  incomplete.sort((a, b) => {
    const ra = activeRank(a);
    const rb = activeRank(b);
    if (ra.group !== rb.group) return ra.group - rb.group;
    if (ra.dueKey !== rb.dueKey) return ra.dueKey - rb.dueKey;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  complete.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return [...incomplete, ...complete];
}

const SEED: Lead[] = PIPELINE_MOCK_SEED;

const STORE = new Map<string, Lead>();

function persistProcessedLead(
  prev: Lead,
  next: Lead,
  at: string,
  opts?: { followUpActor?: MockUser },
): Lead {
  const processed = processLeadTasks(prev, { ...next, updatedAt: at }, at);
  const synced = applyFollowUpDueSync(prev, processed, at, opts?.followUpActor);
  STORE.set(synced.id, synced);
  return synced;
}

for (const l of SEED) {
  const at = l.updatedAt;
  persistProcessedLead(l, { ...l, updatedAt: at }, at);
}

export type LeadFilters = {
  status?: LeadStatus;
  country?: string;
  patientId?: string;
};

export async function listLeads(
  filters?: LeadFilters,
  options?: { simulateDelay?: boolean },
): Promise<Lead[]> {
  await applyMockDelay(options?.simulateDelay);
  let leads = Array.from(STORE.values());
  if (filters?.status) {
    leads = leads.filter((l) => l.status === filters.status);
  }
  if (filters?.country) {
    const c = filters.country.toLowerCase();
    leads = leads.filter((l) => l.patientCountry.toLowerCase().includes(c));
  }
  if (filters?.patientId) {
    leads = leads.filter((l) => l.patientId === filters.patientId);
  }
  return leads.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function getLeadById(
  id: string,
  options?: { simulateDelay?: boolean },
): Promise<Lead | undefined> {
  await applyMockDelay(options?.simulateDelay);
  return STORE.get(id);
}

function newLeadTaskId(): string {
  return `task_${globalThis.crypto.randomUUID()}`;
}

function newLeadAppointmentId(): string {
  return `appt_${globalThis.crypto.randomUUID()}`;
}

export type AddLeadAppointmentTreatmentInput = {
  kind: "treatment";
  startsAt: string;
  locationLabel: string;
  notes?: string;
  createdByUserId?: string;
};

export type AddLeadAppointmentOnlineInput = {
  kind: "online_meeting";
  startsAt: string;
  meetingUrl: string;
  title?: string;
  notes?: string;
  createdByUserId?: string;
};

export type AddLeadAppointmentConsultationInput = {
  kind: "team_consultation";
  slotId: string;
  taskTitle: string;
  notes?: string;
  assigneeId?: string;
  createdByUserId?: string;
};

export type AddLeadAppointmentInput =
  | AddLeadAppointmentTreatmentInput
  | AddLeadAppointmentOnlineInput
  | AddLeadAppointmentConsultationInput;

export async function addLeadAppointment(
  leadId: string,
  input: AddLeadAppointmentInput,
  options?: { simulateDelay?: boolean },
): Promise<Lead> {
  await applyMockDelay(options?.simulateDelay);
  const existing = STORE.get(leadId);
  if (!existing) {
    throw new Error(`Lead ${leadId} not found`);
  }
  const ts = new Date().toISOString();
  const appointments: LeadAppointment[] = [...existing.appointments];

  let taskToAdd: LeadTask | undefined;
  let appointment: LeadAppointment;

  if (input.kind === "treatment") {
    const locationLabel = input.locationLabel.trim();
    if (!locationLabel) {
      throw new Error("Treatment location is required");
    }
    if (!input.startsAt.trim()) {
      throw new Error("Start time is required");
    }
    const startMs = Date.parse(input.startsAt);
    if (Number.isNaN(startMs)) {
      throw new Error("Invalid start time");
    }
    appointment = {
      id: newLeadAppointmentId(),
      leadId,
      kind: "treatment",
      startsAt: new Date(startMs).toISOString(),
      locationLabel,
      notes: input.notes?.trim() || undefined,
      createdAt: ts,
      createdByUserId: input.createdByUserId,
    };
  } else if (input.kind === "online_meeting") {
    const meetingUrl = input.meetingUrl.trim();
    if (!meetingUrl) {
      throw new Error("Meeting link is required");
    }
    if (!input.startsAt.trim()) {
      throw new Error("Start time is required");
    }
    const startMs = Date.parse(input.startsAt);
    if (Number.isNaN(startMs)) {
      throw new Error("Invalid start time");
    }
    appointment = {
      id: newLeadAppointmentId(),
      leadId,
      kind: "online_meeting",
      startsAt: new Date(startMs).toISOString(),
      meetingUrl,
      title: input.title?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      createdAt: ts,
      createdByUserId: input.createdByUserId,
    };
  } else {
    const match = resolveConsultationSlotById(input.slotId);
    if (!match) {
      throw new Error("Invalid consultation slot");
    }
    const taskTitle = input.taskTitle.trim();
    if (!taskTitle) {
      throw new Error("Task title is required");
    }
    const taskId = newLeadTaskId();
    const assigneeId =
      input.assigneeId ??
      existing.ownerId ??
      existing.assignedConsultantId;
    taskToAdd = {
      id: taskId,
      title: taskTitle,
      completed: false,
      dueAt: match.startsAt,
      assigneeId,
      createdAt: ts,
      updatedAt: ts,
      createdByUserId: input.createdByUserId,
      kind: "manual",
      source: "user",
      resolution: "open",
    };
    appointment = {
      id: newLeadAppointmentId(),
      leadId,
      kind: "team_consultation",
      startsAt: match.startsAt,
      slotId: input.slotId,
      linkedTaskId: taskId,
      notes: input.notes?.trim() || undefined,
      createdAt: ts,
      createdByUserId: input.createdByUserId,
    };
  }

  appointments.push(appointment);
  const tasks = taskToAdd ? [...existing.tasks, taskToAdd] : existing.tasks;

  const updated: Lead = {
    ...existing,
    appointments,
    tasks,
    updatedAt: ts,
  };
  return persistProcessedLead(existing, updated, ts);
}

export const LEAD_DOCUMENT_TYPE_ORDER: LeadDocument["type"][] = [
  "medical_report",
  "xray",
  "lab_result",
  "previous_operations",
  "passport",
  "visa",
  "payment_proof_downpayment",
  "payment_proof_remaining",
  "other",
];

const DOCUMENT_TYPE_DEFAULTS: Record<
  LeadDocument["type"],
  { mandatory: boolean }
> = {
  medical_report: { mandatory: true },
  xray: { mandatory: true },
  lab_result: { mandatory: true },
  previous_operations: { mandatory: false },
  passport: { mandatory: true },
  visa: { mandatory: false },
  payment_proof_downpayment: { mandatory: false },
  payment_proof_remaining: { mandatory: false },
  other: { mandatory: false },
};

function newLeadDocumentId(): string {
  return `doc_${globalThis.crypto.randomUUID()}`;
}

export type UploadLeadDocumentInput = {
  type: LeadDocument["type"];
  fileName: string;
  uploadedByUserId?: string;
};

/**
 * Records a document upload for a lead: updates the first row matching `type`,
 * or appends a new document when none exists.
 */
export async function uploadLeadDocument(
  leadId: string,
  input: UploadLeadDocumentInput,
  options?: { simulateDelay?: boolean },
): Promise<Lead> {
  await applyMockDelay(options?.simulateDelay);
  const existing = STORE.get(leadId);
  if (!existing) {
    throw new Error(`Lead ${leadId} not found`);
  }
  const trimmedName = input.fileName.trim();
  if (!trimmedName) {
    throw new Error("File name is required");
  }
  const ts = new Date().toISOString();
  const uploadedBy = input.uploadedByUserId;

  const docs = [...existing.documents];
  const idx = docs.findIndex((d) => d.type === input.type);

  if (idx >= 0) {
    docs[idx] = {
      ...docs[idx],
      name: trimmedName,
      status: "uploaded",
      uploadedAt: ts,
      uploadedBy,
    };
  } else {
    const def = DOCUMENT_TYPE_DEFAULTS[input.type];
    docs.push({
      id: newLeadDocumentId(),
      type: input.type,
      name: trimmedName,
      mandatory: def.mandatory,
      status: "uploaded",
      uploadedAt: ts,
      uploadedBy,
    });
  }

  const updated: Lead = {
    ...existing,
    documents: docs,
    updatedAt: ts,
  };
  return persistProcessedLead(existing, updated, ts);
}

function newAttachmentId(): string {
  return `att_${globalThis.crypto.randomUUID()}`;
}

function mapAttachmentInputsToStored(
  inputs: AddLeadTaskAttachmentInput[],
  ts: string,
): LeadTaskAttachment[] {
  return inputs.map((a) => ({
    id: newAttachmentId(),
    slotId: a.slotId,
    fileName: a.fileName,
    sizeBytes: a.sizeBytes,
    uploadedAt: ts,
    mockUrl: a.mockUrl,
  }));
}

function leadAttachmentsToCompletionInputs(
  attachments: LeadTaskAttachment[] | undefined,
): {
  slotId: string;
  fileName: string;
  sizeBytes: number;
  mockUrl?: string;
}[] {
  if (!attachments?.length) return [];
  return attachments.map((a) => ({
    slotId: a.slotId,
    fileName: a.fileName,
    sizeBytes: a.sizeBytes,
    mockUrl: a.mockUrl,
  }));
}

function buildMergedTaskFromPatch(
  prev: LeadTask,
  patch: UpdateLeadTaskPatch,
  ts: string,
): LeadTask {
  const title = patch.title !== undefined ? patch.title.trim() : prev.title;
  const dueAt = patch.dueAt !== undefined ? patch.dueAt : prev.dueAt;
  const assigneeId =
    patch.assigneeId !== undefined
      ? patch.assigneeId.trim() || undefined
      : prev.assigneeId;

  let creationFields = prev.creationFields;
  if (patch.creationFields !== undefined) {
    creationFields = {
      ...(prev.creationFields ?? {}),
      ...patch.creationFields,
    };
    if (Object.keys(creationFields).length === 0) creationFields = undefined;
  }

  let attachments: LeadTaskAttachment[] | undefined;
  if (patch.attachments?.length) {
    const added = mapAttachmentInputsToStored(patch.attachments, ts);
    attachments = [...(prev.attachments ?? []), ...added];
  } else {
    attachments = prev.attachments;
  }
  if (attachments?.length === 0) attachments = undefined;

  const completionOutcome =
    patch.completionOutcome !== undefined
      ? patch.completionOutcome
      : prev.completionOutcome;

  return {
    ...prev,
    title,
    dueAt,
    assigneeId,
    creationFields,
    attachments,
    completionOutcome,
    updatedAt: ts,
  };
}

export async function addLeadTask(
  leadId: string,
  input: AddLeadTaskInput,
  options?: { simulateDelay?: boolean },
): Promise<Lead> {
  await applyMockDelay(options?.simulateDelay);
  const existing = STORE.get(leadId);
  if (!existing) {
    throw new Error(`Lead ${leadId} not found`);
  }
  const ts = new Date().toISOString();

  let title = input.title.trim();
  let creationTypeId: LeadTaskCreationTypeId | undefined;
  let creationFields: Record<string, string> | undefined;
  let attachmentInputs: AddLeadTaskAttachmentInput[] = input.attachments ?? [];

  if (input.creationTypeId) {
    const parsed = parseLeadTaskCreationInput({
      title: input.title,
      creationTypeId: input.creationTypeId,
      dueAt: input.dueAt,
      assigneeId: input.assigneeId,
      createdByUserId: input.createdByUserId,
      creationFields: input.creationFields,
      attachments: attachmentInputs,
    });
    if (!parsed.success) {
      throw new Error(defaultLeadTaskCreationFailureMessage(parsed.failure));
    }
    title = parsed.data.title;
    creationTypeId = parsed.data.creationTypeId;
    creationFields = parsed.data.creationFields;
    attachmentInputs = parsed.data.attachments;
  } else if (!title) {
    throw new Error("Task title is required");
  }

  const attachments: LeadTaskAttachment[] | undefined =
    attachmentInputs.length > 0
      ? attachmentInputs.map((a) => ({
          id: newAttachmentId(),
          slotId: a.slotId,
          fileName: a.fileName,
          sizeBytes: a.sizeBytes,
          uploadedAt: ts,
          mockUrl: a.mockUrl,
        }))
      : undefined;

  const task: LeadTask = {
    id: newLeadTaskId(),
    title,
    completed: false,
    dueAt: input.dueAt,
    assigneeId: input.assigneeId,
    createdAt: ts,
    updatedAt: ts,
    createdByUserId: input.createdByUserId,
    kind: "manual",
    source: "user",
    resolution: "open",
    ...(creationTypeId
      ? {
          creationTypeId,
          ...(creationFields && Object.keys(creationFields).length > 0
            ? { creationFields }
            : {}),
          ...(attachments ? { attachments } : {}),
        }
      : {}),
  };

  let documents = existing.documents;
  if (creationTypeId && attachments?.length) {
    documents = mergeCreationAttachmentsIntoLeadDocuments(
      existing.documents,
      creationTypeId,
      attachments,
      input.createdByUserId,
      ts,
    );
  }

  const updated: Lead = {
    ...existing,
    tasks: [...existing.tasks, task],
    documents,
    updatedAt: ts,
  };
  return persistProcessedLead(existing, updated, ts);
}

export async function updateLeadTask(
  leadId: string,
  taskId: string,
  patch: UpdateLeadTaskPatch,
  options?: UpdateLeadTaskOptions,
): Promise<Lead> {
  await applyMockDelay(options?.simulateDelay);
  const existing = STORE.get(leadId);
  if (!existing) {
    throw new Error(`Lead ${leadId} not found`);
  }
  const ts = new Date().toISOString();
  const idx = existing.tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) {
    throw new Error(`Task ${taskId} not found on lead ${leadId}`);
  }
  const prev = existing.tasks[idx];
  if (patch.title !== undefined && !patch.title.trim()) {
    throw new Error("Task title cannot be empty");
  }

  const completing = patch.completed === true && !prev.completed;
  const reopening = patch.completed === false && prev.completed;

  const patchBody: UpdateLeadTaskPatch = { ...patch };
  delete patchBody.completed;
  const merged = buildMergedTaskFromPatch(prev, patchBody, ts);

  let documents = existing.documents;

  if (patch.attachments?.length && prev.creationTypeId && !completing) {
    const newRows = mapAttachmentInputsToStored(patch.attachments, ts);
    documents = mergeCreationAttachmentsIntoLeadDocuments(
      documents,
      prev.creationTypeId,
      newRows,
      merged.createdByUserId ?? options?.actor?.id,
      ts,
    );
  }

  if (completing) {
    if (merged.creationTypeId) {
      const attInputs = leadAttachmentsToCompletionInputs(merged.attachments);
      const v = validateLeadTaskCreationCompletion(
        merged.creationTypeId,
        merged.title,
        merged.creationFields,
        attInputs,
      );
      if (!v.success) {
        throw new Error(defaultLeadTaskCreationFailureMessage(v.failure));
      }
    }

    if (merged.creationTypeId && merged.attachments?.length) {
      documents = mergeCreationAttachmentsIntoLeadDocuments(
        existing.documents,
        merged.creationTypeId,
        merged.attachments,
        merged.createdByUserId ?? options?.actor?.id,
        ts,
      );
    }

    const action = getTransitionActionForSystemTaskCompletion(existing, prev);
    if (action !== null) {
      if (!options?.actor) {
        throw new Error(
          "Actor is required to complete this pipeline task (it advances lead status).",
        );
      }
      const transitioned = applyTransition(
        existing,
        action,
        options.actor,
        options.note?.trim() || undefined,
      );
      const completedTask: LeadTask = {
        ...merged,
        completed: true,
        completedReason: "task_drove_transition",
        resolution: "completed_manual",
        updatedAt: ts,
        ...(options?.actor
          ? {
              completedByUserId: options.actor.id,
              completedByRole: options.actor.role,
            }
          : {}),
      };
      const tasks = transitioned.tasks.map((t) =>
        t.id === taskId ? completedTask : t,
      );
      const updated: Lead = {
        ...transitioned,
        documents,
        tasks,
        updatedAt: ts,
      };
      return persistProcessedLead(existing, updated, ts);
    }

    const completedTask: LeadTask = {
      ...merged,
      completed: true,
      completedReason: "user",
      resolution: "completed_manual",
      updatedAt: ts,
      ...(options?.actor
        ? {
            completedByUserId: options.actor.id,
            completedByRole: options.actor.role,
          }
        : {}),
    };
    const tasks = [...existing.tasks];
    tasks[idx] = completedTask;
    const updated: Lead = { ...existing, documents, tasks, updatedAt: ts };
    return persistProcessedLead(existing, updated, ts);
  }

  if (reopening) {
    const next: LeadTask = {
      ...merged,
      completed: false,
      completedReason: undefined,
      resolution: "open",
      completedByUserId: undefined,
      completedByRole: undefined,
      updatedAt: ts,
    };
    const tasks = [...existing.tasks];
    tasks[idx] = next;
    const updated: Lead = { ...existing, tasks, documents, updatedAt: ts };
    return persistProcessedLead(existing, updated, ts);
  }

  const next: LeadTask = {
    ...merged,
    updatedAt: ts,
  };
  const tasks = [...existing.tasks];
  tasks[idx] = next;
  const updated: Lead = { ...existing, tasks, documents, updatedAt: ts };
  return persistProcessedLead(existing, updated, ts);
}

export async function deleteLeadTask(
  leadId: string,
  taskId: string,
  options?: { simulateDelay?: boolean },
): Promise<Lead> {
  await applyMockDelay(options?.simulateDelay);
  const existing = STORE.get(leadId);
  if (!existing) {
    throw new Error(`Lead ${leadId} not found`);
  }
  const ts = new Date().toISOString();
  const tasks = existing.tasks.filter((t) => t.id !== taskId);
  if (tasks.length === existing.tasks.length) {
    throw new Error(`Task ${taskId} not found on lead ${leadId}`);
  }
  const updated: Lead = { ...existing, tasks, updatedAt: ts };
  return persistProcessedLead(existing, updated, ts);
}

export type CreateDraftQuotationInput = {
  packageTier: PackageTier;
  doctorId?: string;
  hospitalId?: string;
  hotelId?: string;
  hotelName?: string;
  accommodationNights?: number;
  accommodationGuests?: number;
  flightOptionId?: string;
  groundTransportSkuId?: string;
  transportMode: { ar: string; en: string };
  transportRouteCount: number;
  transportPackageTripPlan?: number;
  transportAirportRoundTrip?: boolean;
  items: QuotationItem[];
  totalUSD: number;
  downpaymentRequired: boolean;
  downpaymentUSD?: number;
  termsAndConditions: string;
};

/**
 * Appends a new {@link Quotation} with `status: "draft"` and sets it as {@link Lead.activeQuotationId}.
 */
export async function createDraftQuotation(
  leadId: string,
  input: CreateDraftQuotationInput,
  options?: { simulateDelay?: boolean },
): Promise<Lead> {
  await applyMockDelay(options?.simulateDelay);
  const existing = STORE.get(leadId);
  if (!existing) {
    throw new Error(`Lead ${leadId} not found`);
  }
  const at = new Date().toISOString();
  const nextVersion =
    existing.quotations.length === 0
      ? 1
      : Math.max(...existing.quotations.map((q) => q.version)) + 1;
  const quotation: Quotation = {
    id: `quote_${globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
    leadId: existing.id,
    packageTier: input.packageTier,
    doctorId: input.doctorId,
    hospitalId: input.hospitalId,
    hotelId: input.hotelId,
    hotelName: input.hotelName,
    accommodationNights: input.accommodationNights,
    accommodationGuests: input.accommodationGuests,
    flightOptionId: input.flightOptionId,
    groundTransportSkuId: input.groundTransportSkuId,
    transportMode: input.transportMode,
    transportRouteCount: input.transportRouteCount,
    transportPackageTripPlan: input.transportPackageTripPlan,
    transportAirportRoundTrip: input.transportAirportRoundTrip,
    items: input.items,
    totalUSD: input.totalUSD,
    status: "draft",
    downpaymentRequired: input.downpaymentRequired,
    downpaymentUSD: input.downpaymentUSD,
    termsAndConditions: input.termsAndConditions,
    createdAt: at,
    version: nextVersion,
  };
  const updated: Lead = {
    ...existing,
    quotations: [...existing.quotations, quotation],
    activeQuotationId: quotation.id,
    updatedAt: at,
  };
  return persistProcessedLead(existing, updated, at);
}

/**
 * Sets a draft quotation’s status to `sent_to_patient` after CRM approval.
 */
export async function sendDraftQuotationToPatient(
  leadId: string,
  quotationId: string,
  options?: { simulateDelay?: boolean },
): Promise<Lead> {
  await applyMockDelay(options?.simulateDelay);
  const existing = STORE.get(leadId);
  if (!existing) {
    throw new Error(`Lead ${leadId} not found`);
  }
  const idx = existing.quotations.findIndex((q) => q.id === quotationId);
  if (idx < 0) {
    throw new Error(`Quotation ${quotationId} not found on lead ${leadId}`);
  }
  const q = existing.quotations[idx];
  if (q.status !== "draft") {
    throw new Error("Only quotations in draft status can be sent for approval.");
  }
  const at = new Date().toISOString();
  const quotations = [...existing.quotations];
  quotations[idx] = { ...q, status: "sent_to_patient" };
  let next: Lead = {
    ...existing,
    quotations,
    updatedAt: at,
  };
  if (existing.status === "estimate_reviewed") {
    next = applyTransition(next, "DELIVER_QUOTATION", CRM_AUTOMATION_ACTOR);
  } else if (existing.status === "changes_requested") {
    next = applyTransition(next, "DELIVER_QUOTATION_REVISION", CRM_AUTOMATION_ACTOR);
  }
  return persistProcessedLead(existing, next, next.updatedAt);
}

/**
 * Shallow-merges `updates` into the lead. For nested collections (`documents`,
 * `quotations`, `tasks`, …), pass a **full** replacement array when needed; for
 * tasks, prefer {@link addLeadTask}, {@link updateLeadTask}, {@link deleteLeadTask}.
 */
export async function updateLead(
  id: string,
  updates: Partial<Lead>,
  options?: { simulateDelay?: boolean; actor?: MockUser },
): Promise<Lead> {
  await applyMockDelay(options?.simulateDelay);
  const existing = STORE.get(id);
  if (!existing) {
    throw new Error(`Lead ${id} not found`);
  }
  const at = new Date().toISOString();
  const updated: Lead = {
    ...existing,
    ...updates,
    updatedAt: at,
  };
  return persistProcessedLead(existing, updated, at, {
    followUpActor: options?.actor,
  });
}

export type SetLeadStatusOptions = {
  actor: MockUser;
  note: string;
  simulateDelay?: boolean;
};

/**
 * Direct status override. Appends a `SET_STATUS` history entry, cancels open
 * system tasks tied to the previous status (`status_skipped`), then ensures the
 * tasks for the new status exist. See `applySetStatus` for validation rules.
 */
export async function setLeadStatus(
  id: string,
  toStatus: LeadStatus,
  options: SetLeadStatusOptions,
): Promise<Lead> {
  await applyMockDelay(options.simulateDelay);
  const existing = STORE.get(id);
  if (!existing) {
    throw new Error(`Lead ${id} not found`);
  }
  const transitioned = applySetStatus(
    existing,
    toStatus,
    options.actor,
    options.note,
  );
  const at = transitioned.updatedAt;
  const reconciled = reconcileSystemTasksAfterStatusJump(
    existing,
    transitioned,
    at,
  );
  const synced = applyFollowUpDueSync(existing, reconciled, at, options.actor);
  STORE.set(synced.id, synced);
  return synced;
}
