import type { Lead, LeadAppointment } from "@/types";

export type CrmTodayAppointmentItem = {
  leadId: string;
  patientName: string;
  appointmentId: string;
  kind: LeadAppointment["kind"];
  startsAt: string;
  label: string;
};

export type CrmTodayTaskItem = {
  leadId: string;
  patientName: string;
  taskId: string;
  title: string;
  dueAt: string;
  overdue: boolean;
};

export type CrmTodayMemberBucket = {
  /** CRM person id for this Today section (task assignee and/or lead owner fallback). */
  memberId: string;
  appointments: CrmTodayAppointmentItem[];
  tasks: CrmTodayTaskItem[];
};

export type CrmTodayDigest = {
  generatedAt: string;
  buckets: CrmTodayMemberBucket[];
};

const UNASSIGNED = "__unassigned__";

function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function endOfLocalDay(now: Date): number {
  return startOfLocalDay(now) + 24 * 60 * 60 * 1000 - 1;
}

function isOnLocalDay(iso: string, now: Date): boolean {
  const t = new Date(iso).getTime();
  const s = startOfLocalDay(now);
  const e = endOfLocalDay(now);
  return t >= s && t <= e;
}

/** Open tasks due by end of today (local), including overdue. */
function isDueTodayOrOverdue(iso: string, now: Date): boolean {
  return new Date(iso).getTime() <= endOfLocalDay(now);
}

function appointmentLabel(_lead: Lead, appt: LeadAppointment): string {
  switch (appt.kind) {
    case "treatment":
      return appt.locationLabel;
    case "online_meeting":
      return appt.title?.trim() || appt.meetingUrl;
    case "team_consultation":
      return "";
  }
}

function resolveAppointmentMemberId(lead: Lead, appt: LeadAppointment): string {
  if (appt.kind === "team_consultation") {
    const task = lead.tasks.find((x) => x.id === appt.linkedTaskId);
    return (
      task?.assigneeId ??
      lead.ownerId ??
      lead.assignedConsultantId ??
      UNASSIGNED
    );
  }
  return lead.ownerId ?? lead.assignedConsultantId ?? UNASSIGNED;
}

function resolveTaskMemberId(lead: Lead, task: { assigneeId?: string }): string {
  return (
    task.assigneeId ??
    lead.ownerId ??
    lead.assignedConsultantId ??
    UNASSIGNED
  );
}

function memberRank(id: string, memberOrder: readonly string[]): number {
  const idx = memberOrder.indexOf(id);
  if (idx >= 0) return idx;
  return id === UNASSIGNED ? 1000 : 999;
}

export type BuildCrmTodayDigestOptions = {
  now?: Date;
  /** CRM person ids — controls section order on the Today board. */
  memberOrder: readonly string[];
};

/**
 * Appointments starting today (local) and open tasks due today or overdue, grouped by teammate.
 */
export function buildCrmTodayDigest(
  leads: readonly Lead[],
  options: BuildCrmTodayDigestOptions,
): CrmTodayDigest {
  const now = options.now ?? new Date();
  const memberOrder = options.memberOrder;
  const map = new Map<
    string,
    { appointments: CrmTodayAppointmentItem[]; tasks: CrmTodayTaskItem[] }
  >();

  function ensure(id: string) {
    let b = map.get(id);
    if (!b) {
      b = { appointments: [], tasks: [] };
      map.set(id, b);
    }
    return b;
  }

  for (const lead of leads) {
    for (const appt of lead.appointments) {
      if (!isOnLocalDay(appt.startsAt, now)) continue;
      const memberId = resolveAppointmentMemberId(lead, appt);
      ensure(memberId).appointments.push({
        leadId: lead.id,
        patientName: lead.patientName,
        appointmentId: appt.id,
        kind: appt.kind,
        startsAt: appt.startsAt,
        label: appointmentLabel(lead, appt),
      });
    }

    for (const task of lead.tasks) {
      if (task.completed || !task.dueAt) continue;
      if (!isDueTodayOrOverdue(task.dueAt, now)) continue;
      const memberId = resolveTaskMemberId(lead, task);
      const overdue = new Date(task.dueAt).getTime() < startOfLocalDay(now);
      ensure(memberId).tasks.push({
        leadId: lead.id,
        patientName: lead.patientName,
        taskId: task.id,
        title: task.title,
        dueAt: task.dueAt,
        overdue,
      });
    }
  }

  for (const b of map.values()) {
    b.appointments.sort(
      (a, c) => new Date(a.startsAt).getTime() - new Date(c.startsAt).getTime(),
    );
    b.tasks.sort(
      (a, c) => new Date(a.dueAt).getTime() - new Date(c.dueAt).getTime(),
    );
  }

  const buckets: CrmTodayMemberBucket[] = [...map.entries()]
    .filter(([, v]) => v.appointments.length > 0 || v.tasks.length > 0)
    .map(([memberId, v]) => ({
      memberId,
      appointments: v.appointments,
      tasks: v.tasks,
    }))
    .sort(
      (a, b) =>
        memberRank(a.memberId, memberOrder) - memberRank(b.memberId, memberOrder),
    );

  return { generatedAt: now.toISOString(), buckets };
}
