/**
 * Pure state-machine service for the Amanak lead workflow.
 * No React, no next/* imports — safe to use anywhere.
 */
import type {
  ActorRole,
  Lead,
  LeadStatus,
  MockUser,
  StateTransition,
  StatusHistoryEntry,
} from "@/types";

export const ORDERED_STATES: LeadStatus[] = [
  "new",
  "assigned",
  "docs_missing",
  "docs_partial",
  "docs_complete",
  "consultant_review_ready",
  "approved",
  "quotation_generated",
  "contract_sent",
  "customer_accepted",
  "awaiting_payment",
  "payment_verified",
  "order_created",
  "specialized_doctor_assigned",
  "in_treatment",
  "post_treatment",
];

const STATUS_LABELS: Record<LeadStatus, { ar: string; en: string }> = {
  new: { ar: "جديد", en: "New" },
  assigned: { ar: "تم التعيين", en: "Assigned" },
  docs_missing: { ar: "مستندات مفقودة", en: "Documents Missing" },
  docs_partial: { ar: "مستندات ناقصة", en: "Documents Partial" },
  docs_complete: { ar: "مستندات مكتملة", en: "Documents Complete" },
  consultant_review_ready: {
    ar: "جاهز لمراجعة الاستشاري",
    en: "Ready for Consultant Review",
  },
  approved: { ar: "موافق طبياً", en: "Medically Approved" },
  rejected: { ar: "مرفوض", en: "Rejected" },
  quotation_generated: { ar: "تم إصدار العرض", en: "Quotation Generated" },
  contract_sent: { ar: "تم إرسال العقد", en: "Contract Sent" },
  customer_accepted: { ar: "قبول العميل", en: "Customer Accepted" },
  awaiting_payment: { ar: "بانتظار الدفع", en: "Awaiting Payment" },
  payment_verified: { ar: "تم التحقق من الدفع", en: "Payment Verified" },
  order_created: { ar: "تم إنشاء الطلب", en: "Order Created" },
  specialized_doctor_assigned: {
    ar: "تعيين الطبيب المختص",
    en: "Specialized Doctor Assigned",
  },
  in_treatment: { ar: "تحت العلاج", en: "In Treatment" },
  post_treatment: { ar: "بعد العلاج", en: "Post-Treatment Follow-up" },
};

