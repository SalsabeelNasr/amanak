/**
 * Input/output DTOs for the CrmClient interface. Re-exported from the existing
 * mock layer so the typed seam is single-sourced — replacing the mock with an
 * HTTP implementation only requires changing `client.mock.ts`, never these
 * type names.
 */
export type {
  AddLeadAppointmentConsultationInput,
  AddLeadAppointmentInput,
  AddLeadAppointmentOnlineInput,
  AddLeadAppointmentTreatmentInput,
  AddLeadTaskAttachmentInput,
  AddLeadTaskInput,
  CreateDraftQuotationInput,
  LeadFilters,
  UpdateLeadTaskOptions,
  UpdateLeadTaskPatch,
  UploadLeadDocumentInput,
} from "@/lib/api/leads";

export type {
  AppendLeadConversationOptions,
  GetLeadConversationsOptions,
} from "@/lib/api/lead-conversations";

export type { CrmTodayDigest } from "@/lib/crm-today-digest";

export {
  CRM_TASK_ASSIGNEE_IDS,
  LEAD_DOCUMENT_TYPE_ORDER,
  sortLeadTasksForDisplay,
} from "@/lib/api/leads";
