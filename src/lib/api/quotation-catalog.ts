/**
 * Mock catalogs for CRM quotation wizard (BR-4.1). No HTTP; Phase 2 replaces with APIs.
 * Route counts follow CRM settings ({@link getTreatmentTripCountFromSettings}); option prices are exact USD (mock).
 */
import type { PackageTier } from "@/types";
import { listDoctorIdsSync } from "@/lib/api/doctors";
import { getTreatmentBySlugSync } from "@/lib/api/treatments";
import { getTreatmentTripCountFromSettings } from "@/lib/api/crm-settings";
import type {
  EstimateAreaZone,
  EstimateCountryBand,
} from "@/lib/api/patient-estimate-catalog";

export type QuotationHospitalOption = {
  id: string;
  name: string;
  location?: string;
};

/** Priced accommodation SKU — hotel room or serviced apartment (CRM mock catalog). */
export type QuotationAccommodationKind = "hotel" | "apartment";

export type QuotationHotelOption = {
  id: string;
  name: string;
  kind: QuotationAccommodationKind;
  type?: string;
  pricePerNightUSD: number;
  /**
   * Occupancy included in {@link pricePerNightUSD}; extra guests pay
   * {@link guestSurchargePerNightUSD} each per night (mock parity with CRM surcharge rules).
   */
  includedGuests?: number;
  guestSurchargePerNightUSD?: number;
};

export type QuotationTransportProfile = {
  modeLabel: { ar: string; en: string };
  routeCount: number;
};

export type QuotationFlightOption = {
  id: string;
  label: { en: string; ar: string };
  detail: { en: string; ar: string };
  /** When empty, option applies to all bands for filtering convenience use `listQuotationFlightOptions`. */
  bands: EstimateCountryBand[];
  priceUSD: number;
};

export type QuotationGroundTransportSku = {
  id: string;
  label: { en: string; ar: string };
  /** Total ground transport = `usdPerRoute * routeCount` ({@link QuotationTransportProfile.routeCount}). */
  usdPerRoute: number;
};

const TIER_ORDER: PackageTier[] = ["normal", "silver", "gold", "vip"];

function tierRank(tier: PackageTier): number {
  return TIER_ORDER.indexOf(tier);
}

export const QUOTATION_DEFAULT_EXTRA_GUEST_USD_PER_NIGHT = 18;

/** Geographic logistics band for quotation hospitals (recommended trips/nights vary by zone in CRM settings). */
const QUOTATION_HOSPITAL_AREA_ZONE: Record<string, EstimateAreaZone> = {
  h_andalusia: "metro",
  h_saudi_german: "metro",
  h_as_salam: "metro",
  h_cleopatra: "metro",
  h_int_eye: "metro",
  h_maghrabi: "metro",
  h_dar_al_fouad: "metro",
  hospital_cairo_1: "metro",
  hospital_nile_1: "metro",
  hospital_alex_1: "coastal",
};

export function getQuotationHospitalAreaZone(hospitalId: string): EstimateAreaZone {
  return QUOTATION_HOSPITAL_AREA_ZONE[hospitalId] ?? "metro";
}

/** Hospitals where quoted procedures may be performed (CRM ids; aligns with seed quotations). */

