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
} from "@/lib/services/lead-task-rules";
import { applyTransition } from "@/lib/services/state-machine.service";
import { resolveConsultationSlotById } from "@/lib/api/consultation-booking";
import { mergeCreationAttachmentsIntoLeadDocuments } from "@/lib/lead-task-creation-documents";
import {
  parseLeadTaskCreationInput,
  validateLeadTaskCreationCompletion,
} from "@/lib/lead-task-creation-schema";
import { buildCrmTodayDigest } from "@/lib/crm-today-digest";
import type { CrmTodayDigest } from "@/lib/crm-today-digest";
import { applyMockDelay } from "./mock-delay";

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
  Pick<LeadTask, "title" | "completed" | "dueAt" | "assigneeId">
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

const STANDARD_DOCS: LeadDocument[] = [
  {
    id: "doc_med",
    type: "medical_report",
    name: "التقرير الطبي",
    mandatory: true,
    status: "uploaded",
    uploadedAt: nowMinusDays(10),
    uploadedBy: "patient_1",
  },
  {
    id: "doc_xray",
    type: "xray",
    name: "أشعة / صور CT-MRI",
    mandatory: true,
    status: "uploaded",
    uploadedAt: nowMinusDays(10),
    uploadedBy: "patient_1",
  },
  {
    id: "doc_lab",
    type: "lab_result",
    name: "تحاليل المختبر",
    mandatory: true,
    status: "uploaded",
    uploadedAt: nowMinusDays(9),
    uploadedBy: "patient_1",
  },
  {
    id: "doc_prev",
    type: "previous_operations",
    name: "تقارير العمليات السابقة",
    mandatory: false,
    status: "uploaded",
    uploadedAt: nowMinusDays(9),
    uploadedBy: "patient_1",
  },
  {
    id: "doc_passport",
    type: "passport",
    name: "صورة جواز السفر",
    mandatory: true,
    status: "uploaded",
    uploadedAt: nowMinusDays(5),
    uploadedBy: "patient_1",
  },
  {
    id: "doc_visa",
    type: "visa",
    name: "وثائق التأشيرة",
    mandatory: false,
    status: "pending",
  },
];

const PATIENT_1_QUOTATION: Quotation = {
  id: "quote_1",
  leadId: "lead_1",
  packageTier: "gold",
  doctorId: "rashad_bishara",
  hospitalId: "hospital_cairo_1",
  hotelName: "Cairo Marriott (5★)",
  items: [
    { label: { ar: "الإجراء الطبي", en: "Medical Procedure" }, amountUSD: 4200 },
    { label: { ar: "إقامة المستشفى", en: "Hospital Stay" }, amountUSD: 900 },
    { label: { ar: "الفندق (5 ليالٍ)", en: "Hotel (5 nights)" }, amountUSD: 650 },
    { label: { ar: "النقل والمواصلات", en: "Transportation" }, amountUSD: 250 },
    { label: { ar: "متابعة ما بعد العلاج", en: "Post-treatment care" }, amountUSD: 300 },
  ],
  totalUSD: 6300,
  status: "sent_to_patient",
  downpaymentRequired: true,
  downpaymentUSD: 1500,
  termsAndConditions:
    "الأسعار تقديرية وقابلة للتعديل بناءً على التشخيص النهائي للطبيب المختص.",
  createdAt: nowMinusDays(2),
  version: 1,
};

function makeLead(partial: Partial<Lead> & Pick<Lead, "id" | "patientId" | "patientName" | "patientPhone" | "patientCountry" | "treatmentSlug" | "clientType" | "status">): Lead {
  return {
    statusHistory: [],
    documents: [],
    quotations: [],
    tasks: [],
    appointments: [],
    createdAt: nowMinusDays(14),
    updatedAt: nowMinusDays(1),
    ...partial,
  };
}

