/**
 * CRM auto-tasks for the patient pipeline (mock parity with future BE).
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
  lead_qualification: "Lead qualification — validate request and contact",
  collect_documents: "Collect and verify required documents",
  consultant_review: "Clinical / coordinator review",
  prepare_quotation: "Prepare or deliver formal quotation",
  send_contract: "Follow up on quotation and next steps",
  confirm_payment: "Confirm payment received",
  create_order: "Coordinate booking and logistics",
  assign_specialist: "Assign treating doctor / facility",
  treatment_followup: "Post-treatment follow-up and closure",
};

function newTaskId(): string {
  return `task_${globalThis.crypto.randomUUID()}`;
}

export function isSystemTask(task: LeadTask): boolean {
  if (task.source === "system") return true;
  return task.templateKey !== undefined && task.kind !== "manual";
}

export function getTransitionActionForSystemTaskCompletion(
  lead: Lead,
  task: LeadTask,
): string | null {
  if (!isSystemTask(task) || !task.templateKey) return null;
  const key = task.templateKey;
  const status = lead.status;

  switch (key) {
    case "lead_qualification":
      return status === "new" ? "BEGIN_INTAKE" : null;
    case "prepare_quotation":
      if (status === "estimate_requested") return "REVIEW_ESTIMATE";
      if (status === "estimate_reviewed") return "DELIVER_QUOTATION";
      if (status === "changes_requested") return "DELIVER_QUOTATION_REVISION";
      return null;
    case "treatment_followup":
      return status === "in_treatment" ? "COMPLETE_TREATMENT" : null;
    case "create_order":
      return status === "quotation_accepted" ? "START_BOOKING" : null;
    case "assign_specialist":
      return status === "booking" ? "MARK_ARRIVED" : null;
    case "send_contract":
      return status === "arrived" ? "START_TREATMENT" : null;
    default:
      return null;
  }
}

function hasOpenTemplate(tasks: readonly LeadTask[], key: LeadTaskTemplateKey): boolean {
  return tasks.some((t) => t.templateKey === key && !t.completed);
}

function statusAtLeast(status: LeadStatus, baseline: LeadStatus): boolean {
  if (status === "lost") return false;
  return getStateIndex(status) >= getStateIndex(baseline);
}

function quotationSent(lead: Lead): boolean {
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
    case "interested":
      pushIf("lead_qualification", true, lead.ownerId);
      break;
    case "estimate_requested":
      pushIf("prepare_quotation", true, lead.ownerId);
      break;
    case "estimate_reviewed":
      if (!quotationSent(lead)) {
        pushIf("prepare_quotation", true, lead.ownerId);
      }
      break;
    case "quotation_sent":
    case "changes_requested":
      if (!quotationSent(lead)) {
        pushIf("prepare_quotation", true, lead.ownerId);
      } else {
        pushIf("send_contract", true, lead.ownerId);
      }
      break;
    case "quotation_accepted":
      pushIf("create_order", true, lead.ownerId);
      break;
    case "booking":
      pushIf("assign_specialist", true, lead.ownerId);
      break;
    case "arrived":
      pushIf("send_contract", true, lead.ownerId);
      break;
    case "in_treatment":
      pushIf("treatment_followup", true, lead.ownerId);
      break;
    default:
      break;
  }

  return changed ? { ...lead, tasks } : lead;
}

export function resolveLeadTasksAfterLeadChange(
  _prev: Lead,
  next: Lead,
  at: string,
): Lead {
  let tasks = next.tasks.map((t) => ({ ...t }));

  if (next.status === "lost") {
    tasks = tasks.map((task) => {
      if (task.completed || !isSystemTask(task)) return task;
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
    if (key === "prepare_quotation") {
      if (quotationSent(next) && statusAtLeast(next.status, "quotation_sent")) {
        return patchTask(
          task,
          at,
          "completed_rule",
          next.quotations.some((q) => q.status === "sent_to_patient")
            ? "quotation_sent"
            : "status_transition",
        );
      }
    }
    if (key === "treatment_followup" && next.status === "completed") {
      return patchTask(task, at, "completed_rule", "status_transition");
    }
    if (key === "create_order" && statusAtLeast(next.status, "booking")) {
      return patchTask(task, at, "completed_rule", "status_transition");
    }
    if (key === "assign_specialist" && statusAtLeast(next.status, "arrived")) {
      return patchTask(task, at, "completed_rule", "status_transition");
    }
    if (key === "send_contract" && statusAtLeast(next.status, "in_treatment")) {
      return patchTask(task, at, "completed_rule", "status_transition");
    }

    return task;
  });

  return { ...next, tasks };
}

export function processLeadTasks(prev: Lead, next: Lead, at: string): Lead {
  const ensured = ensureSystemTasks(next, at);
  return resolveLeadTasksAfterLeadChange(prev, ensured, at);
}

export function listLeadTaskTemplateKeys(): LeadTaskTemplateKey[] {
  return Object.keys(LEAD_TASK_TEMPLATE_TITLES) as LeadTaskTemplateKey[];
}
