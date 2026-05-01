import type { CrmSettings, DeepPartial } from "@/lib/api/crm-settings";
import type {
  Patient,
  Request,
  RequestConversationChannel,
  RequestConversationItem,
  RequestStatus,
} from "@/types";
import type { CrmCtx } from "./ctx";
import type {
  AddRequestAppointmentInput,
  AddRequestTaskInput,
  CreateDraftQuotationInput,
  CreatePatientInput,
  PatientFilters,
  RequestFilters,
  UpdateRequestTaskPatch,
  UploadRequestDocumentInput,
} from "./client.types";
import { createMockCrmClient } from "./client.mock";

/**
 * Typed surface every CRM consumer should use. The day a real backend arrives,
 * swap `createMockCrmClient()` below with `createHttpCrmClient(env.API_BASE)`
 * and every component keeps working — call sites import `crm` from this file,
 * never from `@/lib/api/requests` directly.
 */
export interface CrmClient {
  requests: {
    list(filters: RequestFilters | undefined, ctx: CrmCtx): Promise<Request[]>;
    get(id: string, ctx: CrmCtx): Promise<Request | undefined>;
    update(id: string, updates: Partial<Request>, ctx: CrmCtx): Promise<Request>;
    setStatus(
      requestId: string,
      toStatus: RequestStatus,
      ctx: CrmCtx,
    ): Promise<Request>;
    addTask(requestId: string, input: AddRequestTaskInput, ctx: CrmCtx): Promise<Request>;
    updateTask(
      requestId: string,
      taskId: string,
      patch: UpdateRequestTaskPatch,
      ctx: CrmCtx,
    ): Promise<Request>;
    deleteTask(requestId: string, taskId: string, ctx: CrmCtx): Promise<Request>;
    addAppointment(
      requestId: string,
      input: AddRequestAppointmentInput,
      ctx: CrmCtx,
    ): Promise<Request>;
    uploadDocument(
      requestId: string,
      input: UploadRequestDocumentInput,
      ctx: CrmCtx,
    ): Promise<Request>;
    createDraftQuotation(
      requestId: string,
      input: CreateDraftQuotationInput,
      ctx: CrmCtx,
    ): Promise<Request>;
    sendDraftQuotationToPatient(
      requestId: string,
      quotationId: string,
      ctx: CrmCtx,
    ): Promise<Request>;
    /** Create a new treatment request for an existing patient (mock). */
    createForPatient(
      patientId: string,
      input: { treatmentSlug: string } & Partial<
        Omit<
          Request,
          | "id"
          | "patientId"
          | "treatmentSlug"
          | "createdAt"
          | "updatedAt"
          | "statusHistory"
          | "documents"
          | "quotations"
          | "tasks"
          | "appointments"
        >
      >,
      ctx: CrmCtx,
    ): Promise<Request>;
  };
  patients: {
    list(filters: PatientFilters | undefined, ctx: CrmCtx): Promise<Patient[]>;
    get(id: string, ctx: CrmCtx): Promise<Patient | undefined>;
    create(input: CreatePatientInput, ctx: CrmCtx): Promise<Patient>;
    update(id: string, updates: Partial<Patient>, ctx: CrmCtx): Promise<Patient>;
  };
  conversations: {
    list(
      requestId: string,
      filters: { channel?: RequestConversationChannel } | undefined,
      ctx: CrmCtx,
    ): Promise<RequestConversationItem[]>;
    append(
      requestId: string,
      item: RequestConversationItem,
      ctx: CrmCtx,
    ): Promise<RequestConversationItem>;
  };
  settings: {
    get(ctx: CrmCtx): Promise<CrmSettings>;
    update(partial: DeepPartial<CrmSettings>, ctx: CrmCtx): Promise<CrmSettings>;
  };
}

export const crm: CrmClient = createMockCrmClient();
