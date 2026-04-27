import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildCrmTodayDigest } from "./crm-today-digest";
import type { Lead } from "@/types";

const ORDER = ["cs_alpha", "cs_beta"] as const;

describe("buildCrmTodayDigest", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 3, 9, 12, 0, 0)));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("groups appointments on the same local day and tasks due by end of today", () => {
    const now = new Date();
    const sameDay = (h: number, mi: number) =>
      new Date(Date.UTC(2026, 3, 9, h, mi, 0, 0)).toISOString();
    const prevDay = (h: number, mi: number) =>
      new Date(Date.UTC(2026, 3, 8, h, mi, 0, 0)).toISOString();
    const nextDay = (h: number, mi: number) =>
      new Date(Date.UTC(2026, 3, 10, h, mi, 0, 0)).toISOString();

    const lead: Lead = {
      id: "lead_x",
      patientId: "p1",
      patientName: "Test Patient",
      patientPhone: "+10000000000",
      patientCountry: "US",
      treatmentSlug: "joint-replacement",
      clientType: "b2c",
      status: "interested",
      ownerId: "cs_alpha",
      documents: [],
      quotations: [],
      tasks: [],
      appointments: [],
      statusHistory: [],
      createdAt: prevDay(10, 0),
      updatedAt: prevDay(10, 0),
    };

    const withAppt: Lead = {
      ...lead,
      appointments: [
        {
          id: "a1",
          leadId: "lead_x",
          kind: "online_meeting",
          startsAt: sameDay(14, 30),
          meetingUrl: "https://x.test/m",
          title: "Sync",
          createdAt: prevDay(10, 0),
        },
      ],
      tasks: [
        {
          id: "t_overdue",
          title: "Old",
          completed: false,
          dueAt: prevDay(9, 0),
          assigneeId: "cs_alpha",
          createdAt: prevDay(9, 0),
          updatedAt: prevDay(9, 0),
        },
        {
          id: "t_tomorrow",
          title: "Future",
          completed: false,
          dueAt: nextDay(9, 0),
          assigneeId: "cs_alpha",
          createdAt: prevDay(9, 0),
          updatedAt: prevDay(9, 0),
        },
      ],
    };

    const d = buildCrmTodayDigest([withAppt], {
      now,
      memberOrder: ORDER,
    });

    expect(d.buckets).toHaveLength(1);
    expect(d.buckets[0].memberId).toBe("cs_alpha");
    expect(d.buckets[0].appointments).toHaveLength(1);
    expect(d.buckets[0].appointments[0].label).toBe("Sync");
    expect(d.buckets[0].tasks).toHaveLength(1);
    expect(d.buckets[0].tasks[0].overdue).toBe(true);
  });
});
