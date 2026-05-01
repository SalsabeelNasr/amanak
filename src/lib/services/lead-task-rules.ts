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
  Request,
  RequestStatus,
  RequestTask,
  RequestTaskCompletedReason,
  RequestTaskResolution,
  RequestTaskTemplateKey,
} from "@/types";
import { getStateIndex } from "@/lib/services/state-machine.service";

/**
 * Pseudo-assignee id used by "Awaiting patient" system tasks. Not a CRM teammate
 * (`CRM_TASK_ASSIGNEE_IDS`); the UI renders a "Patient" badge for it instead.
 */
export const REQUEST_PATIENT_ASSIGNEE_ID = "patient" as const;

/** @deprecated Use {@link REQUEST_PATIENT_ASSIGNEE_ID} */
export const LEAD_PATIENT_ASSIGNEE_ID = REQUEST_PATIENT_ASSIGNEE_ID;

/**
 * Legacy static titles kept for seed/test modules that need deterministic labels
 * outside of React i18n context.
 */
export const REQUEST_TASK_TEMPLATE_TITLES: Record<RequestTaskTemplateKey, string> = {
  lead_qualification: "Request qualification — validate request and contact",
  await_patient_estimate: "Awaiting patient — estimate request submission",
  collect_documents: "Collect and verify required documents",
  initial_consultation: "Initial consultation with patient / coordinator",
  consultant_review: "Clinical / coordinator review",
  prepare_quotation: "Prepare or deliver formal quotation",
  await_patient_quote_response: "Awaiting patient — quotation response",
  send_contract: "Follow up on quotation and next steps",
  confirm_payment: "Confirm payment received",
  create_order: "Coordinate booking and logistics",
  assign_specialist: "Assign treating doctor / facility",
  treatment_followup: "Post-treatment follow-up and closure",
};

function newTaskId(): string {
  return `task_${globalThis.crypto.randomUUID()}`;
}

export function isSystemTask(task: RequestTask): boolean {
  if (task.source === "system") return true;
  return task.templateKey !== undefined && task.kind !== "manual";
}

export function getSystemTaskTitle(
  key: RequestTaskTemplateKey,
  t: (key: string) => string,
): string {
  return t(`taskTemplateTitles.${key}` as any);
}

