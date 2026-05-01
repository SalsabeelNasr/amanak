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
  /** Sub-specialty (e.g. "Joint Replacement", "TAVI"); rendered under the title. */
  subSpecialtyKey?: string;
  image?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;
};

/** Tab / browse grouping for treatments listing & landing programs. */
export type TreatmentCategory =
  | "general"
  | "ortho"
  | "cosmetic"
  | "dental"
  | "mental"
  | "specialized";

export type Treatment = {
  id: string;
  slug: string;
  sortOrder: number;
  category: TreatmentCategory;
  titleKey: string;
  descriptionKey: string;
  bodyKey: string;
  priceUSD?: number;
  doctorsKey?: string;
  doctorIds?: string[];
  hospitalsKey?: string;
  techniquesKey?: string;
  successRateKey?: string;
};

export type VideoSource = "youtube" | "instagram" | "facebook";

export type DoctorVideo = {
  id: string;
  source: VideoSource;
  /** YouTube videoId, Instagram embedPath like "reel/SHORTCODE", or canonical Facebook video URL */
  embedRef: string;
  /** Public share URL — opens in source app */
  canonicalUrl: string;
  doctorId: string;
  treatmentSlug: string;
  /** i18n key for short caption shown under the embed */
  captionKey?: string;
  /** ISO date — newer videos sort first */
  publishedAt?: string;
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

/**
 * High-level journey overview for patients and CRM (timeline, badges).
 * Not used for workflow rules — use {@link LeadStatus} and the state machine for transitions.
 */
export type LeadJourneyStage =
  | "request_sent"
  | "quotation_in_negotiation"
  | "booked"
  | "arrived"
  | "in_treatment"
  | "completed";

/** Patient journey pipeline (PM spec). `changes_requested` loops back to `quotation_sent`. */
export type LeadStatus =
  | "new"
  | "interested"
  | "estimate_requested"
  | "estimate_reviewed"
  | "quotation_sent"
  | "changes_requested"
  | "quotation_accepted"
  | "booking"
  | "arrived"
  | "in_treatment"
  | "completed"
  | "lost";

/** Single-table storage: marketing contact vs active lead (plan: convert on treatment selection). */
export type LeadRecordType = "contact" | "lead";

export type LeadPriority = "low" | "normal" | "hot";

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

/** Logged when the aggregated CRM follow-up due instant changes (tasks / appointments / manual). */
export type FollowUpDueHistoryEntry = {
  previousFollowUpDueAt?: string;
  nextFollowUpDueAt?: string;
  timestamp: string;
  actorRole: ActorRole;
  actorId: string;
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
    | "payment_proof_downpayment"
    | "payment_proof_remaining"
    | "other";
  name: string;
  mandatory: boolean;
  status: "pending" | "uploaded" | "verified";
  uploadedAt?: string;
  uploadedBy?: string;
  mockUrl?: string;
};

export type PackageTier = "normal" | "silver" | "gold" | "vip";

/**
 * Intake / provisional request payload on a lead (wizard + portal; mirrors future REST).
 * Populated from patient onboarding or manual CRM entry; UI reads `Lead.provisionalRequest`.
 */
export type ProvisionalRequest = {
  accommodationTier?: PackageTier;
  travelDateStart?: string;
  travelDateEnd?: string;
  flightIntent?: "yes" | "no" | "unsure";
  originRegion?: string;
  transportPreference?: string;
  partySize?: 1 | 2;
  freeTextNote?: string;
  /** Line item ids toggled off at review (mock). */
  excludedLineKeys?: string[];
  /** Care path aligned with patient portal (`PatientCareRequest.path`). */
  requestPath?: "estimate" | "talk" | "book";
  /** Preferred treatment timing bucket from onboarding (`PatientCareRequest.timing`). */
  timing?: "asap" | "one_month" | "three_months";
  /** Estimate-builder toggles (`PatientCareRequest.include*`). */
  includeFlights?: boolean;
  includeAccommodation?: boolean;
  includeTransport?: boolean;
  preferredContactWindow?: string;
  /** When the patient submitted this request (ISO; server-authoritative later). */
  submittedAt?: string;
  /** Mirrors {@link PatientCareRequest.doctorId} (preference at intake; not quotation selection). */
  doctorId?: string;
  /** Mirrors {@link PatientCareRequest.hospitalId}. */
  hospitalId?: string;
  /** Consultation / callback reference when `requestPath` is `book`. */
  bookingReference?: string;
};

export type ContactNudgeRule = {
  id: string;
  order: number;
  delayDays: number;
  channel: "email" | "sms" | "whatsapp";
  templateKey: string;
  enabled: boolean;
};

export type QuotationItem = {
  label: { ar: string; en: string };
  amountUSD: number;
  minUSD?: number;
  maxUSD?: number;
};

/** Stable id for idempotent system task creation (usually equals `kind` for system tasks). */
export type LeadTaskTemplateKey =
  | "lead_qualification"
  | "await_patient_estimate"
  | "collect_documents"
  | "initial_consultation"
  | "consultant_review"
  | "prepare_quotation"
  | "await_patient_quote_response"
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
  | "task_drove_transition"
  /** CRM-on-behalf or patient-portal completion of an "Awaiting patient" task. */
  | "patient_action"
  /** System task cancelled because the lead status jumped over its home status. */
  | "status_skipped";

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
  /**
   * Multi-outcome resolution for tasks like `await_patient_quote_response`.
   * Drives which transition the task triggers on completion.
   */
  completionOutcome?: "accepted" | "changes_requested";
  /** When known (e.g. CRM completion with actor), shown on the lead timeline. */
  completedByUserId?: string;
  completedByRole?: ActorRole;
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
  hotelId?: string;
  hotelName?: string;
  /** Logistic inputs for the accommodation line item (stored with draft quotations). */
  accommodationNights?: number;
  accommodationGuests?: number;
  flightOptionId?: string;
  groundTransportSkuId?: string;
  /** BR-4.1 transport line item context (mock v1). */
  transportMode?: { ar: string; en: string };
  transportRouteCount?: number;
  /** Planned package trips before one‑way airport adjustment (optional; see `transportAirportRoundTrip`). */
  transportPackageTripPlan?: number;
  /** When false, one inbound/outbound airport leg is deducted from billed ground routes for pricing. */
  transportAirportRoundTrip?: boolean;
  items: QuotationItem[];
  totalUSD: number;
  status:
    | "draft"
    | "pending_admin"
    | "sent_to_patient"
    | "accepted"
    | "rejected"
    | "expired";
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
  /** Default `lead` for CRM list; `contact` for nurture-only rows. */
  recordType?: LeadRecordType;
  leadPriority?: LeadPriority;
  provisionalRequest?: ProvisionalRequest;
  /** Marketing opt-outs for automated nudges (email | sms | whatsapp). */
  optedOutChannels?: ("email" | "sms" | "whatsapp")[];
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
  /**
   * Soonest touchpoint among incomplete tasks with `dueAt`, all appointments’ `startsAt`,
   * and optional {@link followUpDueManualAt}.
   */
  followUpDueAt?: string;
  /** User-set reminder (header date picker); participates in {@link followUpDueAt}. */
  followUpDueManualAt?: string;
  followUpDueHistory?: FollowUpDueHistoryEntry[];
  createdAt: string;
  updatedAt: string;
};

