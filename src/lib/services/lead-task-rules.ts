/**
 * CRM auto-tasks for the patient pipeline (mock parity with future BE).
 */
import {
  areMandatoryDocumentsSatisfied,
  canSpawnPrepareQuotation,
  getCrmSettingsSync,
  isSystemTaskTemplateCompleted,
} from "@/lib/api/crm-settings";
import type {
  Lead,
  LeadStatus,
  LeadTask,
  LeadTaskCompletedReason,
  LeadTaskResolution,
  LeadTaskTemplateKey,
} from "@/types";
import { getStateIndex } from "@/lib/services/state-machine.service";

/**
 * Legacy static titles kept for seed/test modules that need deterministic labels
 * outside of React i18n context.
 */
export const LEAD_TASK_TEMPLATE_TITLES: Record<LeadTaskTemplateKey, string> = {
  lead_qualification: "Lead qualification — validate request and contact",
  collect_documents: "Collect and verify required documents",
  initial_consultation: "Initial consultation with patient / coordinator",
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

export function getSystemTaskTitle(
  key: LeadTaskTemplateKey,
  t: (key: string) => string,
): string {
  return t(`taskTemplateTitles.${key}` as any);
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
    case "initial_consultation":
    case "collect_documents":
      return null;
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
  dueAt?: string,
): LeadTask {
  return {
    id: newTaskId(),
    title: `system_task:${key}`,
    completed: false,
    kind: key,
    source: "system",
    templateKey: key,
    resolution: "open",
    createdAt: at,
    updatedAt: at,
    assigneeId,
    ...(dueAt ? { dueAt } : {}),
  };
}

function clampLeadQualificationSlaHours(raw: number | undefined): number {
  const n = typeof raw === "number" && Number.isFinite(raw) ? raw : 24;
  return Math.max(1, Math.min(168, Math.round(n)));
}

/**
 * Due instant for an open `lead_qualification` task: earliest appointment start if any,
 * otherwise `qualificationCreatedAt` + SLA hours.
 */
export function computeLeadQualificationDueAt(
  lead: Lead,
  qualificationCreatedAt: string,
  slaHours: number,
): string {
  const apptMs = lead.appointments
    .map((a) => Date.parse(a.startsAt))
    .filter((n) => !Number.isNaN(n));
  if (apptMs.length > 0) {
    return new Date(Math.min(...apptMs)).toISOString();
  }
  const anchorMs = Date.parse(qualificationCreatedAt);
  const safeAnchor = Number.isNaN(anchorMs) ? Date.now() : anchorMs;
  const hrs = clampLeadQualificationSlaHours(slaHours);
  return new Date(safeAnchor + hrs * 60 * 60 * 1000).toISOString();
}

function syncOpenLeadQualificationDueTasks(
  tasks: LeadTask[],
  lead: Lead,
  at: string,
  slaHours: number,
): { tasks: LeadTask[]; modified: boolean } {
  let modified = false;
  const sla = clampLeadQualificationSlaHours(slaHours);
  const next = tasks.map((task) => {
    if (task.templateKey !== "lead_qualification" || task.completed) return task;
    const nextDue = computeLeadQualificationDueAt(lead, task.createdAt, sla);
    const curMs = task.dueAt ? Date.parse(task.dueAt) : NaN;
    const nextMs = Date.parse(nextDue);
    if (curMs === nextMs) return task;
    modified = true;
    return { ...task, dueAt: nextDue, updatedAt: at };
  });
  return { tasks: modified ? next : tasks, modified };
}

export function ensureSystemTasks(lead: Lead, at: string): Lead {
  const settings = getCrmSettingsSync();
  let tasks = [...lead.tasks];
  let changed = false;
  const slaHours = clampLeadQualificationSlaHours(
    settings.taskRules.leadQualificationSlaHours,
  );

  const pushIf = (
    key: LeadTaskTemplateKey,
    condition: boolean,
    assigneeId?: string,
  ) => {
    if (!condition || hasOpenTemplate(tasks, key)) return;
    const dueAt =
      key === "lead_qualification"
        ? computeLeadQualificationDueAt(lead, at, slaHours)
        : undefined;
    tasks.push(spawnTask(key, at, assigneeId, dueAt));
    changed = true;
  };

  const st = lead.status;

  if (st === "new") {
    pushIf("lead_qualification", true, lead.ownerId);
  } else if (
    st === "interested" ||
    st === "estimate_requested" ||
    st === "estimate_reviewed" ||
    st === "changes_requested" ||
    (st === "quotation_sent" && !quotationSent(lead))
  ) {
    pushIf("lead_qualification", true, lead.ownerId);

    const qualDone = isSystemTaskTemplateCompleted(lead, "lead_qualification");
    if (qualDone && settings.taskRules.spawnCollectWhenMandatoryDocsMissing) {
      if (!areMandatoryDocumentsSatisfied(lead)) {
        pushIf("collect_documents", true, lead.ownerId);
      }
    }

    const docsOkForInitial =
      !settings.quotationTaskGates.requireDocuments || areMandatoryDocumentsSatisfied(lead);
    if (qualDone && settings.taskRules.spawnInitialConsultation && docsOkForInitial) {
      pushIf("initial_consultation", true, lead.ownerId);
    }
  }

  const canPrep = canSpawnPrepareQuotation(lead, settings);

  switch (st) {
    case "estimate_requested":
      pushIf("prepare_quotation", canPrep, lead.ownerId);
      break;
    case "estimate_reviewed":
      if (!quotationSent(lead)) {
        pushIf("prepare_quotation", canPrep, lead.ownerId);
      }
      break;
    case "quotation_sent":
    case "changes_requested":
      if (!quotationSent(lead)) {
        pushIf("prepare_quotation", canPrep, lead.ownerId);
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

  const synced = syncOpenLeadQualificationDueTasks(tasks, lead, at, slaHours);
  if (synced.modified) {
    tasks = synced.tasks;
    changed = true;
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
  return [
    "lead_qualification",
    "collect_documents",
    "initial_consultation",
    "consultant_review",
    "prepare_quotation",
    "send_contract",
    "confirm_payment",
    "create_order",
    "assign_specialist",
    "treatment_followup",
  ];
}
