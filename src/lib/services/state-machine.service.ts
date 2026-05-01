/**
 * Lead pipeline (PM spec — 12 statuses, loop changes_requested → quotation_sent).
 * These statuses drive transitions, tasks, and CRM actions. For a coarse patient-facing
 * funnel without decision logic, see `src/lib/lead-journey-stage.ts` ({@link LeadJourneyStage}).
 * Pure: no React, no next/* imports.
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
  "interested",
  "estimate_requested",
  "estimate_reviewed",
  "quotation_sent",
  "changes_requested",
  "quotation_accepted",
  "booking",
  "arrived",
  "in_treatment",
  "completed",
  "lost",
];

const STATUS_LABELS: Record<LeadStatus, { ar: string; en: string }> = {
  new: { ar: "جديد", en: "New" },
  interested: { ar: "مهتم", en: "Interested" },
  estimate_requested: { ar: "طلب تقدير", en: "Estimate requested" },
  estimate_reviewed: { ar: "تمت مراجعة التقدير", en: "Estimate reviewed" },
  quotation_sent: { ar: "تم إرسال عرض السعر", en: "Quotation sent" },
  changes_requested: { ar: "طلب تعديلات", en: "Changes requested" },
  quotation_accepted: { ar: "تم قبول العرض", en: "Quotation accepted" },
  booking: { ar: "قيد التنسيق", en: "Booking" },
  arrived: { ar: "وصل", en: "Arrived" },
  in_treatment: { ar: "تحت العلاج", en: "In treatment" },
  completed: { ar: "مكتمل", en: "Completed" },
  lost: { ar: "مفقود", en: "Lost" },
};

export const ALL_TRANSITIONS: StateTransition[] = [
  {
    action: "BEGIN_INTAKE",
    from: "new",
    to: "interested",
    allowedRoles: ["admin", "cs"],
    label: { ar: "بدء الملف", en: "Begin intake" },
  },
  {
    action: "SUBMIT_ESTIMATE",
    from: "interested",
    to: "estimate_requested",
    allowedRoles: ["admin", "cs", "patient"],
    label: { ar: "طلب تقدير ذاتي", en: "Submit estimate request" },
  },
  {
    action: "REVIEW_ESTIMATE",
    from: "estimate_requested",
    to: "estimate_reviewed",
    allowedRoles: ["admin", "cs"],
    label: { ar: "مراجعة التقدير", en: "Review estimate" },
  },
  {
    action: "DELIVER_QUOTATION",
    from: "estimate_reviewed",
    to: "quotation_sent",
    allowedRoles: ["admin", "cs"],
    label: { ar: "إرسال عرض سعر", en: "Send formal quotation" },
  },
  {
    action: "PATIENT_REQUESTS_CHANGES",
    from: "quotation_sent",
    to: "changes_requested",
    allowedRoles: ["admin", "cs", "patient"],
    label: { ar: "طلب تعديل", en: "Request changes" },
  },
  {
    action: "DELIVER_QUOTATION_REVISION",
    from: "changes_requested",
    to: "quotation_sent",
    allowedRoles: ["admin", "cs"],
    label: { ar: "إرسال عرض منقح", en: "Send revised quotation" },
  },
  {
    action: "PATIENT_ACCEPTS_QUOTATION",
    from: "quotation_sent",
    to: "quotation_accepted",
    allowedRoles: ["admin", "cs", "patient"],
    label: { ar: "قبول العرض", en: "Accept quotation" },
  },
  {
    action: "START_BOOKING",
    from: "quotation_accepted",
    to: "booking",
    allowedRoles: ["admin", "cs"],
    label: { ar: "بدء حجز السفر", en: "Start booking" },
  },
  {
    action: "MARK_ARRIVED",
    from: "booking",
    to: "arrived",
    allowedRoles: ["admin", "cs"],
    label: { ar: "تسجيل الوصول", en: "Mark arrived" },
  },
  {
    action: "START_TREATMENT",
    from: "arrived",
    to: "in_treatment",
    allowedRoles: ["admin", "cs", "specialized_doctor", "consultant_doctor"],
    label: { ar: "بدء العلاج", en: "Start treatment" },
  },
  {
    action: "COMPLETE_TREATMENT",
    from: "in_treatment",
    to: "completed",
    allowedRoles: ["admin", "specialized_doctor"],
    label: { ar: "إكمال العلاج", en: "Complete treatment" },
  },
  ...(
    [
      "new",
      "interested",
      "estimate_requested",
      "estimate_reviewed",
      "quotation_sent",
      "changes_requested",
      "quotation_accepted",
      "booking",
      "arrived",
      "in_treatment",
    ] as const
  ).map(
    (from) =>
      ({
        action: "MARK_LOST",
        from,
        to: "lost",
        allowedRoles: ["admin", "cs"],
        requiresNote: false,
        label: { ar: "تسجيل كمفقود", en: "Mark lost" },
      }) satisfies StateTransition,
  ),
];

export function getStatusLabel(status: LeadStatus): { ar: string; en: string } {
  return STATUS_LABELS[status];
}

export function isTerminalState(status: LeadStatus): boolean {
  return status === "completed" || status === "lost";
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

  // If CRM confirms quotation acceptance on behalf of the patient (e.g. phone call),
  // immediately move to booking so ownership stays on CRM and patient-side action is waived.
  if (action === "PATIENT_ACCEPTS_QUOTATION" && actor.role !== "patient") {
    const bookingTransition = ALL_TRANSITIONS.find(
      (t) =>
        t.from === transition.to &&
        t.action === "START_BOOKING" &&
        t.allowedRoles.includes(actor.role),
    );
    if (bookingTransition) {
      const bookingEntry: StatusHistoryEntry = {
        from: bookingTransition.from,
        to: bookingTransition.to,
        action: bookingTransition.action,
        actorRole: actor.role,
        actorId: actor.id,
        note,
        timestamp: new Date().toISOString(),
      };
      return {
        ...lead,
        status: bookingTransition.to,
        statusHistory: [...lead.statusHistory, entry, bookingEntry],
        updatedAt: bookingEntry.timestamp,
      };
    }
  }

  return {
    ...lead,
    status: transition.to,
    statusHistory: [...lead.statusHistory, entry],
    updatedAt: entry.timestamp,
  };
}
