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
  | "lead_rejected"
  /** User marked a system task complete; it triggered applyTransition. */
  | "task_drove_transition";

export type LeadTaskResolution =
  | "open"
  | "completed_manual"
  | "completed_rule"
  | "cancelled";

/** User-facing task creation categories (not pipeline `LeadTaskTemplateKey`). */
export type LeadTaskCreationTypeId =
  | "collect_medical_files"
  | "payment_proof"
  | "internal_follow_up"
  | "custom";

export type LeadTaskAttachment = {
  id: string;
  slotId: string;
  fileName: string;
  sizeBytes: number;
  uploadedAt: string;
  mockUrl?: string;
};

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
  /** CRM manual task creation flow only. */
  creationTypeId?: LeadTaskCreationTypeId;
  creationFields?: Record<string, string>;
  attachments?: LeadTaskAttachment[];
};

export type LeadConversationChannel = "whatsapp" | "email" | "call" | "sms";

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
  /** References {@link Quotation.id} on the same lead (outbound compose). */
  attachedQuotationIds?: string[];
};

export type LeadConversationEmail = LeadConversationBase & {
  channel: "email";
  subject: string;
  snippet?: string;
  body?: string;
  from: string;
  to: string;
  threadId?: string;
  attachmentHint?: string;
  attachedQuotationIds?: string[];
};

export type LeadConversationSms = LeadConversationBase & {
  channel: "sms";
  body: string;
  /** Patient phone the SMS was sent to (mock). */
  toPhone?: string;
  attachmentHint?: string;
  attachedQuotationIds?: string[];
};

export type LeadConversationCallKind = "manual_log" | "app_placed";

export type LeadConversationCall = LeadConversationBase & {
  channel: "call";
  /** How the call row was created: written after the fact vs placed via the app. */
  callKind?: LeadConversationCallKind;
  transcript: string;
  durationSec?: number;
  recordingUrl?: string;
  provider?: string;
};

export type LeadConversationItem =
  | LeadConversationWhatsApp
  | LeadConversationEmail
  | LeadConversationSms
  | LeadConversationCall;

export type LeadAppointmentKind =
  | "treatment"
  | "online_meeting"
  | "team_consultation";

type LeadAppointmentBase = {
  id: string;
  leadId: string;
  startsAt: string;
  createdAt: string;
  createdByUserId?: string;
  notes?: string;
};

export type LeadTreatmentAppointment = LeadAppointmentBase & {
  kind: "treatment";
  locationLabel: string;
};

export type LeadOnlineMeetingAppointment = LeadAppointmentBase & {
  kind: "online_meeting";
  meetingUrl: string;
  title?: string;
};

export type LeadTeamConsultationAppointment = LeadAppointmentBase & {
  kind: "team_consultation";
  slotId?: string;
  linkedTaskId: string;
};

export type LeadAppointment =
  | LeadTreatmentAppointment
  | LeadOnlineMeetingAppointment
  | LeadTeamConsultationAppointment;

export type Quotation = {
  id: string;
  leadId: string;
  packageTier: PackageTier;
  doctorId?: string;
  hospitalId?: string;
  hotelName?: string;
  /** BR-4.1 transport line item context (mock v1). */
  transportMode?: { ar: string; en: string };
  transportRouteCount?: number;
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
  /** CRM lead owner (e.g. primary CS). Task rows use {@link LeadTask.assigneeId} separately. */
  ownerId?: string;
  assignedConsultantId?: string;
  documents: LeadDocument[];
  quotations: Quotation[];
  activeQuotationId?: string;
  notes?: string;
  tasks: LeadTask[];
  appointments: LeadAppointment[];
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
