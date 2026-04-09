/**
 * Mock consultation scheduling. Replace internals with HTTP when API exists.
 */
import type {
  BookConsultationPayload,
  ConsultantProfile,
  ConsultationSlot,
} from "@/types";
import { applyMockDelay } from "./mock-delay";

const BOOKED_SLOT_IDS = new Set<string>();

function utcDaysInclusive(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  let t = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const end = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  while (t <= end) {
    days.push(new Date(t));
    t += 86_400_000;
  }
  return days;
}

/** Few fixed slots per weekday (UTC) — tune when wiring a real scheduler. */
const SLOT_STARTS_UTC: readonly [hour: number, minute: number][] = [
  [10, 0],
  [13, 0],
  [15, 30],
  [17, 0],
];

function buildSlotsForDay(dayUtc: Date): ConsultationSlot[] {
  const y = dayUtc.getUTCFullYear();
  const mo = dayUtc.getUTCMonth();
  const d = dayUtc.getUTCDate();
  return SLOT_STARTS_UTC.map(([h, m]) => {
    const startsAt = new Date(Date.UTC(y, mo, d, h, m, 0, 0));
    const id = `slot_${startsAt.toISOString().replace(/[:.]/g, "-")}`;
    return { id, startsAt: startsAt.toISOString() };
  });
}

function generateMockSlots(from: Date, to: Date): ConsultationSlot[] {
  const out: ConsultationSlot[] = [];
  for (const day of utcDaysInclusive(from, to)) {
    const dow = day.getUTCDay();
    if (dow === 0 || dow === 6) continue;
    out.push(...buildSlotsForDay(day));
  }
  return out;
}

/** Resolve a generated slot id to its instant (CRM validation; does not book the slot). */
export function resolveConsultationSlotById(
  slotId: string,
): ConsultationSlot | undefined {
  const now = new Date();
  const from = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const to = new Date(from.getTime() + 400 * 86_400_000);
  return generateMockSlots(from, to).find((s) => s.id === slotId);
}

export async function getConsultantProfile(options?: {
  simulateDelay?: boolean;
}): Promise<ConsultantProfile> {
  await applyMockDelay(options?.simulateDelay);
  return {
    id: "consultant_mm",
    nameKey: "consultant.name",
    titleKey: "consultant.title",
    imageSrc: "/consultants/mohamed-mostafa.png",
  };
}

export async function listAvailableSlots(
  range: { from: Date; to: Date },
  options?: { simulateDelay?: boolean },
): Promise<ConsultationSlot[]> {
  await applyMockDelay(options?.simulateDelay);
  const all = generateMockSlots(range.from, range.to);
  return all.filter((s) => !BOOKED_SLOT_IDS.has(s.id));
}

export async function bookConsultation(
  payload: BookConsultationPayload,
  options?: { simulateDelay?: boolean },
): Promise<{ ok: true; id: string } | { ok: false; error: "slot_unavailable" }> {
  await applyMockDelay(options?.simulateDelay, 600);
  if (process.env.NEXT_PUBLIC_USE_MOCK_API !== "true") {
    console.warn(
      "bookConsultation: API not wired; set NEXT_PUBLIC_USE_MOCK_API=true",
    );
  }

  const now = new Date();
  const from = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const to = new Date(from.getTime() + 400 * 86_400_000);
  const known = generateMockSlots(from, to);
  const match = known.find((s) => s.id === payload.slotId);

  if (!match || BOOKED_SLOT_IDS.has(payload.slotId)) {
    return { ok: false, error: "slot_unavailable" };
  }

  BOOKED_SLOT_IDS.add(payload.slotId);
  return { ok: true, id: `book_${Date.now()}` };
}
