/**
 * Mock catalogs for CRM quotation wizard (BR-4.1). No HTTP; Phase 2 replaces with APIs.
 */
import type { PackageTier } from "@/types";
import { listDoctorIdsSync } from "@/lib/api/doctors";
import { getTreatmentBySlugSync } from "@/lib/api/treatments";

export type QuotationHospitalOption = {
  id: string;
  name: string;
  location?: string;
};

export type QuotationHotelOption = {
  id: string;
  name: string;
  type?: string;
};

export type QuotationTransportProfile = {
  modeLabel: { ar: string; en: string };
  routeCount: number;
};

const TIER_ORDER: PackageTier[] = ["normal", "silver", "gold", "vip"];

function tierRank(tier: PackageTier): number {
  return TIER_ORDER.indexOf(tier);
}

/** Hospitals where quoted procedures may be performed (CRM ids; aligns with seed quotations). */
const HOSPITALS: QuotationHospitalOption[] = [
  { id: "h_andalusia", name: "Andalusia Hospital", location: "Maadi, Cairo" },
  { id: "h_saudi_german", name: "Saudi German Hospital", location: "Heliopolis, Cairo" },
  { id: "h_as_salam", name: "As-Salam International Hospital", location: "Maadi, Cairo" },
  { id: "h_cleopatra", name: "Cleopatra Hospital", location: "Heliopolis, Cairo" },
  { id: "h_int_eye", name: "International Eye Hospital", location: "Dokki, Giza" },
  { id: "h_maghrabi", name: "Maghrabi Eye & Ear Hospital", location: "Sayeda Zeinab, Cairo" },
  { id: "h_dar_al_fouad", name: "Dar Al Fouad Hospital", location: "6th of October City" },
  { id: "hospital_cairo_1", name: "Cairo International Medical Center", location: "New Cairo" },
  { id: "hospital_nile_1", name: "Nile Orthopedic Institute", location: "Zamalek, Cairo" },
  { id: "hospital_alex_1", name: "Alexandria Fertility & IVF Center", location: "Alexandria" },
];

/** Doctor → hospitals where they operate (mock). */
const DOCTOR_HOSPITAL_IDS: Record<string, string[]> = {
  rashad_bishara: ["h_as_salam", "h_andalusia", "hospital_cairo_1"],
  ayman_samadony: ["h_cleopatra", "h_saudi_german"],
  hussein_alwan: ["h_dar_al_fouad", "h_cleopatra"],
  mohamed_aboulghar: ["hospital_alex_1", "h_as_salam"],
  sherif_pasha: ["hospital_alex_1", "h_cleopatra"],
  ismail_aboul_fotouh: ["hospital_alex_1", "h_saudi_german"],
  tamer_el_nahas: ["h_dar_al_fouad", "h_saudi_german"],
  mahmoud_hafez: ["hospital_nile_1", "h_dar_al_fouad"],
  nasser_loza: ["h_cleopatra", "hospital_cairo_1"],
};

const HOTELS_BY_HOSPITAL: Record<string, Partial<Record<PackageTier, QuotationHotelOption[]>>> = {
  h_as_salam: {
    normal: [{ id: "hotel_maadi_std", name: "Maadi Hotel (4★)", type: "Standard" }],
    silver: [{ id: "hotel_maadi_sil", name: "Holiday Inn Maadi", type: "Premium" }],
    gold: [{ id: "hotel_maadi_gold", name: "Hilton Cairo Maadi", type: "Luxury" }],
    vip: [{ id: "hotel_maadi_vip", name: "Kempinski Nile Hotel", type: "VIP" }],
  },
  h_cleopatra: {
    normal: [{ id: "hotel_helio_std", name: "Triumph Hotel", type: "Standard" }],
    silver: [{ id: "hotel_helio_sil", name: "Le Méridien Heliopolis", type: "Premium" }],
    gold: [{ id: "hotel_helio_gold", name: "InterContinental Citystars", type: "Luxury" }],
    vip: [{ id: "hotel_helio_vip", name: "Fairmont Nile City", type: "VIP" }],
  },
  h_dar_al_fouad: {
    normal: [{ id: "hotel_oct_std", name: "Mövenpick Media City", type: "Standard" }],
    silver: [{ id: "hotel_oct_sil", name: "Novotel 6th of October", type: "Premium" }],
    gold: [{ id: "hotel_oct_gold", name: "Hilton Pyramids Golf", type: "Luxury" }],
    vip: [{ id: "hotel_oct_vip", name: "The St. Regis Cairo", type: "VIP" }],
  },
  hospital_alex_1: {
    normal: [{ id: "hotel_alex_std", name: "Tolip Hotel Alexandria", type: "Standard" }],
    silver: [{ id: "hotel_alex_sil", name: "Hilton Alexandria Green Plaza", type: "Premium" }],
    gold: [{ id: "hotel_alex_gold", name: "Four Seasons Alexandria", type: "Luxury" }],
    vip: [{ id: "hotel_alex_vip", name: "Steigenberger Cecil Hotel", type: "VIP" }],
  },
};

