import type { PatientPendingFollowUp, PatientPendingFollowUpStatus } from "@/types";

const STORAGE_KEY = "amanak_patient_pending_followups_v1";

export const PATIENT_PENDING_FOLLOWUPS_EVENT = "amanak-pending-followups-updated";

const EMPTY: PatientPendingFollowUp[] = [];
let cachedRaw: string | null | undefined;
let cached: PatientPendingFollowUp[] = EMPTY;

function parseStored(): PatientPendingFollowUp[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as PatientPendingFollowUp[];
  } catch {
    return [];
  }
}

export function listPatientPendingFollowUps(): PatientPendingFollowUp[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cached;
    cachedRaw = raw;
    if (!raw) {
      cached = EMPTY;
      return cached;
    }
    const parsed: unknown = JSON.parse(raw);
    cached = Array.isArray(parsed) ? (parsed as PatientPendingFollowUp[]) : EMPTY;
    return cached;
  } catch {
    cachedRaw = null;
    cached = EMPTY;
    return cached;
  }
}

export function listOpenPendingFollowUpsForLead(leadId: string): PatientPendingFollowUp[] {
  return listPatientPendingFollowUps().filter((row) => row.leadId === leadId && row.status === "open");
}

export function notifyPatientPendingFollowUpsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PATIENT_PENDING_FOLLOWUPS_EVENT));
}

export function addPatientPendingFollowUp(
  input: Omit<PatientPendingFollowUp, "id" | "createdAt" | "status"> & {
    status?: PatientPendingFollowUpStatus;
  },
): PatientPendingFollowUp {
  const created: PatientPendingFollowUp = {
    ...input,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `pfu_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: input.status ?? "open",
  };
  if (typeof window === "undefined") return created;
  const next = [...parseStored(), created];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    cachedRaw = window.localStorage.getItem(STORAGE_KEY);
    cached = next;
  } catch {
    /* ignore quota */
  }
  notifyPatientPendingFollowUpsChanged();
  return created;
}

export function markPatientPendingFollowUpContacted(id: string): void {
  if (typeof window === "undefined") return;
  const next = parseStored().map((row) =>
    row.id === id ? { ...row, status: "contacted" as const } : row,
  );
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    cachedRaw = window.localStorage.getItem(STORAGE_KEY);
    cached = next;
  } catch {
    /* ignore */
  }
  notifyPatientPendingFollowUpsChanged();
}