/** Patient identity & contact saved in the browser (login + onboarding; mock until backend). */
export type PatientProfileLocal = {
  fullName: string;
  phone: string;
  email: string;
  country: string;
  updatedAt: string;
};

/** Browser-stored care submissions from the patient onboarding wizard (mock until backend). */
export type PatientCareRequestPath = "estimate" | "talk" | "book";

export type PatientEstimateBreakdownSnapshotLine = {
  key: "treatment" | "flights" | "accommodation" | "transport";
  minUSD: number;
  maxUSD: number;
};

export type PatientEstimateSnapshot = {
  totalMinUSD: number;
  totalMaxUSD: number;
  currency: "USD";
  lines: PatientEstimateBreakdownSnapshotLine[];
  computedAt: string;
};

export type PatientCareRequest = {
  id: string;
  treatmentSlug: string;
  isB2B: boolean;
  path: PatientCareRequestPath;
  partySize?: "1" | "2";
  travelerCount?: number;
  timing?: "asap" | "one_month" | "three_months";
  doctorId?: string;
  hospitalId?: string;
  includeFlights?: boolean;
  includeAccommodation?: boolean;
  includeTransport?: boolean;
  estimateSnapshot?: PatientEstimateSnapshot;
  phone?: string;
  contactTime?: string;
  bookingId?: string;
  createdAt: string;
  source: "onboarding";
};

/** Browser-stored callback / consultation follow-ups until CRM marks contacted (mock). */
export type PatientPendingFollowUpKind = "callback" | "consultation";

export type PatientPendingFollowUpStatus = "open" | "contacted";

export type PatientPendingFollowUp = {
  id: string;
  leadId: string;
  kind: PatientPendingFollowUpKind;
  status: PatientPendingFollowUpStatus;
  treatmentSlug?: string;
  phone?: string;
  contactTime?: string;
  bookingId?: string;
  createdAt: string;
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