function hq(p: {
  id: string;
  name: string;
  kind?: QuotationAccommodationKind;
  type?: string;
  pricePerNightUSD: number;
  includedGuests?: number;
  guestSurchargePerNightUSD?: number;
}): QuotationHotelOption {
  return {
    ...p,
    kind: p.kind ?? "hotel",
    includedGuests: p.includedGuests ?? 2,
    guestSurchargePerNightUSD:
      p.guestSurchargePerNightUSD ?? QUOTATION_DEFAULT_EXTRA_GUEST_USD_PER_NIGHT,
  };
}

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
    normal: [
      hq({
        id: "apt_maadi_std",
        name: "Maadi Heights Serviced Apts",
        kind: "apartment",
        type: "Studio",
        pricePerNightUSD: 38,
        guestSurchargePerNightUSD: 12,
      }),
      hq({
        id: "hotel_maadi_std",
        name: "Maadi Hotel (4★)",
        kind: "hotel",
        type: "Standard",
        pricePerNightUSD: 55,
      }),
      hq({
        id: "hotel_maadi_std_mid",
        name: "Royal Maadi Inn",
        kind: "hotel",
        type: "Comfort",
        pricePerNightUSD: 48,
      }),
    ],
    silver: [
      hq({
        id: "apt_maadi_sil",
        name: "Zahra Maadi Residence",
        kind: "apartment",
        type: "1 BR",
        pricePerNightUSD: 62,
        guestSurchargePerNightUSD: 14,
      }),
      hq({
        id: "hotel_maadi_sil",
        name: "Holiday Inn Maadi",
        kind: "hotel",
        type: "Premium",
        pricePerNightUSD: 85,
      }),
      hq({
        id: "hotel_maadi_sil_b",
        name: "Oasis Hotel Maadi",
        kind: "hotel",
        type: "Premium",
        pricePerNightUSD: 72,
      }),
    ],
    gold: [
      hq({
        id: "apt_maadi_gold",
        name: "Nile Residence Maadi",
        kind: "apartment",
        type: "2 BR",
        pricePerNightUSD: 88,
        guestSurchargePerNightUSD: 16,
      }),
      hq({
        id: "hotel_maadi_gold",
        name: "Hilton Cairo Maadi",
        kind: "hotel",
        type: "Luxury",
        pricePerNightUSD: 120,
      }),
      hq({
        id: "hotel_maadi_golf",
        name: "Cairo Zen Hotel",
        kind: "hotel",
        type: "Deluxe",
        pricePerNightUSD: 105,
      }),
    ],
    vip: [
      hq({
        id: "apt_maadi_vip",
        name: "Private Residences Zamalek",
        kind: "apartment",
        type: "Penthouse",
        pricePerNightUSD: 140,
        guestSurchargePerNightUSD: 22,
      }),
      hq({
        id: "hotel_maadi_vip",
        name: "Kempinski Nile Hotel",
        kind: "hotel",
        type: "VIP",
        pricePerNightUSD: 195,
      }),
      hq({
        id: "hotel_maadi_nv",
        name: "Tower Suites Cairo",
        kind: "hotel",
        type: "Executive",
        pricePerNightUSD: 175,
      }),
    ],
  },
  h_cleopatra: {
    normal: [
      hq({
        id: "apt_helio_std",
        name: "Heliopolis Loft Apartments",
        kind: "apartment",
        type: "Studio",
        pricePerNightUSD: 39,
      }),
      hq({
        id: "hotel_helio_std",
        name: "Triumph Hotel",
        kind: "hotel",
        type: "Standard",
        pricePerNightUSD: 52,
      }),
      hq({ id: "hotel_helio_std2", name: "Golden Park Heliopolis", kind: "hotel", type: "Standard", pricePerNightUSD: 46 }),
    ],
    silver: [
      hq({
        id: "apt_helio_sil",
        name: "City Square Apts Heliopolis",
        kind: "apartment",
        type: "1 BR",
        pricePerNightUSD: 58,
      }),
      hq({
        id: "hotel_helio_sil",
        name: "Le Méridien Heliopolis",
        kind: "hotel",
        type: "Premium",
        pricePerNightUSD: 88,
      }),
      hq({
        id: "hotel_helio_slv",
        name: "Baron Hotel Heliopolis",
        kind: "hotel",
        type: "Premium",
        pricePerNightUSD: 75,
      }),
    ],
    gold: [
      hq({
        id: "apt_helio_gold",
        name: "Executive Suites New Cairo Gate",
        kind: "apartment",
        type: "2 BR",
        pricePerNightUSD: 92,
      }),
      hq({
        id: "hotel_helio_gold",
        name: "InterContinental Citystars",
        kind: "hotel",
        type: "Luxury",
        pricePerNightUSD: 125,
      }),
      hq({ id: "hotel_helio_gc", name: "Radisson Blu Heliopolis", kind: "hotel", type: "Deluxe", pricePerNightUSD: 112 }),
    ],
    vip: [
      hq({
        id: "apt_helio_vip",
        name: "Skyline Residences Nasr City",
        kind: "apartment",
        type: "Premium suite",
        pricePerNightUSD: 155,
        guestSurchargePerNightUSD: 24,
      }),
      hq({
        id: "hotel_helio_vip",
        name: "Fairmont Nile City",
        kind: "hotel",
        type: "VIP",
        pricePerNightUSD: 210,
      }),
      hq({ id: "hotel_helio_ve", name: "Raffles Pavilion", kind: "hotel", type: "Presidential wing", pricePerNightUSD: 238 }),
    ],
  },
  h_dar_al_fouad: {
    normal: [
      hq({
        id: "apt_oct_std",
        name: "October Park Apartments",
        kind: "apartment",
        type: "Studio",
        pricePerNightUSD: 40,
      }),
      hq({
        id: "hotel_oct_std",
        name: "Mövenpick Media City",
        kind: "hotel",
        type: "Standard",
        pricePerNightUSD: 58,
      }),
      hq({ id: "hotel_oct_st2", name: "Swiss Inn October", kind: "hotel", type: "Standard", pricePerNightUSD: 52 }),
    ],
    silver: [
      hq({
        id: "apt_oct_sil",
        name: "Palm Hills Serviced Apts",
        kind: "apartment",
        type: "1 BR",
        pricePerNightUSD: 60,
      }),
      hq({
        id: "hotel_oct_sil",
        name: "Novotel 6th of October",
        kind: "hotel",
        type: "Premium",
        pricePerNightUSD: 82,
      }),
      hq({ id: "hotel_oct_sv", name: "Oasis Cairo West", kind: "hotel", type: "Premium", pricePerNightUSD: 70 }),
    ],
    gold: [
      hq({
        id: "apt_oct_gold",
        name: "El Sheikh Zayed Villas Apts",
        kind: "apartment",
        type: "2 BR",
        pricePerNightUSD: 94,
      }),
      hq({
        id: "hotel_oct_gold",
        name: "Hilton Pyramids Golf",
        kind: "hotel",
        type: "Luxury",
        pricePerNightUSD: 118,
      }),
      hq({ id: "hotel_oct_ge", name: "Steigenberger October", kind: "hotel", type: "Deluxe", pricePerNightUSD: 108 }),
    ],
    vip: [
      hq({
        id: "apt_oct_vip",
        name: "Golf Residence West Cairo",
        kind: "apartment",
        type: "Duplex",
        pricePerNightUSD: 148,
      }),
      hq({
        id: "hotel_oct_vip",
        name: "The St. Regis Cairo",
        kind: "hotel",
        type: "VIP",
        pricePerNightUSD: 220,
      }),
      hq({ id: "hotel_oct_ve", name: "Royal Maxim Palace", kind: "hotel", type: "Palace wing", pricePerNightUSD: 245 }),
    ],
  },
  hospital_alex_1: {
    normal: [
      hq({
        id: "apt_alex_std",
        name: "Stanley Bay Apartments",
        kind: "apartment",
        type: "Sea-view studio",
        pricePerNightUSD: 34,
      }),
      hq({
        id: "hotel_alex_std",
        name: "Tolip Hotel Alexandria",
        kind: "hotel",
        type: "Standard",
        pricePerNightUSD: 48,
      }),
      hq({ id: "hotel_alex_st2", name: "Holiday Inn Alexandria", kind: "hotel", type: "Standard", pricePerNightUSD: 42 }),
    ],
    silver: [
      hq({
        id: "apt_alex_sil",
        name: "Smouha Residence Suites",
        kind: "apartment",
        type: "1 BR",
        pricePerNightUSD: 58,
      }),
      hq({
        id: "hotel_alex_sil",
        name: "Hilton Alexandria Green Plaza",
        kind: "hotel",
        type: "Premium",
        pricePerNightUSD: 90,
      }),
      hq({ id: "hotel_alex_sv", name: "Plaza Hotel Alexandria", kind: "hotel", type: "Premium", pricePerNightUSD: 78 }),
    ],
    gold: [
      hq({
        id: "apt_alex_gold",
        name: "San Stefano Deluxe Apts",
        kind: "apartment",
        type: "2 BR",
        pricePerNightUSD: 98,
      }),
      hq({
        id: "hotel_alex_gold",
        name: "Four Seasons Alexandria",
        kind: "hotel",
        type: "Luxury",
        pricePerNightUSD: 135,
      }),
      hq({ id: "hotel_alex_ga", name: "Hilton Alexandria Corniche", kind: "hotel", type: "Deluxe", pricePerNightUSD: 118 }),
    ],
    vip: [
      hq({
        id: "apt_alex_vip",
        name: "El Raml Private Apartments",
        kind: "apartment",
        type: "Penthouse",
        pricePerNightUSD: 145,
      }),
      hq({
        id: "hotel_alex_vip",
        name: "Steigenberger Cecil Hotel",
        kind: "hotel",
        type: "VIP",
        pricePerNightUSD: 185,
      }),
      hq({ id: "hotel_alex_vp", name: "Waldorf Astoria Alexandria", kind: "hotel", type: "Heritage suites", pricePerNightUSD: 215 }),
    ],
  },
};

