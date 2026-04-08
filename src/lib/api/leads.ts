/**
 * Mock leads repository. Module-level Map acts as in-memory store.
 * NOTE: state resets on server restart — acceptable for the mock layer.
 * Phase 2 will replace this file with a real API client behind the same
 * function signatures.
 */
import type { Lead, LeadDocument, LeadStatus, Quotation } from "@/types";
import { applyMockDelay } from "./mock-delay";

function nowMinusDays(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
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
    createdAt: nowMinusDays(14),
    updatedAt: nowMinusDays(1),
    ...partial,
  };
}

const SEED: Lead[] = [
  makeLead({
    id: "lead_1",
    patientId: "patient_1",
    patientName: "أحمد محمد",
    patientPhone: "+9647701234567",
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
];

const STORE = new Map<string, Lead>(SEED.map((l) => [l.id, l]));

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
  const updated: Lead = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  STORE.set(id, updated);
  return updated;
}
