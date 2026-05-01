/**
 * Pure builder that turns a {@link Lead} into a chronologically ordered list of
 * timeline rows for the unified lead overview (tasks + appointments + status
 * history + follow-up changes + journey stages + conversations + document uploads).
 *
 * Pure functions only; UI (LeadTimeline) renders these rows. Tests pin the
 * bucketing & ordering rules.
 */
import type {
  FollowUpDueHistoryEntry,
  Lead,
  LeadAppointment,
  LeadConversationItem,
  LeadDocument,
  LeadJourneyStage,
  LeadStatus,
  LeadTask,
  StatusHistoryEntry,
} from "@/types";
import {
  ORDERED_JOURNEY_STAGES,
  firstEnteredJourneyStageTimestamps,
  getJourneyStageIndex,
  journeyStageFromStatus,
} from "@/lib/lead-journey-stage";

export type LeadTimelineBucket = "upcoming" | "now" | "history";

export type LeadTimelineRow =
  | {
      kind: "task";
      bucket: LeadTimelineBucket;
      sortAt: number;
      task: LeadTask;
      isOverdue: boolean;
    }
  | {
      kind: "appointment";
      bucket: LeadTimelineBucket;
      sortAt: number;
      appointment: LeadAppointment;
    }
  | {
      kind: "status";
      bucket: "history";
      sortAt: number;
      entry: StatusHistoryEntry;
    }
  | {
      kind: "follow-up";
      bucket: "history";
      sortAt: number;
      entry: FollowUpDueHistoryEntry;
    }
  | {
      kind: "journey-stage";
      bucket: LeadTimelineBucket;
      sortAt: number;
      stage: LeadJourneyStage;
      reachedAt?: string;
      state: "completed" | "current" | "future";
    }
  | {
      kind: "conversation";
      bucket: "history";
      sortAt: number;
      conversation: LeadConversationItem;
    }
  | {
      kind: "document";
      bucket: "history";
      sortAt: number;
      document: LeadDocument;
    };

const FUTURE_STAGE_BASE = Number.MAX_SAFE_INTEGER - 10_000;

/** When the row should sort in the feed (completion instant for closed tasks). */
export function taskTimelineSortAt(task: LeadTask): number {
  if (task.completed) {
    return timeOf(task.updatedAt, timeOf(task.createdAt, 0));
  }
  const sortBase = task.dueAt ?? task.updatedAt ?? task.createdAt;
  return timeOf(sortBase, 0);
}

function timeOf(iso: string | undefined, fallback: number): number {
  if (!iso) return fallback;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? fallback : t;
}

/**
 * Categorize a (possibly-completed) task into a bucket. Active tasks with a
 * future `dueAt` cluster in upcoming, overdue active tasks land in `now`,
 * everything else (no due, completed, cancelled) goes into history.
 */
function bucketForTask(task: LeadTask, nowMs: number): LeadTimelineBucket {
  if (task.completed) return "history";
  if (!task.dueAt) return "history";
  const due = Date.parse(task.dueAt);
  if (Number.isNaN(due)) return "history";
  return due < nowMs ? "now" : "upcoming";
}

function bucketForAppointment(
  appt: LeadAppointment,
  nowMs: number,
): LeadTimelineBucket {
  const t = Date.parse(appt.startsAt);
  if (Number.isNaN(t)) return "history";
  return t >= nowMs ? "upcoming" : "history";
}

/**
 * Build all rows for the unified timeline. Returned list is sorted newest-first
 * within each bucket; render order is `upcoming` (top, ordered farthest →
 * soonest), `now`, then `history` (most recent first).
 */
export type BuildLeadTimelineRowsOptions = {
  /** Full feed for this lead (overview should pass the unfiltered list). */
  conversations?: readonly LeadConversationItem[];
};

