/**
 * Mock leads repository. Module-level Map acts as in-memory store.
 * NOTE: state resets on server restart — acceptable for the mock layer.
 * Phase 2 will replace this file with a real API client behind the same
 * function signatures.
 */
import type { Lead, LeadDocument, LeadStatus, LeadTask, Quotation } from "@/types";
import { processLeadTasks } from "@/lib/services/lead-task-rules";
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

/** CRM task assignee ids (match seed `assignedCsId` / consultant ids). */
export const CRM_TASK_ASSIGNEE_IDS = [
  "cs_sara",
  "cs_layla",
  "consultant_dr_amir",
  "admin_1",
  "spec_dr_kareem",
] as const;

export type AddLeadTaskInput = {
  title: string;
  dueAt?: string;
  assigneeId?: string;
  createdByUserId?: string;
};

export type UpdateLeadTaskPatch = Partial<
  Pick<LeadTask, "title" | "completed" | "dueAt" | "assigneeId">
>;

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
    assignedCsId: "cs_sara",
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
    assignedCsId: "cs_layla",
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
    assignedCsId: "cs_sara",
    documents: STANDARD_DOCS.map((d) => ({ ...d, id: `${d.id}_4` })),
    statusHistory: [
      { from: "new", to: "assigned", action: "ASSIGN_CS", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(8) },
      { from: "assigned", to: "docs_partial", action: "MARK_DOCS_PARTIAL", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(6) },
      { from: "docs_partial", to: "docs_complete", action: "MARK_DOCS_COMPLETE", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(3) },
      { from: "docs_complete", to: "consultant_review_ready", action: "SEND_TO_CONSULTANT", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(2) },
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
    assignedCsId: "cs_layla",
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
    assignedCsId: "cs_sara",
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
    assignedCsId: "cs_sara",
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
    assignedCsId: "cs_layla",
    documents: [],
    statusHistory: [
      { from: "new", to: "assigned", action: "ASSIGN_CS", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(6) },
      { from: "assigned", to: "docs_missing", action: "REQUEST_DOCS", actorRole: "cs", actorId: "cs_layla", timestamp: nowMinusDays(5) },
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
    assignedCsId: "cs_sara",
    documents: STANDARD_DOCS.map((d) => ({ ...d, id: `${d.id}_9` })),
    statusHistory: [
      { from: "new", to: "assigned", action: "ASSIGN_CS", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(10) },
      { from: "assigned", to: "docs_partial", action: "MARK_DOCS_PARTIAL", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(8) },
      { from: "docs_partial", to: "docs_complete", action: "MARK_DOCS_COMPLETE", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(4) },
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
    assignedCsId: "cs_sara",
    assignedConsultantId: "consultant_dr_amir",
    documents: STANDARD_DOCS.map((d) => ({ ...d, id: `${d.id}_10` })),
    statusHistory: [
      { from: "new", to: "assigned", action: "ASSIGN_CS", actorRole: "admin", actorId: "admin_1", timestamp: nowMinusDays(12) },
      { from: "assigned", to: "docs_partial", action: "MARK_DOCS_PARTIAL", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(10) },
      { from: "docs_partial", to: "docs_complete", action: "MARK_DOCS_COMPLETE", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(7) },
      { from: "docs_complete", to: "consultant_review_ready", action: "SEND_TO_CONSULTANT", actorRole: "cs", actorId: "cs_sara", timestamp: nowMinusDays(5) },
      { from: "consultant_review_ready", to: "approved", action: "APPROVE_MEDICAL", actorRole: "consultant_doctor", actorId: "consultant_dr_amir", timestamp: nowMinusDays(2) },
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
    assignedCsId: "cs_layla",
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
    assignedCsId: "cs_sara",
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
    assignedCsId: "cs_layla",
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
    assignedCsId: "cs_sara",
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
    assignedCsId: "cs_layla",
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
    assignedCsId: "cs_sara",
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
    assignedCsId: "cs_layla",
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
  const title = input.title.trim();
  if (!title) {
    throw new Error("Task title is required");
  }
  const ts = new Date().toISOString();
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
  };
  const updated: Lead = {
    ...existing,
    tasks: [...existing.tasks, task],
    updatedAt: ts,
  };
  return persistProcessedLead(existing, updated, ts);
}

export async function updateLeadTask(
  leadId: string,
  taskId: string,
  patch: UpdateLeadTaskPatch,
  options?: { simulateDelay?: boolean },
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
  const next: LeadTask = {
    ...prev,
    ...patch,
    title: patch.title !== undefined ? patch.title.trim() : prev.title,
    id: prev.id,
    createdAt: prev.createdAt,
    updatedAt: ts,
  };
  if (patch.completed === true && !prev.completed) {
    next.completedReason = "user";
    next.resolution = "completed_manual";
  } else if (patch.completed === false) {
    next.completedReason = undefined;
    next.resolution = "open";
  }
  const tasks = [...existing.tasks];
  tasks[idx] = next;
  const updated: Lead = { ...existing, tasks, updatedAt: ts };
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
