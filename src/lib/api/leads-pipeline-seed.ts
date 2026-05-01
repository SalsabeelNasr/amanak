/**
 * Mock CRM seed data for the 12-state patient pipeline (replaces legacy funnel seed).
 */
import { getQuotationTransportProfile } from "@/lib/api/quotation-catalog";
import { LEAD_TASK_TEMPLATE_TITLES } from "@/lib/services/lead-task-rules";
import type { Lead, LeadDocument, LeadTask, LeadTaskTemplateKey, Quotation } from "@/types";

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

function completedMilestone(
  id: string,
  key: LeadTaskTemplateKey,
  at: string,
  assigneeId?: string,
): LeadTask {
  return {
    id,
    title: LEAD_TASK_TEMPLATE_TITLES[key],
    completed: true,
    kind: key,
    source: "system",
    templateKey: key,
    resolution: "completed_rule",
    completedReason: "user",
    createdAt: at,
    updatedAt: at,
    assigneeId,
  };
}

function openPrepareQuotation(
  id: string,
  at: string,
  assigneeId?: string,
): LeadTask {
  const key = "prepare_quotation" as const;
  return {
    id,
    title: LEAD_TASK_TEMPLATE_TITLES[key],
    completed: false,
    kind: key,
    source: "system",
    templateKey: key,
    resolution: "open",
    createdAt: at,
    updatedAt: at,
    assigneeId,
  };
}

/** Mock line items that sum exactly to {@link totalUSD} (patient portal package breakdown). */
function mockAcceptedLineItems(totalUSD: number): Quotation["items"] {
  if (totalUSD <= 0) return [];
  const procedure = Math.floor(totalUSD * 0.52);
  const facility = Math.floor(totalUSD * 0.18);
  const accommodation = Math.floor(totalUSD * 0.14);
  const transport = Math.floor(totalUSD * 0.08);
  const remainder = totalUSD - procedure - facility - accommodation - transport;
  const line = (amount: number, ar: string, en: string): Quotation["items"][number] => ({
    label: { ar, en },
    amountUSD: amount,
    minUSD: amount,
    maxUSD: amount,
  });
  return [
    line(procedure, "الإجراء الطبي", "Medical procedure"),
    line(facility, "إقامة المستشفى والمرافق", "Hospital stay & facility"),
    line(accommodation, "الإقامة (الباقة)", "Accommodation (package)"),
    line(transport, "النقل الأرضي", "Ground transportation"),
    line(remainder, "الطيران والتنسيق", "Flights & coordination"),
  ];
}

function seedAcceptedQuotation(
  leadId: string,
  quoteId: string,
  totalUSD: number,
  version: number,
  treatmentSlug: string,
  opts?: { includeStay?: boolean; extra?: Partial<Quotation> },
): Quotation {
  const tr = getQuotationTransportProfile(treatmentSlug);
  const includeStay = opts?.includeStay !== false;
  return {
    id: quoteId,
    leadId,
    packageTier: "silver",
    doctorId: "rashad_bishara",
    hospitalId: "hospital_cairo_1",
    items: mockAcceptedLineItems(totalUSD),
    totalUSD,
    status: "accepted",
    downpaymentRequired: true,
    downpaymentUSD: Math.round(totalUSD * 0.2),
    termsAndConditions: "Mock accepted quotation terms.",
    createdAt: nowMinusDays(3),
    version,
    flightOptionId: "flt_reg_economy",
    groundTransportSkuId: "gnd_standard",
    transportMode: tr.modeLabel,
    transportRouteCount: tr.routeCount,
    transportPackageTripPlan: 6,
    transportAirportRoundTrip: true,
    ...(includeStay
      ? {
          hotelId: "def_sil",
          accommodationNights: 7,
          accommodationGuests: 2,
        }
      : {}),
    ...opts?.extra,
  };
}

const JR_TRANSPORT = getQuotationTransportProfile("joint-replacement");

