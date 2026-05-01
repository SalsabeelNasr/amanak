import { describe, expect, it } from "vitest";
import {
  buildLeadTimelineRows,
  partitionTimelineRowsByBucket,
  taskTimelineSortAt,
} from "./lead-timeline-events";
import type {
  FollowUpDueHistoryEntry,
  Lead,
  LeadAppointment,
  LeadConversationItem,
  LeadTask,
  StatusHistoryEntry,
} from "@/types";

const NOW = Date.parse("2025-06-15T12:00:00Z");

function task(overrides: Partial<LeadTask> & Pick<LeadTask, "id">): LeadTask {
  return {
    title: overrides.title ?? overrides.id,
    completed: false,
    createdAt: overrides.createdAt ?? "2025-01-01T00:00:00Z",
    updatedAt: overrides.updatedAt ?? "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function statusEntry(
  overrides: Partial<StatusHistoryEntry> & Pick<StatusHistoryEntry, "from" | "to" | "timestamp">,
): StatusHistoryEntry {
  return {
    action: "BEGIN_INTAKE",
    actorRole: "cs",
    actorId: "cs_1",
    ...overrides,
  };
}

function followUp(
  overrides: Partial<FollowUpDueHistoryEntry> & Pick<FollowUpDueHistoryEntry, "timestamp">,
): FollowUpDueHistoryEntry {
  return {
    actorRole: "cs",
    actorId: "cs_1",
    ...overrides,
  };
}

function makeLead(partial: Partial<Lead>): Lead {
  return {
    id: "lead_test",
    patientId: "patient_test",
    treatmentSlug: "joint-replacement",
    recordType: "request",
    status: "interested",
    statusHistory: [],
    followUpDueHistory: [],
    tasks: [],
    appointments: [],
    documents: [],
    quotations: [],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    ...partial,
  };
}

describe("buildLeadTimelineRows", () => {
  it("buckets active future tasks as upcoming and overdue tasks as now", () => {
    const lead = makeLead({
      tasks: [
        task({
          id: "t_future",
          dueAt: "2025-06-20T12:00:00Z",
        }),
        task({
          id: "t_overdue",
          dueAt: "2025-06-10T12:00:00Z",
        }),
        task({
          id: "t_done",
          completed: true,
          dueAt: "2025-05-10T12:00:00Z",
          updatedAt: "2025-05-11T00:00:00Z",
        }),
      ],
    });

    const rows = buildLeadTimelineRows(lead, NOW);
    const { upcoming, now, history } = partitionTimelineRowsByBucket(rows);

    expect(upcoming.some((r) => r.kind === "task" && r.task.id === "t_future")).toBe(true);
    expect(now.some((r) => r.kind === "task" && r.task.id === "t_overdue")).toBe(true);
    expect(history.some((r) => r.kind === "task" && r.task.id === "t_done")).toBe(true);
  });

  it("places future appointments in upcoming and past appointments in history", () => {
    const future: LeadAppointment = {
      id: "appt_future",
      requestId: "lead_test",
      kind: "online_meeting",
      startsAt: "2025-07-01T15:00:00Z",
      meetingUrl: "https://example.com",
      createdAt: "2025-06-01T00:00:00Z",
    };
    const past: LeadAppointment = {
      id: "appt_past",
      requestId: "lead_test",
      kind: "treatment",
      startsAt: "2025-04-01T15:00:00Z",
      locationLabel: "Hospital",
      createdAt: "2025-03-01T00:00:00Z",
    };
    const lead = makeLead({ appointments: [future, past] });
    const rows = buildLeadTimelineRows(lead, NOW);
    const { upcoming, history } = partitionTimelineRowsByBucket(rows);

    expect(upcoming.some((r) => r.kind === "appointment" && r.appointment.id === "appt_future")).toBe(true);
    expect(history.some((r) => r.kind === "appointment" && r.appointment.id === "appt_past")).toBe(true);
  });

  it("places status and follow-up history rows in history newest-first", () => {
    const lead = makeLead({
      statusHistory: [
        statusEntry({
          from: "new",
          to: "interested",
          action: "BEGIN_INTAKE",
          timestamp: "2025-05-01T00:00:00Z",
        }),
        statusEntry({
          from: "interested",
          to: "estimate_requested",
          action: "SET_STATUS",
          timestamp: "2025-05-15T00:00:00Z",
          note: "manual override",
        }),
      ],
      followUpDueHistory: [
        followUp({
          previousFollowUpDueAt: "2025-04-01T00:00:00Z",
          nextFollowUpDueAt: "2025-04-10T00:00:00Z",
          timestamp: "2025-04-01T00:00:00Z",
        }),
      ],
    });
    const rows = buildLeadTimelineRows(lead, NOW);
    const historyOnly = rows.filter((r) => r.bucket === "history");

    const statusIndices = historyOnly
      .map((r, i) => (r.kind === "status" ? i : -1))
      .filter((i) => i >= 0);
    expect(statusIndices.length).toBe(2);
    expect(statusIndices[0]).toBeLessThan(statusIndices[1]);
    const firstStatus = historyOnly[statusIndices[0]];
    if (firstStatus.kind === "status") {
      expect(firstStatus.entry.action).toBe("SET_STATUS");
    }
  });

  it("emits journey stages: completed in history, current in now, future in upcoming", () => {
    const lead = makeLead({
      status: "booking",
      statusHistory: [
        statusEntry({
          from: "new",
          to: "interested",
          action: "BEGIN_INTAKE",
          timestamp: "2025-02-01T00:00:00Z",
        }),
        statusEntry({
          from: "interested",
          to: "estimate_requested",
          action: "SUBMIT_ESTIMATE",
          timestamp: "2025-03-01T00:00:00Z",
        }),
        statusEntry({
          from: "estimate_requested",
          to: "quotation_sent",
          action: "DELIVER_QUOTATION",
          timestamp: "2025-04-01T00:00:00Z",
        }),
        statusEntry({
          from: "quotation_sent",
          to: "quotation_accepted",
          action: "PATIENT_ACCEPTS_QUOTATION",
          timestamp: "2025-05-01T00:00:00Z",
        }),
        statusEntry({
          from: "quotation_accepted",
          to: "booking",
          action: "START_BOOKING",
          timestamp: "2025-05-15T00:00:00Z",
        }),
      ],
    });
    const rows = buildLeadTimelineRows(lead, NOW);
    const { upcoming, now, history } = partitionTimelineRowsByBucket(rows);

    expect(now.some((r) => r.kind === "journey-stage" && r.state === "current")).toBe(true);
    expect(upcoming.filter((r) => r.kind === "journey-stage" && r.state === "future").length).toBeGreaterThan(0);
    expect(history.some((r) => r.kind === "journey-stage" && r.state === "completed")).toBe(true);
  });

  it("future stages cluster at the top, ordered by pipeline order", () => {
    const lead = makeLead({ status: "interested" });
    const rows = buildLeadTimelineRows(lead, NOW);
    const upcomingFuture = rows.filter(
      (r) => r.kind === "journey-stage" && r.state === "future",
    );
    expect(upcomingFuture.length).toBeGreaterThan(0);
    const sortAts = upcomingFuture.map((r) => r.sortAt);
    const sorted = [...sortAts].sort((a, b) => b - a);
    expect(sortAts).toEqual(sorted);
  });

  it("omits journey stages when status is lost", () => {
    const lead = makeLead({
      status: "lost",
      statusHistory: [
        statusEntry({
          from: "interested",
          to: "lost",
          action: "MARK_LOST",
          timestamp: "2025-06-10T00:00:00Z",
          note: "patient unresponsive",
        }),
      ],
    });
    const rows = buildLeadTimelineRows(lead, NOW);
    expect(rows.every((r) => r.kind !== "journey-stage")).toBe(true);
    expect(rows.some((r) => r.kind === "status")).toBe(true);
  });

  it("orders closed tasks by completion time (updatedAt), not original due date", () => {
    const older = task({
      id: "closed_older",
      completed: true,
      dueAt: "2025-12-31T12:00:00Z",
      updatedAt: "2025-06-01T12:00:00Z",
      createdAt: "2025-01-01T00:00:00Z",
    });
    const newer = task({
      id: "closed_newer",
      completed: true,
      dueAt: "2025-01-01T12:00:00Z",
      updatedAt: "2025-06-10T12:00:00Z",
      createdAt: "2025-01-01T00:00:00Z",
    });
    expect(taskTimelineSortAt(newer)).toBeGreaterThan(taskTimelineSortAt(older));
  });

  it("merges conversation items when options.conversations is set", () => {
    const conv: LeadConversationItem = {
      id: "conv_timeline_1",
      requestId: "lead_test",
      channel: "whatsapp",
      occurredAt: "2025-06-10T12:00:00Z",
      direction: "inbound",
      body: "Patient message",
    };
    const rows = buildLeadTimelineRows(makeLead({}), NOW, { conversations: [conv] });
    expect(
      rows.some((r) => r.kind === "conversation" && r.conversation.id === "conv_timeline_1"),
    ).toBe(true);
  });

  it("includes uploaded or verified documents on the timeline", () => {
    const uploaded = {
      id: "doc_t_uploaded",
      type: "passport" as const,
      name: "passport.pdf",
      mandatory: false,
      status: "uploaded" as const,
      uploadedAt: "2025-05-02T10:00:00.000Z",
    };
    const pendingDoc = {
      id: "doc_t_pending",
      type: "visa" as const,
      name: "visa.pdf",
      mandatory: false,
      status: "pending" as const,
      uploadedAt: "2025-05-03T10:00:00.000Z",
    };
    const lead = makeLead({ documents: [uploaded, pendingDoc] });
    const rows = buildLeadTimelineRows(lead, NOW);
    expect(rows.some((r) => r.kind === "document" && r.document.id === "doc_t_uploaded")).toBe(
      true,
    );
    expect(rows.some((r) => r.kind === "document" && r.document.id === "doc_t_pending")).toBe(
      false,
    );
  });
});