const DEFAULT_HOTELS: Partial<Record<PackageTier, QuotationHotelOption[]>> = {
  normal: [
    hq({
      id: "def_std_apt_a",
      name: "Urban Stay Cairo — Studios",
      kind: "apartment",
      type: "Studio",
      pricePerNightUSD: 42,
      guestSurchargePerNightUSD: 12,
    }),
    hq({
      id: "def_std_apt_b",
      name: "Corniche Residence Apts",
      kind: "apartment",
      type: "1 BR",
      pricePerNightUSD: 48,
      guestSurchargePerNightUSD: 14,
    }),
    hq({ id: "def_std", name: "Midtown Cairo Hotel", kind: "hotel", type: "Standard", pricePerNightUSD: 52 }),
    hq({
      id: "def_htl_budget",
      name: "City Inn Giza — Standard",
      kind: "hotel",
      type: "Standard",
      pricePerNightUSD: 46,
    }),
  ],
  silver: [
    hq({
      id: "def_sil_apt_a",
      name: "Nile Terrace Serviced Apts",
      kind: "apartment",
      type: "1 BR",
      pricePerNightUSD: 65,
      guestSurchargePerNightUSD: 15,
    }),
    hq({
      id: "def_sil_apt_b",
      name: "Zamalek Executive Flats",
      kind: "apartment",
      type: "2 BR",
      pricePerNightUSD: 78,
    }),
    hq({
      id: "def_sil",
      name: "Novotel Cairo El Borg",
      kind: "hotel",
      type: "Premium",
      pricePerNightUSD: 80,
    }),
    hq({
      id: "def_sil_htl_b",
      name: "Mercure Sphinx",
      kind: "hotel",
      type: "Premium",
      pricePerNightUSD: 72,
    }),
  ],
  gold: [
    hq({
      id: "def_gold_apt",
      name: "Garden City Premium Apts",
      kind: "apartment",
      type: "2 BR",
      pricePerNightUSD: 98,
      guestSurchargePerNightUSD: 18,
    }),
    hq({
      id: "def_gold_apt_del",
      name: "New Cairo Residence Club",
      kind: "apartment",
      type: "3 BR",
      pricePerNightUSD: 112,
      guestSurchargePerNightUSD: 18,
    }),
    hq({
      id: "def_gold",
      name: "Cairo Marriott Hotel",
      kind: "hotel",
      type: "Luxury",
      pricePerNightUSD: 115,
    }),
    hq({ id: "def_gold_h2", name: "Hyatt Regency Cairo West", kind: "hotel", type: "Deluxe", pricePerNightUSD: 108 }),
  ],
  vip: [
    hq({
      id: "def_vip_apt",
      name: "Private Residences at Nile Plaza",
      kind: "apartment",
      type: "Duplex penthouse",
      pricePerNightUSD: 165,
      guestSurchargePerNightUSD: 26,
    }),
    hq({
      id: "def_vip_apt_co",
      name: "Diplomat Suites Zamalek",
      kind: "apartment",
      type: "3 BR + office",
      pricePerNightUSD: 188,
      guestSurchargePerNightUSD: 28,
    }),
    hq({
      id: "def_vip",
      name: "Four Seasons Nile Plaza",
      kind: "hotel",
      type: "VIP",
      pricePerNightUSD: 200,
    }),
    hq({
      id: "def_vip_h2",
      name: "Ritz‑Carlton Nile",
      kind: "hotel",
      type: "Presidential tier",
      pricePerNightUSD: 235,
    }),
  ],
};