// Fallback hotels for other hospitals
const DEFAULT_HOTELS: Partial<Record<PackageTier, QuotationHotelOption[]>> = {
  normal: [{ id: "def_std", name: "City Stay Apartments", type: "Standard" }],
  silver: [{ id: "def_sil", name: "Novotel Cairo El Borg", type: "Premium" }],
  gold: [{ id: "def_gold", name: "Cairo Marriott Hotel", type: "Luxury" }],
  vip: [{ id: "def_vip", name: "Four Seasons Nile Plaza", type: "VIP" }],
};

/** Treatment slug → transport profile (mock “case type”). */
const TRANSPORT_BY_TREATMENT: Record<string, QuotationTransportProfile> = {
  "joint-replacement": {
    modeLabel: { en: "Private limousine (airport ↔ hotel ↔ hospital)", ar: "ليموزين خاص (مطار ↔ فندق ↔ مستشفى)" },
    routeCount: 6,
  },
  "diabetic-foot": {
    modeLabel: { en: "Private car — multi-visit bundle", ar: "سيارة خاصة — باقة زيارات متعددة" },
    routeCount: 8,
  },
  ivf: {
    modeLabel: { en: "Scheduled transfers (clinic-focused)", ar: "تنقلات مجدولة (تركيز العيادة)" },
    routeCount: 5,
  },
  oncology: {
    modeLabel: { en: "Dedicated driver — extended stay", ar: "سائق مخصص — إقامة مطولة" },
    routeCount: 10,
  },
};

const DEFAULT_TRANSPORT: QuotationTransportProfile = {
  modeLabel: { en: "Private limousine (standard package)", ar: "ليموزين خاص (الباقة القياسية)" },
  routeCount: 4,
};

export function treatmentDoctorIdsOrFallback(treatmentSlug: string): string[] {
  const t = getTreatmentBySlugSync(treatmentSlug);
  if (t?.doctorIds?.length) return [...t.doctorIds];
  return listDoctorIdsSync();
}

/**
 * Doctors allowed for this treatment at the selected package tier (mock: normal/silver use a subset when ≥3 doctors).
 */
export function listQuotationDoctorIds(
  treatmentSlug: string,
  packageTier: PackageTier,
): string[] {
  const pool = treatmentDoctorIdsOrFallback(treatmentSlug);
  if (pool.length <= 2) return pool;
  if (tierRank(packageTier) >= tierRank("gold")) return pool;
  return pool.slice(0, 2);
}

export function listQuotationHospitalsForDoctor(doctorId: string): QuotationHospitalOption[] {
  const ids = DOCTOR_HOSPITAL_IDS[doctorId];
  if (!ids?.length) return [...HOSPITALS];
  const set = new Set(ids);
  return HOSPITALS.filter((h) => set.has(h.id));
}

export function listQuotationHotelsForHospital(
  hospitalId: string,
  packageTier: PackageTier,
): QuotationHotelOption[] {
  const byTier = HOTELS_BY_HOSPITAL[hospitalId];
  if (!byTier) return DEFAULT_HOTELS[packageTier] ?? [];
  return byTier[packageTier] ?? DEFAULT_HOTELS[packageTier] ?? [];
}

export function getQuotationTransportProfile(treatmentSlug: string): QuotationTransportProfile {
  return TRANSPORT_BY_TREATMENT[treatmentSlug] ?? DEFAULT_TRANSPORT;
}