export function getTransitionActionForSystemTaskCompletion(
  lead: Request,
  task: RequestTask,
): string | null {
  if (!isSystemTask(task) || !task.templateKey) return null;
  const key = task.templateKey;
  const status = lead.status;

  switch (key) {
    case "lead_qualification":
      return status === "new" ? "BEGIN_INTAKE" : null;
    case "await_patient_estimate":
      return status === "interested" ? "SUBMIT_ESTIMATE" : null;
    case "prepare_quotation":
      if (status === "estimate_requested") return "REVIEW_ESTIMATE";
      if (status === "estimate_reviewed") return "DELIVER_QUOTATION";
      if (status === "changes_requested") return "DELIVER_QUOTATION_REVISION";
      return null;
    case "await_patient_quote_response":
      if (status !== "quotation_sent") return null;
      if (task.completionOutcome === "accepted") return "PATIENT_ACCEPTS_QUOTATION";
      if (task.completionOutcome === "changes_requested") return "PATIENT_REQUESTS_CHANGES";
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

function hasOpenTemplate(tasks: readonly RequestTask[], key: RequestTaskTemplateKey): boolean {
  return tasks.some((t) => t.templateKey === key && !t.completed);
}

function statusAtLeast(status: RequestStatus, baseline: RequestStatus): boolean {
  if (status === "lost") return false;
  return getStateIndex(status) >= getStateIndex(baseline);
}

function quotationSent(lead: Request): boolean {
  return lead.quotations.some(
    (q) => q.status === "sent_to_patient" || q.status === "accepted",
  );
}

function patchTask(
  task: RequestTask,
  at: string,
  resolution: RequestTaskResolution,
  reason: RequestTaskCompletedReason,
): RequestTask {
  return {
    ...task,
    completed: true,
    resolution,
    completedReason: reason,
    updatedAt: at,
  };
}

function spawnTask(
  key: RequestTaskTemplateKey,
  at: string,
  assigneeId?: string,
  dueAt?: string,
): RequestTask {
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
export function computeRequestQualificationDueAt(
  lead: Request,
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

function syncOpenRequestQualificationDueTasks(
  tasks: RequestTask[],
  lead: Request,
  at: string,
  slaHours: number,
): { tasks: RequestTask[]; modified: boolean } {
  let modified = false;
  const sla = clampLeadQualificationSlaHours(slaHours);
  const next = tasks.map((task) => {
    if (task.templateKey !== "lead_qualification" || task.completed) return task;
    const nextDue = computeRequestQualificationDueAt(lead, task.createdAt, sla);
    const curMs = task.dueAt ? Date.parse(task.dueAt) : NaN;
    const nextMs = Date.parse(nextDue);
    if (curMs === nextMs) return task;
    modified = true;
    return { ...task, dueAt: nextDue, updatedAt: at };
  });
  return { tasks: modified ? next : tasks, modified };
}

export function ensureSystemTasks(lead: Request, at: string): Request {
  const settings = getCrmSettingsSync();
  let tasks = [...lead.tasks];
  let changed = false;
  const slaHours = clampLeadQualificationSlaHours(
    settings.taskRules.leadQualificationSlaHours,
  );

  const pushIf = (
    key: RequestTaskTemplateKey,
    condition: boolean,
    assigneeId?: string,
  ) => {
    if (!condition || hasOpenTemplate(tasks, key)) return;
    const dueAt =
      key === "lead_qualification"
        ? computeRequestQualificationDueAt(lead, at, slaHours)
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

    if (st === "interested" && qualDone) {
      pushIf("await_patient_estimate", true, REQUEST_PATIENT_ASSIGNEE_ID);
    }
  }

  if (st === "quotation_sent" && quotationSent(lead)) {
    pushIf("await_patient_quote_response", true, REQUEST_PATIENT_ASSIGNEE_ID);
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

  const synced = syncOpenRequestQualificationDueTasks(tasks, lead, at, slaHours);
  if (synced.modified) {
    tasks = synced.tasks;
    changed = true;
  }

  return changed ? { ...lead, tasks } : lead;
}

export function resolveRequestTasksAfterRequestChange(
  _prev: Request,
  next: Request,
  at: string,
): Request {
  let tasks = next.tasks.map((t) => ({ ...t }));

  if (next.status === "lost") {
    tasks = tasks.map((task) => {
      if (task.completed || !isSystemTask(task)) return task;
      return patchTask(task, at, "cancelled", "request_rejected");
    });
    return { ...next, tasks };
  }

  tasks = tasks.map((task) => {
    if (task.completed || !isSystemTask(task) || !task.templateKey) return task;

    const key = task.templateKey;

    if (key === "lead_qualification" && next.status !== "new") {
      return patchTask(task, at, "completed_rule", "status_transition");
    }
    if (key === "await_patient_estimate" && next.status !== "interested") {
      return patchTask(task, at, "completed_rule", "patient_action");
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
    if (key === "await_patient_quote_response" && next.status !== "quotation_sent") {
      return patchTask(task, at, "completed_rule", "patient_action");
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

export function processRequestTasks(prev: Request, next: Request, at: string): Request {
  const ensured = ensureSystemTasks(next, at);
  return resolveRequestTasksAfterRequestChange(prev, ensured, at);
}

/**
 * Statuses each system-task template "lives in" — the statuses where it can
 * legitimately be open. Used by {@link reconcileSystemTasksAfterStatusJump} to
 * cancel tasks orphaned by a direct `SET_STATUS` override (forward or backward).
 */
export const TEMPLATE_HOME_STATUSES: Record<RequestTaskTemplateKey, RequestStatus[]> = {
  lead_qualification: [
    "new",
    "interested",
    "estimate_requested",
    "estimate_reviewed",
    "changes_requested",
    "quotation_sent",
  ],
  await_patient_estimate: ["interested"],
  collect_documents: [
    "interested",
    "estimate_requested",
    "estimate_reviewed",
    "changes_requested",
    "quotation_sent",
  ],
  initial_consultation: [
    "interested",
    "estimate_requested",
    "estimate_reviewed",
    "changes_requested",
    "quotation_sent",
  ],
  consultant_review: [
    "estimate_requested",
    "estimate_reviewed",
    "changes_requested",
  ],
  prepare_quotation: [
    "estimate_requested",
    "estimate_reviewed",
    "changes_requested",
  ],
  await_patient_quote_response: ["quotation_sent"],
  send_contract: ["quotation_sent", "changes_requested", "arrived"],
  confirm_payment: ["quotation_accepted"],
  create_order: ["quotation_accepted"],
  assign_specialist: ["booking"],
  treatment_followup: ["in_treatment"],
};

/**
 * Cancel any open system task whose template's "home" no longer includes the
 * lead's new status, then ensure the new status's tasks exist. Use this after a
 * direct `applySetStatus` jump (forward or backward); manual tasks are left
 * untouched. Previously-completed tasks are not reopened on backward skips.
 */
export function reconcileSystemTasksAfterStatusJump(
  prev: Request,
  next: Request,
  at: string,
): Request {
  const tasks = next.tasks.map((task) => {
    if (task.completed) return task;
    if (!isSystemTask(task) || !task.templateKey) return task;
    const home = TEMPLATE_HOME_STATUSES[task.templateKey];
    if (home && home.includes(next.status)) return task;
    return patchTask(task, at, "cancelled", "status_skipped");
  });

  const reconciled: Request = { ...next, tasks };
  if (next.status === "lost") {
    return reconciled;
  }
  return ensureSystemTasks(reconciled, at);
}

export function listRequestTaskTemplateKeys(): RequestTaskTemplateKey[] {
  return [
    "lead_qualification",
    "await_patient_estimate",
    "collect_documents",
    "initial_consultation",
    "consultant_review",
    "prepare_quotation",
    "await_patient_quote_response",
    "send_contract",
    "confirm_payment",
    "create_order",
    "assign_specialist",
    "treatment_followup",
  ];
}
