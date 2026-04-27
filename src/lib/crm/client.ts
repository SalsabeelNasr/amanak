import type {
  Lead,
  LeadConversationChannel,
  LeadConversationItem,
} from "@/types";
import type { CrmCtx } from "./ctx";
import type {
  AddLeadAppointmentInput,
  AddLeadTaskInput,
  CreateDraftQuotationInput,
  CrmTodayDigest,
  LeadFilters,
  UpdateLeadTaskPatch,
  UploadLeadDocumentInput,
} from "./client.types";
import { createMockCrmClient } from "./client.mock";

/**
 * Typed surface every CRM consumer should use. The day a real backend arrives,
 * swap `createMockCrmClient()` below with `createHttpCrmClient(env.API_BASE)`
 * and every component keeps working — call sites import `crm` from this file,
 * never from `@/lib/api/leads` directly.
 */
export interface CrmClient {
  leads: {
    list(filters: LeadFilters | undefined, ctx: CrmCtx): Promise<Lead[]>;
    get(id: string, ctx: CrmCtx): Promise<Lead | undefined>;
    update(id: string, updates: Partial<Lead>, ctx: CrmCtx): Promise<Lead>;
    addTask(leadId: string, input: AddLeadTaskInput, ctx: CrmCtx): Promise<Lead>;
    updateTask(
      leadId: string,
      taskId: string,
      patch: UpdateLeadTaskPatch,
      ctx: CrmCtx,
    ): Promise<Lead>;
    deleteTask(leadId: string, taskId: string, ctx: CrmCtx): Promise<Lead>;
    addAppointment(
      leadId: string,
      input: AddLeadAppointmentInput,
      ctx: CrmCtx,
    ): Promise<Lead>;
    uploadDocument(
      leadId: string,
      input: UploadLeadDocumentInput,
      ctx: CrmCtx,
    ): Promise<Lead>;
    createDraftQuotation(
      leadId: string,
      input: CreateDraftQuotationInput,
      ctx: CrmCtx,
    ): Promise<Lead>;
  };
  conversations: {
    list(
      leadId: string,
      filters: { channel?: LeadConversationChannel } | undefined,
      ctx: CrmCtx,
    ): Promise<LeadConversationItem[]>;
    append(
      leadId: string,
      item: LeadConversationItem,
      ctx: CrmCtx,
    ): Promise<LeadConversationItem>;
  };
  digest: {
    today(ctx: CrmCtx): Promise<CrmTodayDigest>;
  };
}

export const crm: CrmClient = createMockCrmClient();