/** Mock CRM coverage: one seed row per LeadStatus for pipeline filter QA. */
const SEED: Lead[] = [
  makeLead({
    id: "lead_1",
    patientId: "patient_1",
    patientName: "أحمد محمد",
    patientPhone: "+9647701234567",
    patientEmail: "ahmed.m@example.com",
    patientCountry: "العراق",
    treatmentSlug: "joint-replacement",
    clientType: "b2c",
    status: "contract_sent",
    ownerId: "cs_sara",
    assignedConsultantId: "consultant_dr_amir",
    documents: STANDARD_DOCS,
    quotations: [PATIENT_1_QUOTATION],
    activeQuotationId: "quote_1",
    statusHistory: [
      { from: "new", to: "assigned", action: "ASSIGN_CS", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(13) },
      { from: "assigned", to: "docs_partial", action: "MARK_DOCS_PARTIAL", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(11) },
      { from: "docs_partial", to: "docs_complete", action: "MARK_DOCS_COMPLETE", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(8) },
      { from: "docs_complete", to: "consultant_review_ready", action: "SEND_TO_CONSULTANT", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(7) },
      { from: "consultant_review_ready", to: "approved", action: "APPROVE_MEDICAL", actorRole: "consultant_doctor", actorId: "consultant_dr_amir", timestamp: nowMinusDays(5) },
      { from: "approved", to: "quotation_generated", action: "GENERATE_QUOTATION", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(3) },
      { from: "quotation_generated", to: "contract_sent", action: "SEND_CONTRACT", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(2) },
    ],
    createdAt: nowMinusDays(14),
    updatedAt: nowMinusDays(2),
    tasks: [
      {
        id: "task_lead1_done",
        title: "Initial intake call",
        completed: true,
        dueAt: nowMinusDays(10),
        assigneeId: "cs_sara",
        createdAt: nowMinusDays(12),
        updatedAt: nowMinusDays(11),
        createdByUserId: "cs_sara",
        kind: "manual",
        source: "user",
        resolution: "completed_manual",
        completedReason: "user",
      },
      {
        id: "task_lead1_overdue",
        title: "Follow up on contract signature",
        completed: false,
        dueAt: nowMinusDays(1),
        assigneeId: "cs_sara",
        createdAt: nowMinusDays(3),
        updatedAt: nowMinusDays(2),
        createdByUserId: "admin_1",
        kind: "manual",
        source: "user",
        resolution: "open",
      },
      {
        id: "task_lead1_future",
        title: "Schedule pre-op call",
        completed: false,
        dueAt: nowPlusDays(5),
        assigneeId: "consultant_dr_amir",
        createdAt: nowMinusDays(2),
        updatedAt: nowMinusDays(2),
        createdByUserId: "cs_sara",
        kind: "manual",
        source: "user",
        resolution: "open",
      },
      {
        id: "task_lead1_nodue",
        title: "Internal pricing review",
        completed: false,
        createdAt: nowMinusDays(1),
        updatedAt: nowMinusDays(1),
        createdByUserId: "cs_sara",
        kind: "manual",
        source: "user",
        resolution: "open",
      },
      {
        id: "task_lead1_due_today",
        title: "Call patient before contract deadline",
        completed: false,
        dueAt: isoTodayAt(18, 0),
        assigneeId: "cs_sara",
        createdAt: nowMinusDays(1),
        updatedAt: nowMinusDays(1),
        createdByUserId: "cs_sara",
        kind: "manual",
        source: "user",
        resolution: "open",
      },
      {
        id: "task_lead1_payment_reminder",
        title: "Send payment reminder for contract deposit",
        completed: false,
        dueAt: isoTodayAt(12, 0),
        assigneeId: "cs_sara",
        createdAt: nowMinusDays(1),
        updatedAt: nowMinusDays(1),
        createdByUserId: "cs_sara",
        kind: "manual",
        source: "user",
        resolution: "open",
      },
      {
        id: "task_lead1_admin_exception",
        title: "Approve expedited contract exception (VIP)",
        completed: false,
        dueAt: isoTodayAt(17, 0),
        assigneeId: "admin_1",
        createdAt: nowMinusDays(1),
        updatedAt: nowMinusDays(1),
        createdByUserId: "cs_sara",
        kind: "manual",
        source: "user",
        resolution: "open",
      },
    ],
    appointments: [
      {
        id: "appt_lead1_treatment",
        leadId: "lead_1",
        kind: "treatment",
        startsAt: nowPlusDays(12),
        locationLabel: "Cairo — scheduled ward visit",
        createdAt: nowMinusDays(2),
      },
      {
        id: "appt_lead1_online",
        leadId: "lead_1",
        kind: "online_meeting",
        startsAt: nowPlusDays(4),
        meetingUrl: "https://meet.example.com/lead-1-checkin",
        title: "Pre-op video check-in",
        createdAt: nowMinusDays(2),
      },
      {
        id: "appt_lead1_today_review",
        leadId: "lead_1",
        kind: "online_meeting",
        startsAt: isoTodayAt(11, 0),
        meetingUrl: "https://meet.example.com/lead-1-contract",
        title: "Contract walkthrough",
        createdAt: nowMinusDays(1),
      },
      {
        id: "appt_lead1_morning_standup",
        leadId: "lead_1",
        kind: "online_meeting",
        startsAt: isoTodayAt(8, 30),
        meetingUrl: "https://meet.example.com/lead-1-standup",
        title: "Coordination stand-up",
        createdAt: nowMinusDays(1),
      },
      {
        id: "appt_lead1_today_treatment",
        leadId: "lead_1",
        kind: "treatment",
        startsAt: isoTodayAt(16, 0),
        locationLabel: "Cairo — pre-admission vitals",
        createdAt: nowMinusDays(1),
      },
    ],
  }),
  makeLead({
    id: "lead_2",
    patientId: "patient_2",
    patientName: "Fatima Al-Saud",
    patientPhone: "+966550000001",
    patientCountry: "السعودية",
    treatmentSlug: "ivf",
    clientType: "b2b",
    status: "new",
    documents: [],
    statusHistory: [],
    tasks: [
      {
        id: "task_lead2_triage",
        title: "B2B IVF inquiry — assign owner and reply",
        completed: false,
        dueAt: isoTodayAt(8, 0),
        createdAt: nowMinusDays(1),
        updatedAt: nowMinusDays(1),
        kind: "manual",
        source: "user",
        resolution: "open",
      },
    ],
    createdAt: nowMinusDays(1),
    updatedAt: nowMinusDays(1),
  }),
  makeLead({
    id: "lead_3",
    patientId: "patient_3",
    patientName: "محمد التواتي",
    patientPhone: "+218910000002",
    patientCountry: "ليبيا",
    treatmentSlug: "oncology",
    clientType: "g2b",
    status: "docs_partial",
    ownerId: "cs_layla",
    documents: [
      { id: "d1", type: "medical_report", name: "التقرير الطبي", mandatory: true, status: "uploaded", uploadedAt: nowMinusDays(2), uploadedBy: "patient_3" },
      { id: "d2", type: "xray", name: "أشعة CT", mandatory: true, status: "uploaded", uploadedAt: nowMinusDays(2), uploadedBy: "patient_3" },
      { id: "d3", type: "lab_result", name: "التحاليل", mandatory: true, status: "pending" },
      { id: "d4", type: "passport", name: "جواز السفر", mandatory: true, status: "pending" },
    ],
    statusHistory: [
      { from: "new", to: "assigned", action: "ASSIGN_CS", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(4) },
      { from: "assigned", to: "docs_partial", action: "MARK_DOCS_PARTIAL", actorRole: "cs", actorId: "cs_layla", timestamp: nowMinusDays(3) },
    ],
    tasks: [
      {
        id: "task_lead3_today_docs",
        title: "Chase missing lab & passport uploads",
        completed: false,
        dueAt: isoTodayAt(9, 0),
        assigneeId: "cs_layla",
        createdAt: nowMinusDays(2),
        updatedAt: nowMinusDays(1),
        createdByUserId: "cs_layla",
        kind: "manual",
        source: "user",
        resolution: "open",
      },
      {
        id: "task_lead3_callback",
        title: "Callback patient after lab upload",
        completed: false,
        dueAt: isoTodayAt(14, 0),
        assigneeId: "cs_layla",
        createdAt: nowMinusDays(1),
        updatedAt: nowMinusDays(1),
        createdByUserId: "cs_layla",
        kind: "manual",
        source: "user",
        resolution: "open",
      },
    ],
    appointments: [
      {
        id: "appt_lead3_today_consult",
        leadId: "lead_3",
        kind: "online_meeting",
        startsAt: isoTodayAt(13, 0),
        meetingUrl: "https://meet.example.com/lead-3-docs",
        title: "Oncology documents consultation",
        createdAt: nowMinusDays(1),
      },
    ],
  }),
  makeLead({
    id: "lead_4",
    patientId: "patient_4",
    patientName: "سعاد العامري",
    patientPhone: "+9647809991122",
    patientCountry: "العراق",
    treatmentSlug: "diabetic-foot",
    clientType: "b2c",
    status: "consultant_review_ready",
    ownerId: "cs_sara",
    documents: STANDARD_DOCS.map((d) => ({ ...d, id: `${d.id}_4` })),
    statusHistory: [
      { from: "new", to: "assigned", action: "ASSIGN_CS", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(8) },
      { from: "assigned", to: "docs_partial", action: "MARK_DOCS_PARTIAL", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(6) },
      { from: "docs_partial", to: "docs_complete", action: "MARK_DOCS_COMPLETE", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(3) },
      { from: "docs_complete", to: "consultant_review_ready", action: "SEND_TO_CONSULTANT", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(2) },
    ],
    tasks: [
      {
        id: "task_lead4_cs_summary",
        title: "Send case summary to consultant before sync",
        completed: false,
        dueAt: isoTodayAt(9, 0),
        assigneeId: "cs_sara",
        createdAt: nowMinusDays(2),
        updatedAt: nowMinusDays(1),
        createdByUserId: "cs_sara",
        kind: "manual",
        source: "user",
        resolution: "open",
      },
      {
        id: "task_lead4_consultant_review",
        title: "Clinical review — diabetic-foot dossier",
        completed: false,
        dueAt: isoTodayAt(10, 30),
        assigneeId: "consultant_dr_amir",
        createdAt: nowMinusDays(2),
        updatedAt: nowMinusDays(1),
        createdByUserId: "cs_sara",
        kind: "manual",
        source: "user",
        resolution: "open",
      },
    ],
    appointments: [
      {
        id: "appt_lead4_today_sync",
        leadId: "lead_4",
        kind: "online_meeting",
        startsAt: isoTodayAt(14, 0),
        meetingUrl: "https://meet.example.com/lead-4-sync",
        title: "Internal sync on readiness",
        createdAt: nowMinusDays(1),
      },
    ],
  }),
  makeLead({
    id: "lead_5",
    patientId: "patient_5",
    patientName: "خالد الحربي",
    patientPhone: "+966500000005",
    patientCountry: "السعودية",
    treatmentSlug: "addiction",
    clientType: "b2c",
    status: "rejected",
    ownerId: "cs_layla",
    documents: STANDARD_DOCS.slice(0, 4).map((d) => ({ ...d, id: `${d.id}_5` })),
    statusHistory: [
      { from: "new", to: "assigned", action: "ASSIGN_CS", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(20) },
      { from: "assigned", to: "docs_complete", action: "MARK_DOCS_COMPLETE", actorRole: "cs", actorId: "cs_layla", timestamp: nowMinusDays(15) },
      { from: "docs_complete", to: "consultant_review_ready", action: "SEND_TO_CONSULTANT", actorRole: "cs", actorId: "cs_layla", timestamp: nowMinusDays(14) },
      {
        from: "consultant_review_ready",
        to: "rejected",
        action: "REJECT_MEDICAL",
        actorRole: "consultant_doctor",
        actorId: "consultant_dr_amir",
        note: "الحالة تتطلب رعاية متخصصة في بلد المريض",
        timestamp: nowMinusDays(12),
      },
    ],
  }),
  makeLead({
    id: "lead_6",
    patientId: "patient_6",
    patientName: "Amina Bensalem",
    patientPhone: "+218920003344",
    patientCountry: "ليبيا",
    treatmentSlug: "knee-replacement",
    clientType: "b2c",
    status: "in_treatment",
    ownerId: "cs_sara",
    assignedConsultantId: "consultant_dr_amir",
    documents: STANDARD_DOCS.map((d) => ({ ...d, id: `${d.id}_6`, status: "verified" })),
    quotations: [
      { ...PATIENT_1_QUOTATION, id: "quote_6", leadId: "lead_6", status: "accepted", packageTier: "silver", totalUSD: 5100 },
    ],
    activeQuotationId: "quote_6",
    statusHistory: [
      { from: "new", to: "assigned", action: "ASSIGN_CS", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(40) },
      { from: "assigned", to: "docs_complete", action: "MARK_DOCS_COMPLETE", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(35) },
      { from: "docs_complete", to: "consultant_review_ready", action: "SEND_TO_CONSULTANT", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(34) },
      { from: "consultant_review_ready", to: "approved", action: "APPROVE_MEDICAL", actorRole: "consultant_doctor", actorId: "consultant_dr_amir", timestamp: nowMinusDays(32) },
      { from: "approved", to: "quotation_generated", action: "GENERATE_QUOTATION", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(30) },
      { from: "quotation_generated", to: "contract_sent", action: "SEND_CONTRACT", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(28) },
      { from: "contract_sent", to: "customer_accepted", action: "ACCEPT_CONTRACT", actorRole: "patient", actorId: "patient_6", timestamp: nowMinusDays(25) },
      { from: "customer_accepted", to: "awaiting_payment", action: "REQUEST_PAYMENT", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(24) },
      { from: "awaiting_payment", to: "payment_verified", action: "VERIFY_PAYMENT", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(20) },
      { from: "payment_verified", to: "order_created", action: "CREATE_ORDER", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(18) },
      { from: "order_created", to: "specialized_doctor_assigned", action: "ASSIGN_DOCTOR", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(15) },
      { from: "specialized_doctor_assigned", to: "in_treatment", action: "START_TREATMENT", actorRole: "specialized_doctor", actorId: "spec_dr_kareem", timestamp: nowMinusDays(7) },
    ],
    tasks: [
      {
        id: "task_lead6_spec_round",
        title: "Post-op ward round — knee patient",
        completed: false,
        dueAt: isoTodayAt(7, 30),
        assigneeId: "spec_dr_kareem",
        createdAt: nowMinusDays(2),
        updatedAt: nowMinusDays(1),
        createdByUserId: "admin_1",
        kind: "manual",
        source: "user",
        resolution: "open",
      },
    ],
    appointments: [
      {
        id: "appt_lead6_today_followup",
        leadId: "lead_6",
        kind: "online_meeting",
        startsAt: isoTodayAt(15, 45),
        meetingUrl: "https://meet.example.com/lead-6-family",
        title: "Family update call",
        createdAt: nowMinusDays(1),
      },
    ],
    createdAt: nowMinusDays(40),
    updatedAt: nowMinusDays(7),
  }),
  makeLead({
    id: "lead_7",
    patientId: "patient_7",
    patientName: "Omar Hassan",
    patientPhone: "+962790000007",
    patientCountry: "الأردن",
    treatmentSlug: "spine-surgery",
    clientType: "b2c",
    status: "assigned",
    ownerId: "cs_sara",
    documents: [],
    statusHistory: [
      { from: "new", to: "assigned", action: "ASSIGN_CS", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(5) },
    ],
    createdAt: nowMinusDays(5),
    updatedAt: nowMinusDays(5),
  }),
  makeLead({
    id: "lead_8",
    patientId: "patient_8",
    patientName: "ليلى محمود",
    patientPhone: "+20100000008",
    patientCountry: "مصر",
    treatmentSlug: "limb-lengthening",
    clientType: "b2c",
    status: "docs_missing",
    ownerId: "cs_layla",
    documents: [],
    statusHistory: [
      { from: "new", to: "assigned", action: "ASSIGN_CS", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(6) },
      { from: "assigned", to: "docs_missing", action: "REQUEST_DOCS", actorRole: "cs", actorId: "cs_layla", timestamp: nowMinusDays(5) },
    ],
    tasks: [
      {
        id: "task_lead8_docs_sms",
        title: "Send limb-lengthening document checklist (SMS)",
        completed: false,
        dueAt: isoTodayAt(11, 30),
        assigneeId: "cs_layla",
        createdAt: nowMinusDays(2),
        updatedAt: nowMinusDays(1),
        createdByUserId: "cs_layla",
        kind: "manual",
        source: "user",
        resolution: "open",
      },
      {
        id: "task_lead8_escalate_imaging",
        title: "Escalate missing imaging to partner clinic",
        completed: false,
        dueAt: nowMinusDays(2),
        assigneeId: "cs_layla",
        createdAt: nowMinusDays(4),
        updatedAt: nowMinusDays(2),
        createdByUserId: "cs_layla",
        kind: "manual",
        source: "user",
        resolution: "open",
      },
    ],
    appointments: [
      {
        id: "appt_lead8_radiology",
        leadId: "lead_8",
        kind: "treatment",
        startsAt: isoTodayAt(17, 0),
        locationLabel: "Cairo — radiology re-read slot",
        createdAt: nowMinusDays(1),
      },
    ],
    createdAt: nowMinusDays(6),
    updatedAt: nowMinusDays(5),
  }),
  makeLead({
    id: "lead_9",
    patientId: "patient_9",
    patientName: "Nadia Rahman",
    patientPhone: "+971500000009",
    patientCountry: "الإمارات",
    treatmentSlug: "breast-augmentation",
    clientType: "b2c",
    status: "docs_complete",
    ownerId: "cs_sara",
    documents: STANDARD_DOCS.map((d) => ({ ...d, id: `${d.id}_9` })),
    statusHistory: [
      { from: "new", to: "assigned", action: "ASSIGN_CS", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(10) },
      { from: "assigned", to: "docs_partial", action: "MARK_DOCS_PARTIAL", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(8) },
      { from: "docs_partial", to: "docs_complete", action: "MARK_DOCS_COMPLETE", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(4) },
    ],
    tasks: [
      {
        id: "task_lead9_intake",
        title: "Complete breast-augmentation intake questionnaire",
        completed: false,
        dueAt: isoTodayAt(13, 15),
        assigneeId: "cs_sara",
        createdAt: nowMinusDays(2),
        updatedAt: nowMinusDays(1),
        createdByUserId: "cs_sara",
        kind: "manual",
        source: "user",
        resolution: "open",
      },
    ],
    appointments: [
      {
        id: "appt_lead9_screening",
        leadId: "lead_9",
        kind: "online_meeting",
        startsAt: isoTodayAt(10, 0),
        meetingUrl: "https://meet.example.com/lead-9-screening",
        title: "Initial screening call",
        createdAt: nowMinusDays(1),
      },
    ],
    createdAt: nowMinusDays(10),
    updatedAt: nowMinusDays(4),
  }),
  makeLead({
    id: "lead_10",
    patientId: "patient_10",
    patientName: "Youssef Benali",
    patientPhone: "+21690000010",
    patientCountry: "تونس",
    treatmentSlug: "gynecomastia",
    clientType: "b2c",
    status: "approved",
    ownerId: "cs_sara",
    assignedConsultantId: "consultant_dr_amir",
    documents: STANDARD_DOCS.map((d) => ({ ...d, id: `${d.id}_10` })),
    statusHistory: [
      { from: "new", to: "assigned", action: "ASSIGN_CS", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(12) },
      { from: "assigned", to: "docs_partial", action: "MARK_DOCS_PARTIAL", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(10) },
      { from: "docs_partial", to: "docs_complete", action: "MARK_DOCS_COMPLETE", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(7) },
      { from: "docs_complete", to: "consultant_review_ready", action: "SEND_TO_CONSULTANT", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(5) },
      { from: "consultant_review_ready", to: "approved", action: "APPROVE_MEDICAL", actorRole: "consultant_doctor", actorId: "consultant_dr_amir", timestamp: nowMinusDays(2) },
    ],
    tasks: [
      {
        id: "task_lead10_quote_prep",
        title: "Confirm package options before quotation draft",
        completed: false,
        dueAt: isoTodayAt(12, 45),
        assigneeId: "consultant_dr_amir",
        createdAt: nowMinusDays(2),
        updatedAt: nowMinusDays(1),
        createdByUserId: "cs_sara",
        kind: "manual",
        source: "user",
        resolution: "open",
      },
    ],
    createdAt: nowMinusDays(12),
    updatedAt: nowMinusDays(2),
  }),
  makeLead({
    id: "lead_11",
    patientId: "patient_11",
    patientName: "Sara Al-Mutairi",
    patientPhone: "+96560000011",
    patientCountry: "الكويت",
    treatmentSlug: "vaser-liposuction",
    clientType: "b2c",
    status: "quotation_generated",
    ownerId: "cs_layla",
    assignedConsultantId: "consultant_dr_amir",
    documents: STANDARD_DOCS.map((d) => ({ ...d, id: `${d.id}_11` })),
    quotations: [
      {
        ...PATIENT_1_QUOTATION,
        id: "quote_11",
        leadId: "lead_11",
        status: "pending_admin",
        packageTier: "normal",
        totalUSD: 4800,
        createdAt: nowMinusDays(1),
      },
    ],
    activeQuotationId: "quote_11",
    statusHistory: [
      { from: "new", to: "assigned", action: "ASSIGN_CS", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(14) },
      { from: "assigned", to: "docs_partial", action: "MARK_DOCS_PARTIAL", actorRole: "cs", actorId: "cs_layla", timestamp: nowMinusDays(12) },
      { from: "docs_partial", to: "docs_complete", action: "MARK_DOCS_COMPLETE", actorRole: "cs", actorId: "cs_layla", timestamp: nowMinusDays(9) },
      { from: "docs_complete", to: "consultant_review_ready", action: "SEND_TO_CONSULTANT", actorRole: "cs", actorId: "cs_layla", timestamp: nowMinusDays(7) },
      { from: "consultant_review_ready", to: "approved", action: "APPROVE_MEDICAL", actorRole: "consultant_doctor", actorId: "consultant_dr_amir", timestamp: nowMinusDays(5) },
      { from: "approved", to: "quotation_generated", action: "GENERATE_QUOTATION", actorRole: "cs", actorId: "cs_layla", timestamp: nowMinusDays(1) },
    ],
    tasks: [
      {
        id: "task_lead11_admin_pricing",
        title: "Verify VIP line items on pending quotation",
        completed: false,
        dueAt: isoTodayAt(16, 15),
        assigneeId: "admin_1",
        createdAt: nowMinusDays(1),
        updatedAt: nowMinusDays(1),
        createdByUserId: "cs_layla",
        kind: "manual",
        source: "user",
        resolution: "open",
      },
    ],
    createdAt: nowMinusDays(14),
    updatedAt: nowMinusDays(1),
  }),
  makeLead({
    id: "lead_12",
    patientId: "patient_12",
    patientName: "Karim El-Fassi",
    patientPhone: "+21260000012",
    patientCountry: "المغرب",
    treatmentSlug: "bbl",
    clientType: "b2c",
    status: "customer_accepted",
    ownerId: "cs_sara",
    assignedConsultantId: "consultant_dr_amir",
    documents: STANDARD_DOCS.map((d) => ({ ...d, id: `${d.id}_12` })),
    quotations: [
      { ...PATIENT_1_QUOTATION, id: "quote_12", leadId: "lead_12", status: "accepted", packageTier: "gold", totalUSD: 5900 },
    ],
    activeQuotationId: "quote_12",
    statusHistory: [
      { from: "new", to: "assigned", action: "ASSIGN_CS", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(22) },
      { from: "assigned", to: "docs_partial", action: "MARK_DOCS_PARTIAL", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(19) },
      { from: "docs_partial", to: "docs_complete", action: "MARK_DOCS_COMPLETE", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(16) },
      { from: "docs_complete", to: "consultant_review_ready", action: "SEND_TO_CONSULTANT", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(14) },
      { from: "consultant_review_ready", to: "approved", action: "APPROVE_MEDICAL", actorRole: "consultant_doctor", actorId: "consultant_dr_amir", timestamp: nowMinusDays(12) },
      { from: "approved", to: "quotation_generated", action: "GENERATE_QUOTATION", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(10) },
      { from: "quotation_generated", to: "contract_sent", action: "SEND_CONTRACT", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(8) },
      { from: "contract_sent", to: "customer_accepted", action: "ACCEPT_CONTRACT", actorRole: "patient", actorId: "patient_12", timestamp: nowMinusDays(3) },
    ],
    createdAt: nowMinusDays(22),
    updatedAt: nowMinusDays(3),
  }),
  makeLead({
    id: "lead_13",
    patientId: "patient_13",
    patientName: "Huda Al-Kuwari",
    patientPhone: "+97450000013",
    patientCountry: "قطر",
    treatmentSlug: "cosmetic",
    clientType: "b2b",
    status: "awaiting_payment",
    ownerId: "cs_layla",
    assignedConsultantId: "consultant_dr_amir",
    documents: STANDARD_DOCS.map((d) => ({ ...d, id: `${d.id}_13` })),
    quotations: [
      { ...PATIENT_1_QUOTATION, id: "quote_13", leadId: "lead_13", status: "accepted", packageTier: "silver", totalUSD: 5200 },
    ],
    activeQuotationId: "quote_13",
    statusHistory: [
      { from: "new", to: "assigned", action: "ASSIGN_CS", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(25) },
      { from: "assigned", to: "docs_partial", action: "MARK_DOCS_PARTIAL", actorRole: "cs", actorId: "cs_layla", timestamp: nowMinusDays(22) },
      { from: "docs_partial", to: "docs_complete", action: "MARK_DOCS_COMPLETE", actorRole: "cs", actorId: "cs_layla", timestamp: nowMinusDays(19) },
      { from: "docs_complete", to: "consultant_review_ready", action: "SEND_TO_CONSULTANT", actorRole: "cs", actorId: "cs_layla", timestamp: nowMinusDays(17) },
      { from: "consultant_review_ready", to: "approved", action: "APPROVE_MEDICAL", actorRole: "consultant_doctor", actorId: "consultant_dr_amir", timestamp: nowMinusDays(15) },
      { from: "approved", to: "quotation_generated", action: "GENERATE_QUOTATION", actorRole: "cs", actorId: "cs_layla", timestamp: nowMinusDays(13) },
      { from: "quotation_generated", to: "contract_sent", action: "SEND_CONTRACT", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(11) },
      { from: "contract_sent", to: "customer_accepted", action: "ACCEPT_CONTRACT", actorRole: "patient", actorId: "patient_13", timestamp: nowMinusDays(9) },
      { from: "customer_accepted", to: "awaiting_payment", action: "REQUEST_PAYMENT", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(4) },
    ],
    createdAt: nowMinusDays(25),
    updatedAt: nowMinusDays(4),
  }),
  makeLead({
    id: "lead_14",
    patientId: "patient_14",
    patientName: "Rania Nassar",
    patientPhone: "+96170000014",
    patientCountry: "لبنان",
    treatmentSlug: "joint-replacement",
    clientType: "b2c",
    status: "payment_verified",
    ownerId: "cs_sara",
    assignedConsultantId: "consultant_dr_amir",
    documents: STANDARD_DOCS.map((d) => ({ ...d, id: `${d.id}_14` })),
    quotations: [
      { ...PATIENT_1_QUOTATION, id: "quote_14", leadId: "lead_14", status: "accepted", packageTier: "vip", totalUSD: 8900 },
    ],
    activeQuotationId: "quote_14",
    statusHistory: [
      { from: "new", to: "assigned", action: "ASSIGN_CS", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(30) },
      { from: "assigned", to: "docs_partial", action: "MARK_DOCS_PARTIAL", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(27) },
      { from: "docs_partial", to: "docs_complete", action: "MARK_DOCS_COMPLETE", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(24) },
      { from: "docs_complete", to: "consultant_review_ready", action: "SEND_TO_CONSULTANT", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(22) },
      { from: "consultant_review_ready", to: "approved", action: "APPROVE_MEDICAL", actorRole: "consultant_doctor", actorId: "consultant_dr_amir", timestamp: nowMinusDays(20) },
      { from: "approved", to: "quotation_generated", action: "GENERATE_QUOTATION", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(18) },
      { from: "quotation_generated", to: "contract_sent", action: "SEND_CONTRACT", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(16) },
      { from: "contract_sent", to: "customer_accepted", action: "ACCEPT_CONTRACT", actorRole: "patient", actorId: "patient_14", timestamp: nowMinusDays(14) },
      { from: "customer_accepted", to: "awaiting_payment", action: "REQUEST_PAYMENT", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(12) },
      { from: "awaiting_payment", to: "payment_verified", action: "VERIFY_PAYMENT", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(6) },
    ],
    createdAt: nowMinusDays(30),
    updatedAt: nowMinusDays(6),
  }),
  makeLead({
    id: "lead_15",
    patientId: "patient_15",
    patientName: "Faisal Al-Otaibi",
    patientPhone: "+96655000015",
    patientCountry: "السعودية",
    treatmentSlug: "knee-replacement",
    clientType: "b2c",
    status: "order_created",
    ownerId: "cs_layla",
    assignedConsultantId: "consultant_dr_amir",
    documents: STANDARD_DOCS.map((d) => ({ ...d, id: `${d.id}_15`, status: "verified" as const })),
    quotations: [
      { ...PATIENT_1_QUOTATION, id: "quote_15", leadId: "lead_15", status: "accepted", packageTier: "gold", totalUSD: 6400 },
    ],
    activeQuotationId: "quote_15",
    statusHistory: [
      { from: "new", to: "assigned", action: "ASSIGN_CS", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(35) },
      { from: "assigned", to: "docs_partial", action: "MARK_DOCS_PARTIAL", actorRole: "cs", actorId: "cs_layla", timestamp: nowMinusDays(32) },
      { from: "docs_partial", to: "docs_complete", action: "MARK_DOCS_COMPLETE", actorRole: "cs", actorId: "cs_layla", timestamp: nowMinusDays(29) },
      { from: "docs_complete", to: "consultant_review_ready", action: "SEND_TO_CONSULTANT", actorRole: "cs", actorId: "cs_layla", timestamp: nowMinusDays(27) },
      { from: "consultant_review_ready", to: "approved", action: "APPROVE_MEDICAL", actorRole: "consultant_doctor", actorId: "consultant_dr_amir", timestamp: nowMinusDays(25) },
      { from: "approved", to: "quotation_generated", action: "GENERATE_QUOTATION", actorRole: "cs", actorId: "cs_layla", timestamp: nowMinusDays(23) },
      { from: "quotation_generated", to: "contract_sent", action: "SEND_CONTRACT", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(21) },
      { from: "contract_sent", to: "customer_accepted", action: "ACCEPT_CONTRACT", actorRole: "patient", actorId: "patient_15", timestamp: nowMinusDays(19) },
      { from: "customer_accepted", to: "awaiting_payment", action: "REQUEST_PAYMENT", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(17) },
      { from: "awaiting_payment", to: "payment_verified", action: "VERIFY_PAYMENT", actorRole: "cs", actorId: "cs_layla", timestamp: nowMinusDays(14) },
      { from: "payment_verified", to: "order_created", action: "CREATE_ORDER", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(5) },
    ],
    createdAt: nowMinusDays(35),
    updatedAt: nowMinusDays(5),
  }),
  makeLead({
    id: "lead_16",
    patientId: "patient_16",
    patientName: "Mariam Al-Shehhi",
    patientPhone: "+97150000016",
    patientCountry: "الإمارات",
    treatmentSlug: "diabetic-foot",
    clientType: "g2b",
    status: "specialized_doctor_assigned",
    ownerId: "cs_sara",
    assignedConsultantId: "consultant_dr_amir",
    documents: STANDARD_DOCS.map((d) => ({ ...d, id: `${d.id}_16`, status: "verified" as const })),
    quotations: [
      { ...PATIENT_1_QUOTATION, id: "quote_16", leadId: "lead_16", status: "accepted", packageTier: "silver", totalUSD: 5400 },
    ],
    activeQuotationId: "quote_16",
    statusHistory: [
      { from: "new", to: "assigned", action: "ASSIGN_CS", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(38) },
      { from: "assigned", to: "docs_partial", action: "MARK_DOCS_PARTIAL", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(35) },
      { from: "docs_partial", to: "docs_complete", action: "MARK_DOCS_COMPLETE", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(32) },
      { from: "docs_complete", to: "consultant_review_ready", action: "SEND_TO_CONSULTANT", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(30) },
      { from: "consultant_review_ready", to: "approved", action: "APPROVE_MEDICAL", actorRole: "consultant_doctor", actorId: "consultant_dr_amir", timestamp: nowMinusDays(28) },
      { from: "approved", to: "quotation_generated", action: "GENERATE_QUOTATION", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(26) },
      { from: "quotation_generated", to: "contract_sent", action: "SEND_CONTRACT", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(24) },
      { from: "contract_sent", to: "customer_accepted", action: "ACCEPT_CONTRACT", actorRole: "patient", actorId: "patient_16", timestamp: nowMinusDays(22) },
      { from: "customer_accepted", to: "awaiting_payment", action: "REQUEST_PAYMENT", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(20) },
      { from: "awaiting_payment", to: "payment_verified", action: "VERIFY_PAYMENT", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(17) },
      { from: "payment_verified", to: "order_created", action: "CREATE_ORDER", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(14) },
      { from: "order_created", to: "specialized_doctor_assigned", action: "ASSIGN_DOCTOR", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(2) },
    ],
    createdAt: nowMinusDays(38),
    updatedAt: nowMinusDays(2),
  }),
  makeLead({
    id: "lead_17",
    patientId: "patient_17",
    patientName: "Ibrahim Noor",
    patientPhone: "+24990000017",
    patientCountry: "السودان",
    treatmentSlug: "oncology",
    clientType: "b2c",
    status: "post_treatment",
    ownerId: "cs_layla",
    assignedConsultantId: "consultant_dr_amir",
    documents: STANDARD_DOCS.map((d) => ({ ...d, id: `${d.id}_17`, status: "verified" as const })),
    quotations: [
      { ...PATIENT_1_QUOTATION, id: "quote_17", leadId: "lead_17", status: "accepted", packageTier: "gold", totalUSD: 7200 },
    ],
    activeQuotationId: "quote_17",
    statusHistory: [
      { from: "new", to: "assigned", action: "ASSIGN_CS", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(55) },
      { from: "assigned", to: "docs_partial", action: "MARK_DOCS_PARTIAL", actorRole: "cs", actorId: "cs_layla", timestamp: nowMinusDays(52) },
      { from: "docs_partial", to: "docs_complete", action: "MARK_DOCS_COMPLETE", actorRole: "cs", actorId: "cs_layla", timestamp: nowMinusDays(48) },
      { from: "docs_complete", to: "consultant_review_ready", action: "SEND_TO_CONSULTANT", actorRole: "cs", actorId: "cs_layla", timestamp: nowMinusDays(46) },
      { from: "consultant_review_ready", to: "approved", action: "APPROVE_MEDICAL", actorRole: "consultant_doctor", actorId: "consultant_dr_amir", timestamp: nowMinusDays(44) },
      { from: "approved", to: "quotation_generated", action: "GENERATE_QUOTATION", actorRole: "cs", actorId: "cs_layla", timestamp: nowMinusDays(42) },
      { from: "quotation_generated", to: "contract_sent", action: "SEND_CONTRACT", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(40) },
      { from: "contract_sent", to: "customer_accepted", action: "ACCEPT_CONTRACT", actorRole: "patient", actorId: "patient_17", timestamp: nowMinusDays(38) },
      { from: "customer_accepted", to: "awaiting_payment", action: "REQUEST_PAYMENT", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(36) },
      { from: "awaiting_payment", to: "payment_verified", action: "VERIFY_PAYMENT", actorRole: "cs", actorId: "cs_layla", timestamp: nowMinusDays(33) },
      { from: "payment_verified", to: "order_created", action: "CREATE_ORDER", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(30) },
      { from: "order_created", to: "specialized_doctor_assigned", action: "ASSIGN_DOCTOR", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(27) },
      { from: "specialized_doctor_assigned", to: "in_treatment", action: "START_TREATMENT", actorRole: "specialized_doctor", actorId: "spec_dr_kareem", timestamp: nowMinusDays(20) },
      { from: "in_treatment", to: "post_treatment", action: "COMPLETE_TREATMENT", actorRole: "specialized_doctor", actorId: "spec_dr_kareem", timestamp: nowMinusDays(3) },
    ],
    createdAt: nowMinusDays(55),
    updatedAt: nowMinusDays(3),
  }),
];

