/**
 * Input/output DTOs for the CrmClient interface. Re-exported from the mock API
 * layer so the typed seam is single-sourced.
 */
export type {
  AddRequestAppointmentConsultationInput,
  AddRequestAppointmentInput,
  AddRequestAppointmentOnlineInput,
  AddRequestAppointmentTreatmentInput,
  AddRequestTaskAttachmentInput,
  AddRequestTaskInput,
  CreateDraftQuotationInput,
  RequestFilters,
  UpdateRequestTaskOptions,
  UpdateRequestTaskPatch,
  UploadRequestDocumentInput,
} from "@/lib/api/requests";

export type {
  AppendRequestConversationOptions,
  GetRequestConversationsOptions,
} from "@/lib/api/request-conversations";

export {
  CRM_TASK_ASSIGNEE_IDS,
  REQUEST_DOCUMENT_TYPE_ORDER,
  sortRequestTasksForDisplay,
} from "@/lib/api/requests";

export {
  REQUEST_DOCUMENT_TYPE_ORDER as LEAD_DOCUMENT_TYPE_ORDER,
  sortRequestTasksForDisplay as sortLeadTasksForDisplay,
} from "@/lib/api/requests";

/** @deprecated Use AddRequestTaskInput */
export type { AddRequestTaskInput as AddLeadTaskInput } from "@/lib/api/requests";
/** @deprecated Use AddRequestTaskAttachmentInput */
export type { AddRequestTaskAttachmentInput as AddLeadTaskAttachmentInput } from "@/lib/api/requests";
/** @deprecated Use UpdateRequestTaskPatch */
export type { UpdateRequestTaskPatch as UpdateLeadTaskPatch } from "@/lib/api/requests";
/** @deprecated Use UpdateRequestTaskOptions */
export type { UpdateRequestTaskOptions as UpdateLeadTaskOptions } from "@/lib/api/requests";
/** @deprecated Use AddRequestAppointmentInput */
export type { AddRequestAppointmentInput as AddLeadAppointmentInput } from "@/lib/api/requests";
/** @deprecated Use UploadRequestDocumentInput */
export type { UploadRequestDocumentInput as UploadLeadDocumentInput } from "@/lib/api/requests";
/** @deprecated Use RequestFilters */
export type { RequestFilters as LeadFilters } from "@/lib/api/requests";

export type { CreatePatientInput, PatientFilters } from "@/lib/api/patients";
