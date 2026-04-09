export type Hospital = {
  id: string;
  slug: string;
  name: string;
  destinationSlug: string;
  specialtyKeys: string[];
  descriptionKey: string;
};

export type Doctor = {
  id: string;
  nameKey: string;
  titleKey: string;
  image?: string;
  instagram?: string;
};

export type Treatment = {
  id: string;
  slug: string;
  sortOrder: number;
  category: "general" | "ortho" | "cosmetic";
  titleKey: string;
  descriptionKey: string;
  bodyKey: string;
  priceUSD?: number;
  doctorsKey?: string;
  doctorIds?: string[];
  hospitalsKey?: string;
  techniquesKey?: string;
  successRateKey?: string;
  videoUrlKey?: string;
};

export type InquiryPayload = {
  fullName: string;
  phone: string;
  email?: string;
  treatmentSlug?: string;
  message: string;
};

export type ConsultationSlot = {
  id: string;
  /** UTC instant, ISO-8601 */
  startsAt: string;
};

export type ConsultantProfile = {
  id: string;
  nameKey: string;
  titleKey: string;
  /** Optional public path under `/public` — swap when asset exists */
  imageSrc?: string;
};

export type BookConsultationPayload = {
  slotId: string;
  fullName: string;
  email: string;
  phone: string;
};

// ─── Auth & portals ──────────────────────────────────────────────

export type LeadStatus =
  | "new"
  | "assigned"
  | "docs_missing"
  | "docs_partial"
  | "docs_complete"
  | "consultant_review_ready"
  | "approved"
  | "rejected"
  | "quotation_generated"
  | "contract_sent"
  | "customer_accepted"
  | "awaiting_payment"
  | "payment_verified"
  | "order_created"
  | "specialized_doctor_assigned"
  | "in_treatment"
  | "post_treatment";

export type ActorRole =
  | "admin"
  | "cs"
  | "consultant_doctor"
  | "specialized_doctor"
  | "patient";

export type StateTransition = {
  action: string;
  from: LeadStatus;
  to: LeadStatus;
  allowedRoles: ActorRole[];
  requiresNote?: boolean;
  label: { ar: string; en: string };
};

export type StatusHistoryEntry = {
  from: LeadStatus;
  to: LeadStatus;
  action: string;
  actorRole: ActorRole;
  actorId: string;
  note?: string;
  timestamp: string;
};

export type LeadDocument = {
  id: string;
  type:
    | "medical_report"
    | "xray"
    | "lab_result"
    | "previous_operations"
    | "passport"
    | "visa"
    | "other";
  name: string;
  mandatory: boolean;
  status: "pending" | "uploaded" | "verified";
  uploadedAt?: string;
  uploadedBy?: string;
  mockUrl?: string;
};

export type PackageTier = "normal" | "silver" | "gold" | "vip";

export type QuotationItem = {
  label: { ar: string; en: string };
  amountUSD: number;
};

/** Stable id for idempotent system task creation (usually equals `kind` for system tasks). */
export type LeadTaskTemplateKey =
  | "lead_qualification"
  | "collect_documents"
  | "consultant_review"
  | "prepare_quotation"
  | "send_contract"
  | "confirm_payment"
  | "create_order"
  | "assign_specialist"
  | "treatment_followup";

export type LeadTaskKind = LeadTaskTemplateKey | "manual";

export type LeadTaskSource = "user" | "system";

export type LeadTaskCompletedReason =
  | "user"
  | "status_transition"
  | "quotation_sent"
  | "lead_rejected";

export type LeadTaskResolution =
  | "open"
  | "completed_manual"
  | "completed_rule"
  | "cancelled";

export type LeadTask = {
  id: string;
  title: string;
  completed: boolean;
  dueAt?: string;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserId?: string;
  /** System vs checklist; default treated as `manual` / `user` when absent (legacy mocks). */
  kind?: LeadTaskKind;
  source?: LeadTaskSource;
  /** Same as `kind` for system-generated tasks; used to avoid duplicate open tasks. */
  templateKey?: LeadTaskTemplateKey;
  completedReason?: LeadTaskCompletedReason;
  resolution?: LeadTaskResolution;
  /** Reserved for future transition gating; mock does not enforce. */
  blocking?: boolean;
};

export type LeadConversationChannel = "whatsapp" | "email" | "call";

export type LeadConversationDirection = "inbound" | "outbound" | "internal";

type LeadConversationBase = {
  id: string;
  leadId: string;
  occurredAt: string;
  direction: LeadConversationDirection;
  preview?: string;
};

export type LeadConversationWhatsApp = LeadConversationBase & {
  channel: "whatsapp";
  body: string;
  messageId?: string;
  attachmentHint?: string;
};

export type LeadConversationEmail = LeadConversationBase & {
  channel: "email";
  subject: string;
  snippet?: string;
  body?: string;
  from: string;
  to: string;
  threadId?: string;
};

export type LeadConversationCall = LeadConversationBase & {
  channel: "call";
  transcript: string;
  durationSec?: number;
  recordingUrl?: string;
  provider?: string;
};

export type LeadConversationItem =
  | LeadConversationWhatsApp
  | LeadConversationEmail
  | LeadConversationCall;

export type Quotation = {
  id: string;
  leadId: string;
  packageTier: PackageTier;
  doctorId?: string;
  hospitalId?: string;
  hotelName?: string;
  items: QuotationItem[];
  totalUSD: number;
  status:
    | "draft"
    | "pending_admin"
    | "sent_to_patient"
    | "accepted"
    | "rejected";
  downpaymentRequired: boolean;
  downpaymentUSD?: number;
  termsAndConditions: string;
  createdAt: string;
  version: number;
};

export type Lead = {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  /** Optional; used when email channel events exist */
  patientEmail?: string;
  patientCountry: string;
  treatmentSlug: string;
  clientType: "b2c" | "b2b" | "g2b";
  status: LeadStatus;
  statusHistory: StatusHistoryEntry[];
  assignedCsId?: string;
  assignedConsultantId?: string;
  documents: LeadDocument[];
  quotations: Quotation[];
  activeQuotationId?: string;
  notes?: string;
  tasks: LeadTask[];
  createdAt: string;
  updatedAt: string;
};

export type MockUser = {
  id: string;
  name: string;
  role: ActorRole;
  email: string;
};

export type MockSession =
  | { isAuthenticated: true; user: MockUser }
  | { isAuthenticated: false; user: null };
