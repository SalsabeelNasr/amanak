import type { PatientCareRequest, PatientCareRequestPath } from "@/types";

const STORAGE_KEY = "amanak_patient_care_requests_v1";

export const PATIENT_CARE_REQUESTS_EVENT = "amanak-care-requests-updated";
const EMPTY_REQUESTS: PatientCareRequest[] = [];
let cachedRaw: string | null | undefined;
let cachedRequests: PatientCareRequest[] = EMPTY_REQUESTS;

function parseStored(): PatientCareRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as PatientCareRequest[];
  } catch {
    return [];
  }
}

export function listPatientCareRequests(): PatientCareRequest[] {
  if (typeof window === "undefined") return EMPTY_REQUESTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedRequests;
    cachedRaw = raw;
    if (!raw) {
      cachedRequests = EMPTY_REQUESTS;
      return cachedRequests;
    }
    const parsed: unknown = JSON.parse(raw);
    cachedRequests = Array.isArray(parsed)
      ? (parsed as PatientCareRequest[])
      : EMPTY_REQUESTS;
    return cachedRequests;
  } catch {
    cachedRaw = null;
    cachedRequests = EMPTY_REQUESTS;
    return cachedRequests;
  }
}

export function notifyPatientCareRequestsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PATIENT_CARE_REQUESTS_EVENT));
}

export function addPatientCareRequest(
  input: Omit<PatientCareRequest, "id" | "createdAt" | "source"> & {
    source?: PatientCareRequest["source"];
  },
): PatientCareRequest {
  const created: PatientCareRequest = {
    ...input,
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `req_${Date.now()}`,
    createdAt: new Date().toISOString(),
    source: input.source ?? "onboarding",
  };
  if (typeof window === "undefined") return created;
  const next = [...parseStored(), created];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    cachedRaw = window.localStorage.getItem(STORAGE_KEY);
    cachedRequests = next;
  } catch {
    /* ignore quota */
  }
  notifyPatientCareRequestsChanged();
  return created;
}

export function buildRequestPayloadFromOnboarding(args: {
  treatmentSlug: string;
  isB2B: boolean;
  path: PatientCareRequestPath;
  partySize?: "1" | "2";
  travelerCount?: number;
  timing?: "asap" | "one_month" | "three_months";
  doctorId?: string;
  hospitalId?: string;
  includeFlights?: boolean;
  includeAccommodation?: boolean;
  includeTransport?: boolean;
  estimateSnapshot?: PatientCareRequest["estimateSnapshot"];
  phone?: string;
  contactTime?: string;
  bookingId?: string;
}): Omit<PatientCareRequest, "id" | "createdAt" | "source"> {
  return {
    treatmentSlug: args.treatmentSlug,
    isB2B: args.isB2B,
    path: args.path,
    partySize: args.partySize,
    travelerCount: args.travelerCount,
    timing: args.timing,
    doctorId: args.doctorId,
    hospitalId: args.hospitalId,
    includeFlights: args.includeFlights,
    includeAccommodation: args.includeAccommodation,
    includeTransport: args.includeTransport,
    estimateSnapshot: args.estimateSnapshot,
    phone: args.phone,
    contactTime: args.contactTime,
    bookingId: args.bookingId,
  };
}