export const ALL_TRANSITIONS: StateTransition[] = [
  {
    action: "ASSIGN_CS",
    from: "new",
    to: "assigned",
    allowedRoles: ["admin"],
    label: { ar: "تعيين موظف خدمة", en: "Assign CS Agent" },
  },
  {
    action: "REQUEST_DOCS",
    from: "assigned",
    to: "docs_missing",
    allowedRoles: ["admin", "cs"],
    label: { ar: "طلب المستندات", en: "Request Documents" },
  },
  {
    action: "MARK_DOCS_PARTIAL",
    from: "assigned",
    to: "docs_partial",
    allowedRoles: ["admin", "cs"],
    label: { ar: "تحديد المستندات كناقصة", en: "Mark Docs Partial" },
  },
  {
    action: "MARK_DOCS_PARTIAL",
    from: "docs_missing",
    to: "docs_partial",
    allowedRoles: ["admin", "cs"],
    label: { ar: "تحديد المستندات كناقصة", en: "Mark Docs Partial" },
  },
  {
    action: "MARK_DOCS_COMPLETE",
    from: "docs_partial",
    to: "docs_complete",
    allowedRoles: ["admin", "cs"],
    label: { ar: "تحديد المستندات كمكتملة", en: "Mark Docs Complete" },
  },
  {
    action: "SEND_TO_CONSULTANT",
    from: "docs_complete",
    to: "consultant_review_ready",
    allowedRoles: ["admin", "cs"],
    label: { ar: "إرسال للاستشاري", en: "Send to Consultant" },
  },
  {
    action: "APPROVE_MEDICAL",
    from: "consultant_review_ready",
    to: "approved",
    allowedRoles: ["admin", "consultant_doctor"],
    label: { ar: "موافقة طبية", en: "Approve Medically" },
  },
  {
    action: "REJECT_MEDICAL",
    from: "consultant_review_ready",
    to: "rejected",
    allowedRoles: ["admin", "consultant_doctor"],
    requiresNote: true,
    label: { ar: "رفض طبياً", en: "Reject Medically" },
  },
  {
    action: "GENERATE_QUOTATION",
    from: "approved",
    to: "quotation_generated",
    allowedRoles: ["admin", "cs"],
    label: { ar: "إصدار عرض السعر", en: "Generate Quotation" },
  },
  {
    action: "SEND_CONTRACT",
    from: "quotation_generated",
    to: "contract_sent",
    allowedRoles: ["admin"],
    label: { ar: "إرسال العقد", en: "Send Contract" },
  },
  {
    action: "ACCEPT_CONTRACT",
    from: "contract_sent",
    to: "customer_accepted",
    allowedRoles: ["admin", "patient"],
    label: { ar: "قبول العقد", en: "Accept Contract" },
  },
  {
    action: "REJECT_CONTRACT",
    from: "contract_sent",
    to: "rejected",
    allowedRoles: ["admin", "patient"],
    requiresNote: true,
    label: { ar: "رفض العقد", en: "Reject Contract" },
  },
  {
    action: "REQUEST_PAYMENT",
    from: "customer_accepted",
    to: "awaiting_payment",
    allowedRoles: ["admin"],
    label: { ar: "طلب الدفع", en: "Request Payment" },
  },
  {
    action: "VERIFY_PAYMENT",
    from: "awaiting_payment",
    to: "payment_verified",
    allowedRoles: ["admin", "cs"],
    label: { ar: "تأكيد الدفع", en: "Verify Payment" },
  },
  {
    action: "CREATE_ORDER",
    from: "payment_verified",
    to: "order_created",
    allowedRoles: ["admin"],
    label: { ar: "إنشاء الطلب", en: "Create Order" },
  },
  {
    action: "ASSIGN_DOCTOR",
    from: "order_created",
    to: "specialized_doctor_assigned",
    allowedRoles: ["admin"],
    label: { ar: "تعيين الطبيب المختص", en: "Assign Specialized Doctor" },
  },
  {
    action: "START_TREATMENT",
    from: "specialized_doctor_assigned",
    to: "in_treatment",
    allowedRoles: ["admin", "specialized_doctor"],
    label: { ar: "بدء العلاج", en: "Start Treatment" },
  },
  {
    action: "COMPLETE_TREATMENT",
    from: "in_treatment",
    to: "post_treatment",
    allowedRoles: ["admin", "specialized_doctor"],
    label: { ar: "إكمال العلاج", en: "Complete Treatment" },
  },
];

export function getStatusLabel(status: LeadStatus): { ar: string; en: string } {
  return STATUS_LABELS[status];
}

export function isTerminalState(status: LeadStatus): boolean {
  return status === "rejected" || status === "post_treatment";
}

export function getStateIndex(status: LeadStatus): number {
  return ORDERED_STATES.indexOf(status);
}

export function getAvailableTransitions(
  state: LeadStatus,
  role: ActorRole,
): StateTransition[] {
  return ALL_TRANSITIONS.filter(
    (t) => t.from === state && t.allowedRoles.includes(role),
  );
}

export function canTransition(
  state: LeadStatus,
  action: string,
  role: ActorRole,
): boolean {
  return ALL_TRANSITIONS.some(
    (t) =>
      t.from === state && t.action === action && t.allowedRoles.includes(role),
  );
}

export function applyTransition(
  lead: Lead,
  action: string,
  actor: MockUser,
  note?: string,
): Lead {
  const transition = ALL_TRANSITIONS.find(
    (t) =>
      t.from === lead.status &&
      t.action === action &&
      t.allowedRoles.includes(actor.role),
  );
  if (!transition) {
    throw new Error(
      `Invalid transition: ${action} from ${lead.status} for role ${actor.role}`,
    );
  }
  if (transition.requiresNote && !note?.trim()) {
    throw new Error(`Transition ${action} requires a note`);
  }

  const entry: StatusHistoryEntry = {
    from: transition.from,
    to: transition.to,
    action: transition.action,
    actorRole: actor.role,
    actorId: actor.id,
    note,
    timestamp: new Date().toISOString(),
  };

  return {
    ...lead,
    status: transition.to,
    statusHistory: [...lead.statusHistory, entry],
    updatedAt: entry.timestamp,
  };
}
