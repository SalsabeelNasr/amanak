/**
 * Mock CRM seed data for the 12-state patient pipeline (replaces legacy funnel seed).
 */
import type { Lead, LeadDocument, Quotation } from "@/types";

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
    { label: { ar: "الإجراء الطبي", en: "Medical Procedure" }, amountUSD: 4200, minUSD: 4000, maxUSD: 4800 },
    { label: { ar: "إقامة المستشفى", en: "Hospital Stay" }, amountUSD: 900, minUSD: 800, maxUSD: 1100 },
    { label: { ar: "الفندق (5 ليالٍ)", en: "Hotel (5 nights)" }, amountUSD: 650, minUSD: 500, maxUSD: 800 },
    { label: { ar: "النقل والمواصلات", en: "Transportation" }, amountUSD: 250, minUSD: 200, maxUSD: 350 },
    { label: { ar: "متابعة ما بعد العلاج", en: "Post-treatment care" }, amountUSD: 300, minUSD: 200, maxUSD: 400 },
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

function makeLead(
  partial: Partial<Lead> &
    Pick<
      Lead,
      | "id"
      | "patientId"
      | "patientName"
      | "patientPhone"
      | "patientCountry"
      | "treatmentSlug"
      | "clientType"
      | "status"
    >,
): Lead {
  return {
    recordType: "lead",
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

/** One mock lead per {@link LeadStatus} for filter QA; `lead_1` is the patient portal demo. */
export const PIPELINE_MOCK_SEED: Lead[] = [
  makeLead({
    id: "lead_1",
    patientId: "patient_1",
    patientName: "أحمد محمد",
    patientPhone: "+9647701234567",
    patientEmail: "ahmed.m@example.com",
    patientCountry: "العراق",
    treatmentSlug: "joint-replacement",
    clientType: "b2c",
    status: "quotation_sent",
    leadPriority: "hot",
    ownerId: "cs_sara",
    assignedConsultantId: "consultant_dr_amir",
    documents: STANDARD_DOCS,
    quotations: [PATIENT_1_QUOTATION],
    activeQuotationId: "quote_1",
    provisionalRequest: {
      accommodationTier: "gold",
      partySize: 1,
      flightIntent: "yes",
      originRegion: "Gulf",
      freeTextNote: "Mock provisional request for demo",
    },
    statusHistory: [
      {
        from: "new",
        to: "interested",
        action: "BEGIN_INTAKE",
        actorRole: "cs",
        actorId: "cs_sara",
        timestamp: nowMinusDays(12),
      },
      {
        from: "interested",
        to: "estimate_requested",
        action: "SUBMIT_ESTIMATE",
        actorRole: "cs",
        actorId: "cs_sara",
        timestamp: nowMinusDays(10),
      },
      {
        from: "estimate_requested",
        to: "estimate_reviewed",
        action: "REVIEW_ESTIMATE",
        actorRole: "cs",
        actorId: "cs_sara",
        timestamp: nowMinusDays(8),
      },
      {
        from: "estimate_reviewed",
        to: "quotation_sent",
        action: "DELIVER_QUOTATION",
        actorRole: "cs",
        actorId: "cs_sara",
        timestamp: nowMinusDays(2),
      },
    ],
    createdAt: nowMinusDays(14),
    updatedAt: nowMinusDays(2),
  }),
  makeLead({
    id: "lead_2",
    patientId: "p_new",
    patientName: "Seed New",
    patientPhone: "+20000000001",
    patientCountry: "EG",
    treatmentSlug: "ivf",
    clientType: "b2c",
    status: "new",
  }),
  makeLead({
    id: "lead_3",
    patientId: "p_int",
    patientName: "Seed Interested",
    patientPhone: "+20000000002",
    patientEmail: "int@x.com",
    patientCountry: "SA",
    treatmentSlug: "dental-implants",
    clientType: "b2c",
    status: "interested",
    leadPriority: "low",
  }),
  makeLead({
    id: "lead_4",
    patientId: "p_eq",
    patientName: "Seed Estimate req",
    patientPhone: "+20000000003",
    patientCountry: "KW",
    treatmentSlug: "bariatric",
    clientType: "b2c",
    status: "estimate_requested",
    leadPriority: "normal",
  }),
  makeLead({
    id: "lead_5",
    patientId: "p_er",
    patientName: "Seed Est reviewed",
    patientPhone: "+20000000004",
    patientCountry: "AE",
    treatmentSlug: "cosmetic",
    clientType: "b2c",
    status: "estimate_reviewed",
  }),
  makeLead({
    id: "lead_6",
    patientId: "p_ch",
    patientName: "Seed Changes",
    patientPhone: "+20000000005",
    patientCountry: "QA",
    treatmentSlug: "ivf",
    clientType: "b2c",
    status: "changes_requested",
  }),
  makeLead({
    id: "lead_7",
    patientId: "p_acc",
    patientName: "Seed Accepted",
    patientPhone: "+20000000006",
    patientCountry: "BH",
    treatmentSlug: "joint-replacement",
    clientType: "b2c",
    status: "quotation_accepted",
  }),
  makeLead({
    id: "lead_8",
    patientId: "p_book",
    patientName: "Seed Booking",
    patientPhone: "+20000000007",
    patientCountry: "OM",
    treatmentSlug: "eye-surgery",
    clientType: "b2b",
    status: "booking",
  }),
  makeLead({
    id: "lead_9",
    patientId: "p_arr",
    patientName: "Seed Arrived",
    patientPhone: "+20000000008",
    patientCountry: "JO",
    treatmentSlug: "oncology",
    clientType: "b2c",
    status: "arrived",
  }),
  makeLead({
    id: "lead_10",
    patientId: "p_tr",
    patientName: "Seed In treatment",
    patientPhone: "+20000000009",
    patientCountry: "EG",
    treatmentSlug: "cardiology",
    clientType: "b2c",
    status: "in_treatment",
  }),
  makeLead({
    id: "lead_11",
    patientId: "p_done",
    patientName: "Seed Done",
    patientPhone: "+20000000010",
    patientCountry: "EG",
    treatmentSlug: "dental-implants",
    clientType: "b2c",
    status: "completed",
  }),
  makeLead({
    id: "lead_12",
    patientId: "p_lost",
    patientName: "Seed Lost",
    patientPhone: "+20000000011",
    patientCountry: "EG",
    treatmentSlug: "ivf",
    clientType: "b2c",
    status: "lost",
  }),
];

