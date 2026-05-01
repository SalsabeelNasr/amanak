/**
 * Mock patients repository — shared by CRM and patient portal mock layer.
 */
import type { Patient } from "@/types";
import { PATIENT_SEED } from "./requests-pipeline-seed";
import { applyMockDelay } from "./mock-delay";

const STORE = new Map<string, Patient>();

for (const p of PATIENT_SEED) {
  STORE.set(p.id, p);
}

export type PatientFilters = {
  search?: string;
  hasPortalAccess?: boolean;
  clientType?: Patient["clientType"];
};

export type CreatePatientInput = {
  name: string;
  phone: string;
  email?: string;
  country: string;
  age?: number;
  clientType: Patient["clientType"];
  hasPortalAccess: boolean;
  createdBy: Patient["createdBy"];
  optedOutChannels?: Patient["optedOutChannels"];
  notes?: string;
};

/** Synchronous read for request list country filtering (same process as mock store). */
export function getPatientByIdSync(id: string): Patient | undefined {
  return STORE.get(id);
}

export async function listPatients(
  filters?: PatientFilters,
  options?: { simulateDelay?: boolean },
): Promise<Patient[]> {
  await applyMockDelay(options?.simulateDelay);
  let rows = Array.from(STORE.values());
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        (p.email?.toLowerCase().includes(q) ?? false) ||
        p.country.toLowerCase().includes(q),
    );
  }
  if (filters?.hasPortalAccess !== undefined) {
    rows = rows.filter((p) => p.hasPortalAccess === filters.hasPortalAccess);
  }
  if (filters?.clientType) {
    rows = rows.filter((p) => p.clientType === filters.clientType);
  }
  return rows.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function getPatientById(
  id: string,
  options?: { simulateDelay?: boolean },
): Promise<Patient | undefined> {
  await applyMockDelay(options?.simulateDelay);
  return STORE.get(id);
}

export async function createPatient(
  input: CreatePatientInput,
  options?: { simulateDelay?: boolean },
): Promise<Patient> {
  await applyMockDelay(options?.simulateDelay);
  const now = new Date().toISOString();
  const id = `patient_${globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const row: Patient = {
    id,
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || undefined,
    country: input.country.trim(),
    age: input.age,
    clientType: input.clientType,
    hasPortalAccess: input.hasPortalAccess,
    createdBy: input.createdBy,
    optedOutChannels: input.optedOutChannels,
    notes: input.notes?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  STORE.set(id, row);
  return row;
}

export async function updatePatient(
  id: string,
  updates: Partial<Patient>,
  options?: { simulateDelay?: boolean },
): Promise<Patient> {
  await applyMockDelay(options?.simulateDelay);
  const existing = STORE.get(id);
  if (!existing) throw new Error(`Patient ${id} not found`);
  const now = new Date().toISOString();
  const next: Patient = {
    ...existing,
    ...updates,
    id: existing.id,
    updatedAt: now,
  };
  STORE.set(id, next);
  return next;
}
