import type { PatientProfileLocal } from "@/types";

const STORAGE_KEY = "amanak_patient_profile_v1";

export const PATIENT_PROFILE_EVENT = "amanak-patient-profile-updated";
let cachedRaw: string | null | undefined;
let cachedProfile: PatientProfileLocal | null = null;

function emptyProfile(): PatientProfileLocal {
  return {
    fullName: "",
    phone: "",
    email: "",
    country: "",
    updatedAt: new Date().toISOString(),
  };
}

export function getPatientProfile(): PatientProfileLocal | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedProfile;
    cachedRaw = raw;
    if (!raw) {
      cachedProfile = null;
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<PatientProfileLocal>;
    cachedProfile = {
      fullName: typeof parsed.fullName === "string" ? parsed.fullName : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
      email: typeof parsed.email === "string" ? parsed.email : "",
      country: typeof parsed.country === "string" ? parsed.country : "",
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
    return cachedProfile;
  } catch {
    cachedRaw = null;
    cachedProfile = null;
    return null;
  }
}

export function setPatientProfile(
  patch: Partial<Omit<PatientProfileLocal, "updatedAt">>,
): PatientProfileLocal {
  const prev = getPatientProfile() ?? emptyProfile();
  const next: PatientProfileLocal = {
    fullName: typeof patch.fullName === "string" ? patch.fullName : prev.fullName,
    phone: typeof patch.phone === "string" ? patch.phone : prev.phone,
    email: typeof patch.email === "string" ? patch.email : prev.email,
    country: typeof patch.country === "string" ? patch.country : prev.country,
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      cachedRaw = window.localStorage.getItem(STORAGE_KEY);
      cachedProfile = next;
      window.dispatchEvent(new Event(PATIENT_PROFILE_EVENT));
    } catch {
      /* ignore */
    }
  }
  return next;
}
