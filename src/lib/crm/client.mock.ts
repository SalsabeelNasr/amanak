import { getCrmSettings, updateCrmSettings } from "@/lib/api/crm-settings";
import {
  createPatient,
  getPatientById,
  listPatients,
  updatePatient,
} from "@/lib/api/patients";
import {
  addRequestAppointment,
  addRequestTask,
  createDraftQuotation as apiCreateDraftQuotation,
  createRequestForPatient,
  deleteRequestTask,
  getRequestById,
  listRequests,
  sendDraftQuotationToPatient as apiSendDraftQuotationToPatient,
  setRequestStatus,
  updateRequest,
  updateRequestTask,
  uploadRequestDocument,
} from "@/lib/api/requests";
import {
  appendRequestConversation,
  getRequestConversations,
} from "@/lib/api/request-conversations";
import type { CrmClient } from "./client";

/**
 * Mock implementation of CrmClient. Methods delegate to the in-memory mock stores.
 */
export function createMockCrmClient(): CrmClient {
  return {
    requests: {
      list(filters, ctx) {
        return listRequests(filters, { simulateDelay: ctx.simulateDelay });
      },
      get(id, ctx) {
        return getRequestById(id, { simulateDelay: ctx.simulateDelay });
      },
      update(id, updates, ctx) {
        return updateRequest(id, updates, {
          simulateDelay: ctx.simulateDelay,
          actor: ctx.actor,
        });
      },
      setStatus(requestId, toStatus, ctx) {
        if (!ctx.actor) {
          throw new Error("setStatus requires ctx.actor");
        }
        if (!ctx.note?.trim()) {
          throw new Error("setStatus requires ctx.note (override reason)");
        }
        return setRequestStatus(requestId, toStatus, {
          actor: ctx.actor,
          note: ctx.note,
          simulateDelay: ctx.simulateDelay,
        });
      },
      addTask(requestId, input, ctx) {
        return addRequestTask(requestId, input, { simulateDelay: ctx.simulateDelay });
      },
      updateTask(requestId, taskId, patch, ctx) {
        return updateRequestTask(requestId, taskId, patch, {
          simulateDelay: ctx.simulateDelay,
          actor: ctx.actor,
          note: ctx.note,
        });
      },
      deleteTask(requestId, taskId, ctx) {
        return deleteRequestTask(requestId, taskId, { simulateDelay: ctx.simulateDelay });
      },
      addAppointment(requestId, input, ctx) {
        return addRequestAppointment(requestId, input, {
          simulateDelay: ctx.simulateDelay,
        });
      },
      uploadDocument(requestId, input, ctx) {
        return uploadRequestDocument(requestId, input, {
          simulateDelay: ctx.simulateDelay,
        });
      },
      createDraftQuotation(requestId, input, ctx) {
        return apiCreateDraftQuotation(requestId, input, {
          simulateDelay: ctx.simulateDelay,
        });
      },
      sendDraftQuotationToPatient(requestId, quotationId, ctx) {
        return apiSendDraftQuotationToPatient(requestId, quotationId, {
          simulateDelay: ctx.simulateDelay,
        });
      },
      createForPatient(patientId, input, ctx) {
        return createRequestForPatient(patientId, input, {
          simulateDelay: ctx.simulateDelay,
        });
      },
    },
    patients: {
      list(filters, ctx) {
        return listPatients(filters, { simulateDelay: ctx.simulateDelay });
      },
      get(id, ctx) {
        return getPatientById(id, { simulateDelay: ctx.simulateDelay });
      },
      create(input, ctx) {
        return createPatient(input, { simulateDelay: ctx.simulateDelay });
      },
      update(id, updates, ctx) {
        return updatePatient(id, updates, { simulateDelay: ctx.simulateDelay });
      },
    },
    conversations: {
      list(requestId, filters, ctx) {
        return getRequestConversations(requestId, {
          simulateDelay: ctx.simulateDelay,
          channel: filters?.channel,
        });
      },
      append(requestId, item, ctx) {
        return appendRequestConversation(requestId, item, {
          simulateDelay: ctx.simulateDelay,
        });
      },
    },
    settings: {
      get() {
        return Promise.resolve(getCrmSettings());
      },
      update(partial, ctx) {
        return updateCrmSettings(partial, { simulateDelay: ctx.simulateDelay });
      },
    },
  };
}