/** Visual copy only; route count comes from CRM settings. */
const TRANSPORT_MODE_LABELS: Record<string, { modeLabel: { ar: string; en: string } }> = {
  "joint-replacement": {
    modeLabel: {
      en: "Private limousine (airport ↔ hotel ↔ hospital)",
      ar: "ليموزين خاص (مطار ↔ فندق ↔ مستشفى)",
    },
  },
  "diabetic-foot": {
    modeLabel: {
      en: "Private car — multi-visit bundle",
      ar: "سيارة خاصة — باقة زيارات متعددة",
    },
  },
  ivf: {
    modeLabel: {
      en: "Scheduled transfers (clinic-focused)",
      ar: "تنقلات مجدولة (تركيز العيادة)",
    },
  },
  oncology: {
    modeLabel: {
      en: "Dedicated driver — extended stay",
      ar: "سائق مخصص — إقامة مطولة",
    },
  },
};

const DEFAULT_TRANSPORT_LABEL = {
  modeLabel: {
    en: "Private limousine (standard package)",
    ar: "ليموزين خاص (الباقة القياسية)",
  },
};

/** Sample flight bundles (exact USD) — filter by lead country band. */
const FLIGHT_OPTIONS: QuotationFlightOption[] = [
  {
    id: "flt_reg_economy",
    bands: ["regional"],
    label: {
      en: "Economy round-trip — Cairo ↔ regional hub",
      ar: "ذهاب وإياب اقتصادية — القاهرة ↔ إقليمي",
    },
    detail: {
      en: "EgyptAir / Flynas · 1 checked bag · sample fare class V",
      ar: "مصر للطيران / فلاي ناس · حقيبة مسجلة · فئة عينة V",
    },
    priceUSD: 195,
  },
  {
    id: "flt_reg_flex",
    bands: ["regional"],
    label: {
      en: "Flexible economy — regional",
      ar: "اقتصادية مرنة — إقليمي",
    },
    detail: {
      en: "Rebook once without fee · same route",
      ar: "إعادة حجز مرة دون رسوم · نفس المسار",
    },
    priceUSD: 265,
  },
  {
    id: "flt_med_economy",
    bands: ["medium_haul"],
    label: {
      en: "Economy round-trip — Cairo ↔ Europe / Africa",
      ar: "ذهاب وإياب اقتصادية — القاهرة ↔ أوروبا / أفريقيا",
    },
    detail: {
      en: "Major carrier · 23kg bag · sample fare",
      ar: "ناقل رئيسي · 23 كجم · عينة",
    },
    priceUSD: 520,
  },
  {
    id: "flt_med_flex",
    bands: ["medium_haul"],
    label: {
      en: "Premium economy — medium haul",
      ar: "اقتصادية ممتازة — متوسط المدى",
    },
    detail: {
      en: "Extra legroom row · priority boarding",
      ar: "مساحة أوسع · أولوية صعود",
    },
    priceUSD: 780,
  },
  {
    id: "flt_long_economy",
    bands: ["long_haul"],
    label: {
      en: "Economy round-trip — Cairo ↔ Americas / Asia / Oceania",
      ar: "ذهاب وإياب اقتصادية — القاهرة ↔ الأمريكتين / آسيا",
    },
    detail: {
      en: "1 stop · sample dated fare",
      ar: "توقف واحد · عينة بتاريخ",
    },
    priceUSD: 1180,
  },
  {
    id: "flt_long_business",
    bands: ["long_haul"],
    label: {
      en: "Business class — long haul",
      ar: "درجة رجال الأعمال — طويل المدى",
    },
    detail: {
      en: "Lie-flat seat · lounge access · 2 bags",
      ar: "مقعد مسطّح · صالة · حقيبتان",
    },
    priceUSD: 3200,
  },
];