const PATIENT_1_QUOTATION: Quotation = {
  id: "quote_1",
  leadId: "lead_1",
  packageTier: "gold",
  doctorId: "rashad_bishara",
  hospitalId: "hospital_cairo_1",
  hotelId: "def_gold",
  accommodationNights: 5,
  accommodationGuests: 1,
  flightOptionId: "flt_med_economy",
  groundTransportSkuId: "gnd_standard",
  transportMode: JR_TRANSPORT.modeLabel,
  transportRouteCount: JR_TRANSPORT.routeCount,
  transportPackageTripPlan: 6,
  transportAirportRoundTrip: true,
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
    patientCountry: "IQ",
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
      requestPath: "estimate",
      timing: "one_month",
      submittedAt: nowMinusDays(13),
      accommodationTier: "gold",
      partySize: 1,
      travelDateStart: nowMinusDays(-14),
      travelDateEnd: nowMinusDays(-7),
      flightIntent: "yes",
      includeFlights: true,
      includeAccommodation: true,
      includeTransport: true,
      originRegion: "Gulf",
      transportPreference: "Private car from airport",
      doctorId: "rashad_bishara",
      hospitalId: "hospital_cairo_1",
      freeTextNote: "Prefers ground-floor room; traveling with spouse as non-patient companion.",
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
    provisionalRequest: {
      requestPath: "talk",
      timing: "asap",
      submittedAt: nowMinusDays(1),
      partySize: 2,
      preferredContactWindow: "Evenings, GMT+3",
      includeAccommodation: false,
      includeTransport: false,
      freeTextNote: "Callback-only — wants pricing ballpark before uploading records.",
    },
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
    ownerId: "cs_sara",
    documents: STANDARD_DOCS,
    tasks: [
      completedMilestone("l4_t_qual", "lead_qualification", nowMinusDays(14), "cs_sara"),
      completedMilestone("l4_t_docs", "collect_documents", nowMinusDays(13), "cs_sara"),
      completedMilestone("l4_t_init", "initial_consultation", nowMinusDays(12), "cs_sara"),
    ],
    provisionalRequest: {
      requestPath: "estimate",
      timing: "three_months",
      submittedAt: nowMinusDays(11),
      accommodationTier: "silver",
      partySize: 1,
      flightIntent: "unsure",
      includeFlights: true,
      includeAccommodation: true,
      includeTransport: false,
      originRegion: "Levant",
    },
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
    ownerId: "cs_sara",
    documents: STANDARD_DOCS,
    tasks: [
      completedMilestone("l5_t_qual", "lead_qualification", nowMinusDays(20), "cs_sara"),
      completedMilestone("l5_t_docs", "collect_documents", nowMinusDays(19), "cs_sara"),
      completedMilestone("l5_t_init", "initial_consultation", nowMinusDays(18), "cs_sara"),
      openPrepareQuotation("l5_t_prep", nowMinusDays(2), "cs_sara"),
    ],
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
    ownerId: "cs_sara",
    documents: STANDARD_DOCS,
    tasks: [
      completedMilestone("l6_t_qual", "lead_qualification", nowMinusDays(16), "cs_sara"),
      completedMilestone("l6_t_docs", "collect_documents", nowMinusDays(15), "cs_sara"),
      completedMilestone("l6_t_init", "initial_consultation", nowMinusDays(14), "cs_sara"),
      openPrepareQuotation("l6_t_prep", nowMinusDays(1), "cs_sara"),
    ],
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
    documents: STANDARD_DOCS,
    quotations: [seedAcceptedQuotation("lead_7", "quote_7", 5200, 1, "joint-replacement")],
    activeQuotationId: "quote_7",
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
    provisionalRequest: {
      requestPath: "book",
      timing: "one_month",
      submittedAt: nowMinusDays(25),
      bookingReference: "CONS-OM-8832",
      partySize: 1,
      doctorId: "tamer_el_nahas",
      hospitalId: "h_int_eye",
      flightIntent: "no",
      includeFlights: false,
      includeAccommodation: true,
      includeTransport: true,
    },
    documents: STANDARD_DOCS,
    quotations: [
      seedAcceptedQuotation("lead_8", "quote_8", 11800, 2, "eye-surgery", { includeStay: false }),
    ],
    activeQuotationId: "quote_8",
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
    documents: STANDARD_DOCS,
    quotations: [seedAcceptedQuotation("lead_9", "quote_9", 24500, 1, "oncology")],
    activeQuotationId: "quote_9",
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
    documents: STANDARD_DOCS,
    quotations: [seedAcceptedQuotation("lead_10", "quote_10", 9100, 1, "cardiology")],
    activeQuotationId: "quote_10",
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
    documents: STANDARD_DOCS,
    quotations: [seedAcceptedQuotation("lead_11", "quote_11", 3400, 1, "dental-implants")],
    activeQuotationId: "quote_11",
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