export function buildLeadTimelineRows(
  lead: Lead,
  nowMs: number,
  options?: BuildLeadTimelineRowsOptions,
): LeadTimelineRow[] {
  const rows: LeadTimelineRow[] = [];

  for (const task of lead.tasks) {
    const sortAt = taskTimelineSortAt(task);
    const bucket = bucketForTask(task, nowMs);
    const isOverdue =
      !task.completed &&
      !!task.dueAt &&
      Date.parse(task.dueAt) < nowMs;
    rows.push({ kind: "task", bucket, sortAt, task, isOverdue });
  }

  for (const appointment of lead.appointments) {
    rows.push({
      kind: "appointment",
      bucket: bucketForAppointment(appointment, nowMs),
      sortAt: timeOf(appointment.startsAt, 0),
      appointment,
    });
  }

  for (const entry of lead.statusHistory) {
    rows.push({
      kind: "status",
      bucket: "history",
      sortAt: timeOf(entry.timestamp, 0),
      entry,
    });
  }

  for (const entry of lead.followUpDueHistory ?? []) {
    rows.push({
      kind: "follow-up",
      bucket: "history",
      sortAt: timeOf(entry.timestamp, 0),
      entry,
    });
  }

  const conv = options?.conversations;
  if (conv?.length) {
    for (const conversation of conv) {
      rows.push({
        kind: "conversation",
        bucket: "history",
        sortAt: timeOf(conversation.occurredAt, 0),
        conversation,
      });
    }
  }

  for (const document of lead.documents) {
    if (!document.uploadedAt) continue;
    if (document.status === "pending") continue;
    rows.push({
      kind: "document",
      bucket: "history",
      sortAt: timeOf(document.uploadedAt, 0),
      document,
    });
  }

  pushJourneyStageRows(lead, rows);

  return sortTimelineRows(rows);
}

function pushJourneyStageRows(lead: Lead, rows: LeadTimelineRow[]): void {
  if (lead.status === "lost") {
    return;
  }
  const stageTimes = firstEnteredJourneyStageTimestamps(lead);
  const currentStage = journeyStageFromStatus(lead.status);
  const currentIndex = getJourneyStageIndex(currentStage);

  ORDERED_JOURNEY_STAGES.forEach((stage, idx) => {
    const reachedAt = stageTimes[stage];
    if (idx < currentIndex) {
      rows.push({
        kind: "journey-stage",
        bucket: "history",
        sortAt: timeOf(reachedAt, 0),
        stage,
        reachedAt,
        state: "completed",
      });
    } else if (idx === currentIndex) {
      rows.push({
        kind: "journey-stage",
        bucket: "now",
        sortAt: timeOf(reachedAt, Date.now()),
        stage,
        reachedAt,
        state: "current",
      });
    } else {
      rows.push({
        kind: "journey-stage",
        bucket: "upcoming",
        // Future stages cluster at the very top, in pipeline order.
        sortAt: FUTURE_STAGE_BASE + idx,
        stage,
        reachedAt: undefined,
        state: "future",
      });
    }
  });
}

/**
 * Sort rows so that calling code can render bucket-by-bucket without resorting:
 * upcoming (farthest-future first → soonest), then now, then history (most
 * recent first).
 */
export function sortTimelineRows(
  rows: LeadTimelineRow[],
): LeadTimelineRow[] {
  const bucketOrder: Record<LeadTimelineBucket, number> = {
    upcoming: 0,
    now: 1,
    history: 2,
  };
  return [...rows].sort((a, b) => {
    const bo = bucketOrder[a.bucket] - bucketOrder[b.bucket];
    if (bo !== 0) return bo;
    if (a.bucket === "upcoming") {
      return b.sortAt - a.sortAt;
    }
    if (a.bucket === "history") {
      return b.sortAt - a.sortAt;
    }
    return b.sortAt - a.sortAt;
  });
}

export function partitionTimelineRowsByBucket(rows: LeadTimelineRow[]): {
  upcoming: LeadTimelineRow[];
  now: LeadTimelineRow[];
  history: LeadTimelineRow[];
} {
  const upcoming: LeadTimelineRow[] = [];
  const now: LeadTimelineRow[] = [];
  const history: LeadTimelineRow[] = [];
  for (const row of rows) {
    if (row.bucket === "upcoming") upcoming.push(row);
    else if (row.bucket === "now") now.push(row);
    else history.push(row);
  }
  return { upcoming, now, history };
}

/** Convenience used by tests + UI to detect a wholly empty timeline. */
export function isEmptyLeadTimeline(rows: LeadTimelineRow[]): boolean {
  return rows.length === 0;
}

/** Re-exported for consumers (UI legend and tests). */
export type { LeadStatus };