/** Default facility line before tier multiplier — matches quotation price engine mocks. */
const DEFAULT_HOSPITAL_FACILITY_BASE_USD = 380;

/** Per-hospital mock facility amounts (USD, before tier multiplier). Unknown ids → default. */
const HOSPITAL_FACILITY_BASE_USD: Partial<Record<string, number>> = {
  h_as_salam: 410,
  h_saudi_german: 400,
  h_cleopatra: 390,
  h_dar_al_fouad: 385,
  h_andalusia: 375,
  h_int_eye: 360,
  h_maghrabi: 355,
  hospital_cairo_1: 420,
  hospital_nile_1: 400,
  hospital_alex_1: 395,
};

/**
 * Procedure line uses `(treatmentBase + doctorDelta) × tier`; delta is catalog mock only.
 */
const DOCTOR_PROCEDURE_DELTA_USD: Partial<Record<string, number>> = {
  rashad_bishara: 180,
  ayman_samadony: 120,
  hussein_alwan: 90,
  mohamed_aboulghar: 150,
  sherif_pasha: 110,
  ismail_aboul_fotouh: 130,
  tamer_el_nahas: 100,
  mahmoud_hafez: 140,
  nasser_loza: 125,
};

export function getQuotationHospitalFacilityBaseUsd(hospitalId: string): number {
  return HOSPITAL_FACILITY_BASE_USD[hospitalId] ?? DEFAULT_HOSPITAL_FACILITY_BASE_USD;
}

/** Additive delta on procedure base (USD, before tier multiplier). */
export function getQuotationDoctorProcedureDeltaUsd(doctorId: string): number {
  return DOCTOR_PROCEDURE_DELTA_USD[doctorId] ?? 0;
}

