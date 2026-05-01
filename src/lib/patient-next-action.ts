import type { Lead, Patient, Quotation, RequestStatus } from "@/types";

type LocalizedText = { ar: string; en: string };

/** Patient-executable follow-ups opened from the treatment overview Next action card. */
export type PatientNextActionModalId =
  | "request_callback"
  | "book_call"
  | "order_car"
  | "report_arrival_travel"
  | "report_arrival_stay"
  | "upload_payment_downpayment"
  | "upload_payment_remaining";

export type PatientNextActionCta =
  | { kind: "link"; href: string }
  | { kind: "modal"; modalId: PatientNextActionModalId };

export type PatientNextActionTask = {
  title: LocalizedText;
  ctaLabel: LocalizedText;
  cta: PatientNextActionCta;
};

const PAYMENT_PROOF_UPLOAD_STATUSES: RequestStatus[] = ["quotation_accepted", "booking"];

function hasSatisfactoryPaymentProof(
  documents: Lead["documents"],
  type: "payment_proof_downpayment" | "payment_proof_remaining",
): boolean {
  return documents.some(
    (d) => d.type === type && (d.status === "uploaded" || d.status === "verified"),
  );
}

function pickQuotationForNextActionPayment(lead: Lead): Quotation | undefined {
  const accepted = lead.quotations.find((q) => q.status === "accepted");
  if (accepted) return accepted;
  if (lead.activeQuotationId) {
    const active = lead.quotations.find((q) => q.id === lead.activeQuotationId);
    if (active && active.status !== "draft") return active;
  }
  const sent = lead.quotations
    .filter((q) => q.status === "sent_to_patient")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return sent[0];
}

/**
 * B2C leads at quotation_accepted / booking: prompt for payment proof uploads before
 * arrival/transport next steps. B2B seed leads keep transport-first behavior.
 */
function resolvePaymentProofUploadTask(
  lead: Lead,
  clientType: Patient["clientType"],
): PatientNextActionTask | null {
  if (clientType !== "b2c") return null;
  if (!PAYMENT_PROOF_UPLOAD_STATUSES.includes(lead.status)) return null;

  const quote = pickQuotationForNextActionPayment(lead);
  if (!quote || quote.status === "draft" || quote.totalUSD <= 0) return null;

  if (
    quote.downpaymentRequired &&
    !hasSatisfactoryPaymentProof(lead.documents, "payment_proof_downpayment")
  ) {
    return {
      title: {
        ar: "ارفع إثبات الدفعة المقدمة",
        en: "Upload proof of your down payment",
      },
      ctaLabel: { ar: "رفع الإثبات", en: "Upload proof" },
      cta: { kind: "modal", modalId: "upload_payment_downpayment" },
    };
  }

  const downApplied = quote.downpaymentRequired ? (quote.downpaymentUSD ?? 0) : 0;
  const remainingUSD = quote.totalUSD - downApplied;
  if (remainingUSD <= 0) return null;
  if (!hasSatisfactoryPaymentProof(lead.documents, "payment_proof_remaining")) {
    return {
      title: {
        ar: "ارفع إثبات سداد المتبقي",
        en: "Upload proof of remaining payment",
      },
      ctaLabel: { ar: "رفع الإثبات", en: "Upload proof" },
      cta: { kind: "modal", modalId: "upload_payment_remaining" },
    };
  }

  return null;
}

export type PatientUpcomingEvent = {
  title: LocalizedText;
  startsAt: string;
  doctorName?: string;
  hospitalName?: string;
  locationLabel?: LocalizedText;
  mapUrl?: string;
  meetingUrl?: string;
};

export type PatientNextActionPlan = {
  task: PatientNextActionTask;
  upcomingEvent?: PatientUpcomingEvent;
};

const CRM_MANAGED_TASK: PatientNextActionTask = {
  title: {
    ar: "اطلب تحديثاً من فريق التنسيق",
    en: "Request an update from care coordination",
  },
  ctaLabel: { ar: "طلب اتصال", en: "Request callback" },
  cta: { kind: "modal", modalId: "request_callback" },
};

