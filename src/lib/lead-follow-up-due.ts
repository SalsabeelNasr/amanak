/**
 * CRM lead “follow-up due”: earliest commitment among open tasks (due dates),
 * appointments (start times), and an optional manual reminder.
 */
import type { FollowUpDueHistoryEntry, Request, MockUser } from "@/types";

const DEFAULT_FOLLOW_UP_ACTOR: MockUser = {
  id: "crm_pipeline",
  name: "CRM",
  role: "admin",
  email: "crm@amanak.internal",
};

function instantKey(iso: string | undefined): string | null {
  if (iso === undefined) return null;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  return String(ms);
}

/** Earliest ISO instant among tasks (incomplete + dueAt), appointments (startsAt), manual reminder. */
export function computeRequestFollowUpDueAt(lead: Request): string | undefined {
  const instants: number[] = [];
  for (const task of lead.tasks) {
    if (task.completed) continue;
    if (!task.dueAt) continue;
    const ms = Date.parse(task.dueAt);
    if (!Number.isNaN(ms)) instants.push(ms);
  }
  for (const appt of lead.appointments) {
    const ms = Date.parse(appt.startsAt);
    if (!Number.isNaN(ms)) instants.push(ms);
  }
  if (lead.followUpDueManualAt) {
    const ms = Date.parse(lead.followUpDueManualAt);
    if (!Number.isNaN(ms)) instants.push(ms);
  }
  if (instants.length === 0) return undefined;
  return new Date(Math.min(...instants)).toISOString();
}

export function followUpDueInstantChanged(
  prev: string | undefined,
  next: string | undefined,
): boolean {
  return instantKey(prev) !== instantKey(next);
}

/**
 * Persists {@link Request.followUpDueAt} from {@link computeRequestFollowUpDueAt} and appends
 * {@link Request.followUpDueHistory} when the aggregated instant changes vs `prev`.
 */
export function applyFollowUpDueSync(
  prev: Request,
  next: Request,
  ts: string,
  actor?: MockUser,
): Request {
  const computed = computeRequestFollowUpDueAt(next);
  const prevComputed = computeRequestFollowUpDueAt(prev);
  const resolvedActor = actor ?? DEFAULT_FOLLOW_UP_ACTOR;

  const withDue: Request = { ...next, followUpDueAt: computed };

  if (!followUpDueInstantChanged(prevComputed, computed)) {
    return withDue;
  }

  const entry: FollowUpDueHistoryEntry = {
    previousFollowUpDueAt: prevComputed,
    nextFollowUpDueAt: computed,
    timestamp: ts,
    actorRole: resolvedActor.role,
    actorId: resolvedActor.id,
  };

  return {
    ...withDue,
    followUpDueHistory: [...(prev.followUpDueHistory ?? []), entry],
  };
}