const STORE = new Map<string, Lead>();

function persistProcessedLead(prev: Lead, next: Lead, at: string): Lead {
  const processed = processLeadTasks(prev, { ...next, updatedAt: at }, at);
  STORE.set(processed.id, processed);
  return processed;
}

for (const l of SEED) {
  STORE.set(l.id, processLeadTasks(l, l, l.updatedAt));
}

export type LeadFilters = {
  status?: LeadStatus;
  country?: string;
  patientId?: string;
};

export async function getCrmTodayDigest(options?: {
  simulateDelay?: boolean;
}): Promise<CrmTodayDigest> {
  await applyMockDelay(options?.simulateDelay);
  return buildCrmTodayDigest(Array.from(STORE.values()), {
    memberOrder: CRM_TASK_ASSIGNEE_IDS,
  });
}

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

  return {
    ...prev,
    title,
    dueAt,
    assigneeId,
    creationFields,
    attachments,
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
      throw new Error(parsed.error);
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
        throw new Error(v.error);
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
  hotelName?: string;
  transportMode: { ar: string; en: string };
  transportRouteCount: number;
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
    hotelName: input.hotelName,
    transportMode: input.transportMode,
    transportRouteCount: input.transportRouteCount,
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
 * Shallow-merges `updates` into the lead. For nested collections (`documents`,
 * `quotations`, `tasks`, …), pass a **full** replacement array when needed; for
 * tasks, prefer {@link addLeadTask}, {@link updateLeadTask}, {@link deleteLeadTask}.
 */
export async function updateLead(
  id: string,
  updates: Partial<Lead>,
  options?: { simulateDelay?: boolean },
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
  return persistProcessedLead(existing, updated, at);
}
