import {
  addLeadAppointment,
  addLeadTask,
  createDraftQuotation,
  deleteLeadTask,
  getCrmTodayDigest,
  getLeadById,
  listLeads,
  updateLead,
  updateLeadTask,
  uploadLeadDocument,
} from "@/lib/api/leads";
import {
  appendLeadConversation,
  getLeadConversations,
} from "@/lib/api/lead-conversations";
import type { CrmClient } from "./client";

/**
 * Mock implementation of CrmClient. Every method delegates to the existing
 * mock data layer (`src/lib/api/leads.ts`, `lead-conversations.ts`) — no
 * behavior change, just a redirect through the typed seam. The `ctx` argument
 * is currently consumed only when a method needs the actor (e.g. completing a
 * system task that triggers a pipeline transition); HTTP plumbing (`signal`)
 * is forwarded but unused until a real client lands.
 */
export function createMockCrmClient(): CrmClient {
  return {
    leads: {
      list(filters, ctx) {
        return listLeads(filters, { simulateDelay: ctx.simulateDelay });
      },
      get(id, ctx) {
        return getLeadById(id, { simulateDelay: ctx.simulateDelay });
      },
      update(id, updates, ctx) {
        return updateLead(id, updates, { simulateDelay: ctx.simulateDelay });
      },
      addTask(leadId, input, ctx) {
        return addLeadTask(leadId, input, { simulateDelay: ctx.simulateDelay });
      },
      updateTask(leadId, taskId, patch, ctx) {
        return updateLeadTask(leadId, taskId, patch, {
          simulateDelay: ctx.simulateDelay,
          actor: ctx.actor,
          note: ctx.note,
        });
      },
      deleteTask(leadId, taskId, ctx) {
        return deleteLeadTask(leadId, taskId, { simulateDelay: ctx.simulateDelay });
      },
      addAppointment(leadId, input, ctx) {
        return addLeadAppointment(leadId, input, {
          simulateDelay: ctx.simulateDelay,
        });
      },
      uploadDocument(leadId, input, ctx) {
        return uploadLeadDocument(leadId, input, {
          simulateDelay: ctx.simulateDelay,
        });
      },
      createDraftQuotation(leadId, input, ctx) {
        return createDraftQuotation(leadId, input, {
          simulateDelay: ctx.simulateDelay,
        });
      },
    },
    conversations: {
      list(leadId, filters, ctx) {
        return getLeadConversations(leadId, {
          simulateDelay: ctx.simulateDelay,
          channel: filters?.channel,
        });
      },
      append(leadId, item, ctx) {
        return appendLeadConversation(leadId, item, {
          simulateDelay: ctx.simulateDelay,
        });
      },
    },
    digest: {
      today(ctx) {
        return getCrmTodayDigest({ simulateDelay: ctx.simulateDelay });
      },
    },
  };
}