const TASK_BY_STATUS: Record<RequestStatus, PatientNextActionTask> = {
  new: {
    title: { ar: "أكمل طلب العلاج", en: "Complete your treatment request" },
    ctaLabel: { ar: "متابعة الطلب", en: "Continue request" },
    cta: { kind: "link", href: "/onboarding" },
  },
  interested: {
    title: { ar: "احجز مكالمة مع فريق الرعاية", en: "Book a call with our care team" },
    ctaLabel: { ar: "اختيار موعد", en: "Pick a time" },
    cta: { kind: "modal", modalId: "book_call" },
  },
  estimate_requested: {
    title: { ar: "ارفع المستندات المطلوبة", en: "Upload the required documents" },
    ctaLabel: { ar: "رفع الملفات", en: "Upload files" },
    cta: { kind: "link", href: "/profile/treatment?tab=files" },
  },
  estimate_reviewed: {
    title: { ar: "راجع عروض الأسعار الرسمية", en: "Review your formal quotations" },
    ctaLabel: { ar: "فتح العروض", en: "Open quotations" },
    cta: { kind: "link", href: "/profile/treatment?tab=quotes" },
  },
  quotation_sent: {
    title: { ar: "راجع أو وافق على عرض السعر", en: "Review or accept your quotation" },
    ctaLabel: { ar: "فتح العروض", en: "Open quotations" },
    cta: { kind: "link", href: "/profile/treatment?tab=quotes" },
  },
  changes_requested: {
    title: { ar: "اطلب اتصالاً للمتابعة على عرض السعر", en: "Request a callback about your quotation" },
    ctaLabel: { ar: "طلب اتصال", en: "Request callback" },
    cta: { kind: "modal", modalId: "request_callback" },
  },
  quotation_accepted: {
    title: {
      ar: "أبلغ عن وصولك إلى بلد العلاج",
      en: "Report your arrival in the treatment destination",
    },
    ctaLabel: { ar: "تأكيد الوصول", en: "Confirm arrival" },
    cta: { kind: "modal", modalId: "report_arrival_travel" },
  },
  booking: {
    title: {
      ar: "اطلب سيارة من إقامتك ضمن الباقة",
      en: "Order a car from your package stay",
    },
    ctaLabel: { ar: "عرض الرحلات", en: "View trips & request" },
    cta: { kind: "modal", modalId: "order_car" },
  },
  arrived: {
    title: {
      ar: "أبلغ عن وصولك إلى مكان الإقامة",
      en: "Report that you arrived at your stay",
    },
    ctaLabel: { ar: "تأكيد الوصول للإقامة", en: "Confirm at stay" },
    cta: { kind: "modal", modalId: "report_arrival_stay" },
  },
  in_treatment: {
    title: { ar: "اطلب اتصالاً من فريق الرعاية", en: "Request a call from your care team" },
    ctaLabel: { ar: "طلب اتصال", en: "Request callback" },
    cta: { kind: "modal", modalId: "request_callback" },
  },
  completed: {
    title: {
      ar: "تحدث معنا عن أي أسئلة بعد العلاج",
      en: "Talk to us about aftercare or follow-up",
    },
    ctaLabel: { ar: "طلب اتصال", en: "Request callback" },
    cta: { kind: "modal", modalId: "request_callback" },
  },
  lost: {
    title: { ar: "اطلب مراجعة حالة طلبك", en: "Ask us to review your request status" },
    ctaLabel: { ar: "طلب اتصال", en: "Request callback" },
    cta: { kind: "modal", modalId: "request_callback" },
  },
};

const EVENT_BY_LEAD_ID: Record<string, PatientUpcomingEvent> = {
  lead_1: {
    title: { ar: "مكالمة متابعة متوقعة", en: "Expected follow-up call" },
    startsAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    doctorName: "Dr. Amir Hassan",
    locationLabel: { ar: "مكالمة عبر واتساب", en: "WhatsApp call" },
  },
  lead_8: {
    title: { ar: "استقبال المطار", en: "Airport arrival assistance" },
    startsAt: new Date(Date.now() + 52 * 60 * 60 * 1000).toISOString(),
    locationLabel: { ar: "مطار القاهرة الدولي - مبنى 3", en: "Cairo International Airport - T3" },
    mapUrl: "https://maps.google.com/?q=Cairo+International+Airport+Terminal+3",
  },
  lead_9: {
    title: { ar: "موعد تقييم الطبيب", en: "Doctor assessment appointment" },
    startsAt: new Date(Date.now() + 28 * 60 * 60 * 1000).toISOString(),
    doctorName: "Dr. Kareem Abdelrahman",
    hospitalName: "Al Salam International Hospital",
    locationLabel: { ar: "عيادة العظام - الدور الثالث", en: "Orthopedics Clinic - Floor 3" },
    mapUrl: "https://maps.google.com/?q=Al+Salam+International+Hospital+Cairo",
  },
  lead_10: {
    title: { ar: "موعد متابعة بالفيديو", en: "Video follow-up appointment" },
    startsAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    doctorName: "Dr. Dalia Mansour",
    meetingUrl: "https://meet.google.com/amanak-followup-demo",
    locationLabel: { ar: "جلسة عبر Google Meet", en: "Session via Google Meet" },
  },
};

export function getPatientNextActionPlan(
  lead: Lead,
  patientClientType: Patient["clientType"] = "b2c",
): PatientNextActionPlan {
  const acceptedByCrm = lead.statusHistory.some(
    (entry) =>
      entry.action === "PATIENT_ACCEPTS_QUOTATION" &&
      entry.actorRole !== "patient",
  );
  const crmManaged =
    acceptedByCrm &&
    (lead.status === "quotation_accepted" || lead.status === "booking");

  const paymentProofTask = resolvePaymentProofUploadTask(lead, patientClientType);

  const hasPendingMandatoryDocs = lead.documents.some(
    (doc) => doc.mandatory && doc.status !== "uploaded" && doc.status !== "verified",
  );
  const hasVisibleQuotation = lead.quotations.some((q) => q.status !== "draft");

  let task =
    paymentProofTask ?? (crmManaged ? CRM_MANAGED_TASK : TASK_BY_STATUS[lead.status]);

  if (lead.status === "estimate_requested" && !hasPendingMandatoryDocs) {
    task = {
      title: {
        ar: "اطلب اتصالاً للمتابعة بعد اكتمال الملفات",
        en: "Request a callback now that your files are complete",
      },
      ctaLabel: { ar: "طلب اتصال", en: "Request callback" },
      cta: { kind: "modal", modalId: "request_callback" },
    };
  }
  if (
    (lead.status === "estimate_reviewed" || lead.status === "quotation_sent") &&
    !hasVisibleQuotation
  ) {
    task = {
      title: {
        ar: "اطلب اتصالاً أثناء إعداد عرض السعر",
        en: "Request a callback while your quotation is prepared",
      },
      ctaLabel: { ar: "طلب اتصال", en: "Request callback" },
      cta: { kind: "modal", modalId: "request_callback" },
    };
  }

  return {
    task,
    upcomingEvent: EVENT_BY_LEAD_ID[lead.id],
  };
}
