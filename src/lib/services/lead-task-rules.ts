/**
 * Pure rules for CRM auto-tasks: ensure idempotent system tasks per funnel stage
 * and resolve them on status / quotation changes (mock parity with future BE).
 */
import type {
  Lead,
  LeadStatus,
  LeadTask,
  LeadTaskCompletedReason,
  LeadTaskResolution,
  LeadTaskTemplateKey,
} from "@/types";
import { getStateIndex } from "@/lib/services/state-machine.service";

export const LEAD_TASK_TEMPLATE_TITLES: Record<LeadTaskTemplateKey, string> = {
  lead_qualification: "Lead qualification — call back and validate the request",
  collect_documents: "Collect and verify required documents",
  consultant_review: "Consultant medical review",
  prepare_quotation: "Prepare and send quotation to patient",
  send_contract: "Send contract for signature",
  confirm_payment: "Confirm payment received",
  create_order: "Create order after payment",
  assign_specialist: "Assign specialized treating doctor",
  treatment_followup: "Post-treatment follow-up and closure",
};

function newTaskId(): string {
  return `task_${globalThis.crypto.randomUUID()}`;
}

function isSystemTask(task: LeadTask): boolean {
  if (task.source === "system") return true;
  return task.templateKey !== undefined && task.kind !== "manual";
}

function hasOpenTemplate(tasks: readonly LeadTask[], key: LeadTaskTemplateKey): boolean {
  return tasks.some((t) => t.templateKey === key && !t.completed);
}

function statusAtLeast(status: LeadStatus, baseline: LeadStatus): boolean {
  if (status === "rejected") return false;
  return getStateIndex(status) >= getStateIndex(baseline);
}

function quotationSentOrAccepted(lead: Lead): boolean {
  return lead.quotations.some(
    (q) => q.status === "sent_to_patient" || q.status === "accepted",
  );
}

function patchTask(
  task: LeadTask,
  at: string,
  resolution: LeadTaskResolution,
  reason: LeadTaskCompletedReason,
): LeadTask {
  return {
    ...task,
    completed: true,
    resolution,
    completedReason: reason,
    updatedAt: at,
  };
}

function spawnTask(
  key: LeadTaskTemplateKey,
  at: string,
  assigneeId?: string,
): LeadTask {
  return {
    id: newTaskId(),
    title: LEAD_TASK_TEMPLATE_TITLES[key],
    completed: false,
    kind: key,
    source: "system",
    templateKey: key,
    resolution: "open",
    createdAt: at,
    updatedAt: at,
    assigneeId,
  };
}

/** Append missing system tasks for the current lead status (idempotent by templateKey). */
export function ensureSystemTasks(lead: Lead, at: string): Lead {
  const tasks = [...lead.tasks];
  let changed = false;
  const pushIf = (
    key: LeadTaskTemplateKey,
    condition: boolean,
    assigneeId?: string,
  ) => {
    if (!condition || hasOpenTemplate(tasks, key)) return;
    tasks.push(spawnTask(key, at, assigneeId));
    changed = true;
  };

  switch (lead.status) {
    case "new":
      pushIf("lead_qualification", true, lead.assignedCsId);
      break;
    case "docs_missing":
    case "docs_partial":
      pushIf("collect_documents", true, lead.assignedCsId);
      break;
    case "consultant_review_ready":
      pushIf(
        "consultant_review",
        true,
        lead.assignedConsultantId ?? lead.assignedCsId,
      );
      break;
    case "approved":
      pushIf("prepare_quotation", true, lead.assignedCsId);
      break;
    case "quotation_generated":
      if (!quotationSentOrAccepted(lead)) {
        pushIf("prepare_quotation", true, lead.assignedCsId);
      }
      pushIf(
        "send_contract",
        quotationSentOrAccepted(lead),
        lead.assignedCsId,
      );
      break;
    case "awaiting_payment":
      pushIf("confirm_payment", true, lead.assignedCsId);
      break;
    case "payment_verified":
      pushIf("create_order", true, lead.assignedCsId);
      break;
    case "order_created":
      pushIf("assign_specialist", true, lead.assignedCsId);
      break;
    case "in_treatment":
      pushIf("treatment_followup", true, lead.assignedCsId);
      break;
    default:
      break;
  }

  return changed ? { ...lead, tasks } : lead;
}

/** Auto-complete or cancel open system tasks using `next` lead snapshot. */
export function resolveLeadTasksAfterLeadChange(
  _prev: Lead,
  next: Lead,
  at: string,
): Lead {
  let tasks = next.tasks.map((t) => ({ ...t }));

  if (next.status === "rejected") {
    tasks = tasks.map((task) => {
      if (task.completed || !isSystemTask(task)) return task;
      if (task.templateKey === "consultant_review") {
        return patchTask(task, at, "completed_rule", "status_transition");
      }
      return patchTask(task, at, "cancelled", "lead_rejected");
    });
    return { ...next, tasks };
  }

  tasks = tasks.map((task) => {
    if (task.completed || !isSystemTask(task) || !task.templateKey) return task;

    const key = task.templateKey;

    if (key === "lead_qualification" && next.status !== "new") {
      return patchTask(task, at, "completed_rule", "status_transition");
    }
    if (key === "collect_documents" && statusAtLeast(next.status, "docs_complete")) {
      return patchTask(task, at, "completed_rule", "status_transition");
    }
    if (key === "consultant_review" && statusAtLeast(next.status, "approved")) {
      return patchTask(task, at, "completed_rule", "status_transition");
    }
    if (key === "prepare_quotation") {
      if (
        quotationSentOrAccepted(next) ||
        statusAtLeast(next.status, "contract_sent")
      ) {
        const reason: LeadTaskCompletedReason = quotationSentOrAccepted(next)
          ? "quotation_sent"
          : "status_transition";
        return patchTask(task, at, "completed_rule", reason);
      }
    }
    if (key === "send_contract" && statusAtLeast(next.status, "contract_sent")) {
      return patchTask(task, at, "completed_rule", "status_transition");
    }
    if (key === "confirm_payment" && statusAtLeast(next.status, "payment_verified")) {
      return patchTask(task, at, "completed_rule", "status_transition");
    }
    if (key === "create_order" && statusAtLeast(next.status, "order_created")) {
      return patchTask(task, at, "completed_rule", "status_transition");
    }
    if (
      key === "assign_specialist" &&
      statusAtLeast(next.status, "specialized_doctor_assigned")
    ) {
      return patchTask(task, at, "completed_rule", "status_transition");
    }
    if (key === "treatment_followup" && statusAtLeast(next.status, "post_treatment")) {
      return patchTask(task, at, "completed_rule", "status_transition");
    }

    return task;
  });

  return { ...next, tasks };
}

/** Run ensure then resolve (use the same `at` ISO timestamp for new/updated rows). */
export function processLeadTasks(prev: Lead, next: Lead, at: string): Lead {
  const ensured = ensureSystemTasks(next, at);
  return resolveLeadTasksAfterLeadChange(prev, ensured, at);
}

export function listLeadTaskTemplateKeys(): LeadTaskTemplateKey[] {
  return Object.keys(LEAD_TASK_TEMPLATE_TITLES) as LeadTaskTemplateKey[];
}