const GROUND_TRANSPORT_SKUS: QuotationGroundTransportSku[] = [
  {
    id: "gnd_standard",
    label: {
      en: "Standard private car",
      ar: "سيارة خاصة قياسية",
    },
    usdPerRoute: 38,
  },
  {
    id: "gnd_priority",
    label: {
      en: "Priority van (extended hours)",
      ar: "فان أولوية (ساعات إضافية)",
    },
    usdPerRoute: 48,
  },
  {
    id: "gnd_vip",
    label: {
      en: "VIP chauffeur + meet & greet",
      ar: "سائق VIP + استقبال",
    },
    usdPerRoute: 62,
  },
];

export function listQuotationFlightOptions(band: EstimateCountryBand): QuotationFlightOption[] {
  return FLIGHT_OPTIONS.filter((o) => o.bands.includes(band));
}

export function getQuotationFlightOptionById(id: string): QuotationFlightOption | undefined {
  return FLIGHT_OPTIONS.find((o) => o.id === id);
}

export function listGroundTransportSkus(): QuotationGroundTransportSku[] {
  return [...GROUND_TRANSPORT_SKUS];
}

export function getGroundTransportSkuById(id: string): QuotationGroundTransportSku | undefined {
  return GROUND_TRANSPORT_SKUS.find((s) => s.id === id);
}

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

export function getQuotationHospitalById(id: string): QuotationHospitalOption | undefined {
  return HOSPITALS.find((h) => h.id === id);
}

export function listQuotationHospitalsForDoctor(doctorId: string): QuotationHospitalOption[] {
  const ids = DOCTOR_HOSPITAL_IDS[doctorId];
  if (!ids?.length) return [...HOSPITALS];
  const set = new Set(ids);
  return HOSPITALS.filter((h) => set.has(h.id));
}

/** Doctors with no restricted list operate at every hospital shown in quotations. */
function doctorWorksAtHospital(doctorId: string, hospitalId: string): boolean {
  const linked = DOCTOR_HOSPITAL_IDS[doctorId];
  if (!linked?.length) return true;
  return linked.includes(hospitalId);
}

/**
 * Doctor IDs allowed for this treatment tier that operate at {@link hospitalId}
 * (for hospital-first filtering in the quotation wizard).
 */
export function listQuotationDoctorIdsForHospital(
  hospitalId: string,
  treatmentSlug: string,
  packageTier: PackageTier,
): string[] {
  return listQuotationDoctorIds(treatmentSlug, packageTier).filter((id) =>
    doctorWorksAtHospital(id, hospitalId),
  );
}

/**
 * Union of hospitals reachable by allowed doctors before a doctor is chosen
 * (parity with picking either side first).
 */
export function listQuotationHospitalsForTreatment(
  treatmentSlug: string,
  packageTier: PackageTier,
): QuotationHospitalOption[] {
  const doctorIds = listQuotationDoctorIds(treatmentSlug, packageTier);
  const seen = new Set<string>();
  const list: QuotationHospitalOption[] = [];
  for (const did of doctorIds) {
    for (const h of listQuotationHospitalsForDoctor(did)) {
      if (!seen.has(h.id)) {
        seen.add(h.id);
        list.push(h);
      }
    }
  }
  return list;
}

export function listQuotationHotelsForHospital(
  hospitalId: string,
  packageTier: PackageTier,
): QuotationHotelOption[] {
  const byTier = HOTELS_BY_HOSPITAL[hospitalId];
  if (!byTier) return DEFAULT_HOTELS[packageTier] ?? [];
  return byTier[packageTier] ?? DEFAULT_HOTELS[packageTier] ?? [];
}

export function findQuotationHotelOption(
  hospitalId: string,
  packageTier: PackageTier,
  hotelId: string,
): QuotationHotelOption | undefined {
  return listQuotationHotelsForHospital(hospitalId, packageTier).find((h) => h.id === hotelId);
}

/**
 * Route count is always read from CRM settings; mode label follows treatment type.
 */
export function getQuotationTransportProfile(treatmentSlug: string): QuotationTransportProfile {
  const labels = TRANSPORT_MODE_LABELS[treatmentSlug] ?? DEFAULT_TRANSPORT_LABEL;
  return {
    modeLabel: labels.modeLabel,
    routeCount: getTreatmentTripCountFromSettings(treatmentSlug),
  };
}
