import type { Lead, PackageTier, Patient, QuotationItem } from "@/types";
import { getTreatmentBySlugSync } from "@/lib/api/treatments";
import type { QuotationTransportProfile } from "@/lib/api/quotation-catalog";
import {
  getQuotationDoctorProcedureDeltaUsd,
  getQuotationHospitalFacilityBaseUsd,
  QUOTATION_DEFAULT_EXTRA_GUEST_USD_PER_NIGHT,
  type QuotationHotelOption,
} from "@/lib/api/quotation-catalog";
import {
  computeQuotationAccommodationNights,
  getCrmSettingsSync,
  getTreatmentTripCountFromSettings,
  computeDefaultStayNightsFromTrips,
} from "@/lib/api/crm-settings";
import type {
  EstimateAreaZone,
  EstimateCountryBand,
  EstimateTimingPreference,
} from "@/lib/api/patient-estimate-catalog";

export const DEFAULT_QUOTATION_TERMS =
  "Prices reflect the selected options in this quotation; clinical review may require an updated quotation.\n" +
  "الأسعار المعروضة وفق الخيارات المحددة؛ أي تعديل بعد المراجعة السريرية يُبلَّغ بنسخة مستحدثة.";

const TIER_MULT: Record<PackageTier, number> = {
  normal: 0.92,
  silver: 1,
  gold: 1.12,
  vip: 1.28,
};

export type BuildQuotationPriceInput = {
  treatmentSlug: string;
  packageTier: PackageTier;
  /** Optional; adds catalog mock delta to the procedure line. */
  doctorId?: string;
  hospitalId?: string;
  /**
   * Accommodation line: nightly rate × nights + surcharge for guests above included occupancy.
   * Omit `nights` / `guests` to fall back to CRM default nights and 2 guests.
   */
  hotel?: {
    id: string;
    name: string;
    pricePerNightUSD: number;
    nights?: number;
    guests?: number;
    includedGuests?: number;
    guestSurchargePerNightUSD?: number;
    kind?: QuotationHotelOption["kind"];
  } | null;
  /** Exact flight bundle from catalog (optional if user skipped flights). */
  flight?: { id: string; label: { en: string; ar: string }; priceUSD: number } | null;
  /**
   * Exact ground transport: `usdPerRoute × transport.routeCount` (routeCount from CRM settings).
   * When omitted (legacy), falls back to standard SKU rate.
   */
  groundTransport?: { id: string; label: { en: string; ar: string }; usdPerRoute: number } | null;
  /** Omit ground transport line when false (e.g. patient arranges own transport). Default true. */
  includeGroundTransport?: boolean;
  /**
   * When false, ground line label reflects a one‑way airport leg; pricing uses billed `transport.routeCount` from wizard.
   * Omit or true = airport round-trip bundle.
   */
  transportAirportRoundTrip?: boolean;
  /** Service area (`metro`/`coastal`/`resort`) for default accommodation nights from CRM rules. Default metro. */
  quoteAreaZone?: EstimateAreaZone;
  clientType: Patient["clientType"];
  /** Use `routeCount` as billed vehicle legs (already adjusted for one‑way airport if applicable). */
  transport: QuotationTransportProfile;
};

export type BuildQuotationPriceResult = {
  items: QuotationItem[];
  totalUSD: number;
  downpaymentRequired: boolean;
  downpaymentUSD?: number;
  termsAndConditions: string;
  _meta?: {
    procedure: number;
    hospital: number;
    hotel: number;
    transport: number;
    coordination: number;
  };
};

function roundMoney(n: number): number {
  return Math.round(n);
}

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

/**
 * Accommodation subtotal used in CRM quotations — base nights × nightly rate plus extra‑guest surcharge.
 */
export function computeQuotationAccommodationLineUsd(params: {
  pricePerNightUSD: number;
  nights: number;
  guests: number;
  includedGuests?: number;
  guestSurchargePerNightUSD?: number;
}): number {
  const inc = params.includedGuests ?? 2;
  const surcharge =
    params.guestSurchargePerNightUSD ?? QUOTATION_DEFAULT_EXTRA_GUEST_USD_PER_NIGHT;
  const base = params.nights * params.pricePerNightUSD;
  const extraGuests = Math.max(0, params.guests - inc);
  return roundMoney(base + extraGuests * params.nights * surcharge);
}

function accommodationKindLabels(kind?: QuotationHotelOption["kind"]): {
  en: string;
  ar: string;
} {
  return kind === "apartment"
    ? { en: "Serviced apartment", ar: "شقة مفروشة" }
    : { en: "Hotel", ar: "فندق" };
}

export function defaultTreatmentBaseUsd(treatmentSlug: string): number {
  const t = getTreatmentBySlugSync(treatmentSlug);
  if (typeof t?.priceUSD === "number" && t.priceUSD > 0) return t.priceUSD;
  return 3200;
}

const FALLBACK_USD_PER_ROUTE = 42;

/**
 * Mock CRM draft quotations: exact USD lines from selected SKUs + tier-adjusted procedure/hospital (route count from settings).
 */
export function buildQuotationPricing(input: BuildQuotationPriceInput): BuildQuotationPriceResult {
  const quoteAreaZone = input.quoteAreaZone ?? "metro";
  const mult = TIER_MULT[input.packageTier];
  const base = defaultTreatmentBaseUsd(input.treatmentSlug);
  const docDelta =
    input.doctorId != null ? getQuotationDoctorProcedureDeltaUsd(input.doctorId) : 0;
  const procedure = roundMoney((base + docDelta) * mult);

  const items: QuotationItem[] = [
    {
      label: { en: "Medical procedure", ar: "الإجراء الطبي" },
      amountUSD: procedure,
    },
  ];

  const hospitalAmount = input.hospitalId
    ? roundMoney(getQuotationHospitalFacilityBaseUsd(input.hospitalId) * mult)
    : 0;
  if (input.hospitalId) {
    items.push({
      label: { en: "Hospital stay & facility", ar: "إقامة المستشفى والمرافق" },
      amountUSD: hospitalAmount,
    });
  }

  if (input.flight && input.flight.priceUSD > 0) {
    items.push({
      label: {
        en: `Flights: ${input.flight.label.en}`,
        ar: `الطيران: ${input.flight.label.ar}`,
      },
      amountUSD: roundMoney(input.flight.priceUSD),
    });
  }

  if (input.hotel?.id && input.hotel.pricePerNightUSD > 0) {
    const defaultNights = computeQuotationAccommodationNights(
      input.treatmentSlug,
      input.packageTier,
      quoteAreaZone,
    );
    const nights = clampInt(
      input.hotel.nights ?? defaultNights,
      1,
      90,
    );
    const guests = clampInt(input.hotel.guests ?? 2, 1, 20);
    const hotelAmount = computeQuotationAccommodationLineUsd({
      pricePerNightUSD: input.hotel.pricePerNightUSD,
      nights,
      guests,
      includedGuests: input.hotel.includedGuests,
      guestSurchargePerNightUSD: input.hotel.guestSurchargePerNightUSD,
    });
    const kind = accommodationKindLabels(input.hotel.kind);
    items.push({
      label: {
        en: `Accommodation: ${input.hotel.name} (${kind.en}), ${nights} nights, ${guests} guests`,
        ar: `الإقامة: ${input.hotel.name} (${kind.ar}), ${nights} ليالٍ، ${guests} نزلاء`,
      },
      amountUSD: hotelAmount,
    });
  }

  const includeGt = input.includeGroundTransport !== false;
  let transportAmount = 0;
  if (includeGt) {
    const perRoute =
      input.groundTransport?.usdPerRoute ??
      FALLBACK_USD_PER_ROUTE * (input.packageTier === "vip" ? 1.15 : 1);
    const billedRoutes = clampInt(input.transport.routeCount, 1, 99);
    transportAmount = roundMoney(billedRoutes * perRoute);
    const gtLabel = input.groundTransport?.label;
    const airportRt = input.transportAirportRoundTrip !== false;
    const modeEn = airportRt
      ? "airport round-trip"
      : "one-way airport leg";
    const modeAr = airportRt ? "ذهاب وإياب مطار" : "اتجاه واحد مطار";
    items.push({
      label: {
        en: gtLabel
          ? `Ground transport: ${gtLabel.en} (${billedRoutes} routes, ${modeEn})`
          : `Ground transport (${billedRoutes} routes, ${modeEn})`,
        ar: gtLabel
          ? `النقل الأرضي: ${gtLabel.ar} (${billedRoutes} مسارات، ${modeAr})`
          : `النقل الأرضي (${billedRoutes} مسارات، ${modeAr})`,
      },
      amountUSD: transportAmount,
    });
  }

  const coordinationAmount = roundMoney(220 * mult);
  items.push({
    label: { en: "Care coordination & follow-up", ar: "تنسيق الرعاية والمتابعة" },
    amountUSD: coordinationAmount,
  });

  const totalUSD = items.reduce((s, i) => s + i.amountUSD, 0);

  const isB2c = input.clientType === "b2c";
  const pctRaw = getCrmSettingsSync().quotationRules.downpaymentPercentB2c;
  const pct =
    typeof pctRaw === "number" && Number.isFinite(pctRaw)
      ? Math.min(100, Math.max(0, pctRaw))
      : 22;
  const downpaymentRequired = isB2c && pct > 0;
  const downpaymentUSD = downpaymentRequired
    ? roundMoney(Math.min(Math.max((totalUSD * pct) / 100, 400), totalUSD * 0.5))
    : undefined;

  let hotelMeta = 0;
  if (input.hotel?.id && input.hotel.pricePerNightUSD > 0) {
    const defaultNights = computeQuotationAccommodationNights(
      input.treatmentSlug,
      input.packageTier,
      quoteAreaZone,
    );
    const nights = clampInt(input.hotel.nights ?? defaultNights, 1, 90);
    const guests = clampInt(input.hotel.guests ?? 2, 1, 20);
    hotelMeta = computeQuotationAccommodationLineUsd({
      pricePerNightUSD: input.hotel.pricePerNightUSD,
      nights,
      guests,
      includedGuests: input.hotel.includedGuests,
      guestSurchargePerNightUSD: input.hotel.guestSurchargePerNightUSD,
    });
  }

  return {
    items,
    totalUSD,
    downpaymentRequired,
    downpaymentUSD,
    termsAndConditions: DEFAULT_QUOTATION_TERMS,
    _meta: {
      procedure,
      hospital: input.hospitalId ? hospitalAmount : 0,
      hotel: hotelMeta,
      transport: transportAmount,
      coordination: coordinationAmount,
    },
  };
}

/** Preview USD for doctor card (same rules as quotation procedure line). */
export function previewQuotationProcedureUsd(
  treatmentSlug: string,
  packageTier: PackageTier,
  doctorId: string | null | undefined,
): number {
  const mult = TIER_MULT[packageTier];
  const base = defaultTreatmentBaseUsd(treatmentSlug);
  const delta = doctorId ? getQuotationDoctorProcedureDeltaUsd(doctorId) : 0;
  return roundMoney((base + delta) * mult);
}

/** Preview USD for hospital card (facility line before other logistics). */
export function previewQuotationHospitalFacilityUsd(
  packageTier: PackageTier,
  hospitalId: string | null | undefined,
): number {
  if (!hospitalId) return 0;
  const mult = TIER_MULT[packageTier];
  return roundMoney(getQuotationHospitalFacilityBaseUsd(hospitalId) * mult);
}

/** Estimated accommodation total for wizard cards — same formula as quotation line. */
export function previewQuotationAccommodationUsd(
  option: Pick<
    QuotationHotelOption,
    "pricePerNightUSD" | "includedGuests" | "guestSurchargePerNightUSD"
  >,
  nights: number,
  guests: number,
): number {
  return computeQuotationAccommodationLineUsd({
    pricePerNightUSD: option.pricePerNightUSD,
    nights: clampInt(nights, 1, 90),
    guests: clampInt(guests, 1, 20),
    includedGuests: option.includedGuests,
    guestSurchargePerNightUSD: option.guestSurchargePerNightUSD,
  });
}

export type BuildPatientEstimateInput = {
  treatmentSlug: string;
  countryBand: EstimateCountryBand;
  areaZone: EstimateAreaZone;
  timing: EstimateTimingPreference;
  travelerCount: number;
  includeFlights: boolean;
  includeAccommodation: boolean;
  includeTransport: boolean;
  doctorSelected: boolean;
  hospitalSelected: boolean;
};

export type PatientEstimateBreakdownLine = {
  key: "treatment" | "flights" | "accommodation" | "transport";
  label: { en: string; ar: string };
  minUSD: number;
  maxUSD: number;
  included: boolean;
};

export type BuildPatientEstimateResult = {
  lines: PatientEstimateBreakdownLine[];
  totalMinUSD: number;
  totalMaxUSD: number;
};

function roundRange(value: number): number {
  return Math.max(0, Math.round(value));
}

function applyPct(value: number, pct: number): number {
  return value * (1 + pct / 100);
}

export function buildPatientEstimateRange(
  input: BuildPatientEstimateInput,
): BuildPatientEstimateResult {
  const settings = getCrmSettingsSync().estimateParameters;
  const treatmentBase = defaultTreatmentBaseUsd(input.treatmentSlug);
  const timingMultiplier = settings.timingMultipliers[input.timing] ?? 1;
  const normalizedTravelerCount = Number.isFinite(input.travelerCount)
    ? Math.max(1, Math.floor(input.travelerCount))
    : 1;
  const travelerMultiplier =
    1 + (normalizedTravelerCount - 1) * (settings.travelerAdditionalPct / 100);
  const tripCount = getTreatmentTripCountFromSettings(input.treatmentSlug);

  let treatmentMin = treatmentBase * 0.85;
  let treatmentMax = treatmentBase * 1.2;
  if (input.doctorSelected) {
    treatmentMin = applyPct(treatmentMin, settings.doctorAdjustmentPct / 2);
    treatmentMax = applyPct(treatmentMax, settings.doctorAdjustmentPct);
  }
  if (input.hospitalSelected) {
    treatmentMin = applyPct(treatmentMin, settings.hospitalAdjustmentPct / 2);
    treatmentMax = applyPct(treatmentMax, settings.hospitalAdjustmentPct);
  }
  treatmentMin *= timingMultiplier;
  treatmentMax *= timingMultiplier;

  const flight = settings.countryBandFlightRanges[input.countryBand];
  const flightsMin = input.includeFlights ? flight.min * normalizedTravelerCount : 0;
  const flightsMax = input.includeFlights ? flight.max * normalizedTravelerCount : 0;

  const stayNights = computeDefaultStayNightsFromTrips(tripCount);
  const accommodation = settings.areaAccommodationRanges[input.areaZone];
  const accommodationMin = input.includeAccommodation
    ? accommodation.min * stayNights * travelerMultiplier
    : 0;
  const accommodationMax = input.includeAccommodation
    ? accommodation.max * stayNights * travelerMultiplier
    : 0;

  const transport = settings.areaTransportRanges[input.areaZone];
  const transportMin = input.includeTransport ? transport.min * tripCount : 0;
  const transportMax = input.includeTransport ? transport.max * tripCount : 0;

  const lines: PatientEstimateBreakdownLine[] = [
    {
      key: "treatment",
      label: { en: "Treatment package", ar: "حزمة العلاج" },
      minUSD: roundRange(treatmentMin),
      maxUSD: roundRange(treatmentMax),
      included: true,
    },
    {
      key: "flights",
      label: { en: "Flights", ar: "الطيران" },
      minUSD: roundRange(flightsMin),
      maxUSD: roundRange(flightsMax),
      included: input.includeFlights,
    },
    {
      key: "accommodation",
      label: { en: "Accommodation", ar: "الإقامة" },
      minUSD: roundRange(accommodationMin),
      maxUSD: roundRange(accommodationMax),
      included: input.includeAccommodation,
    },
    {
      key: "transport",
      label: { en: "Ground transport", ar: "التنقل الداخلي" },
      minUSD: roundRange(transportMin),
      maxUSD: roundRange(transportMax),
      included: input.includeTransport,
    },
  ];

  return {
    lines,
    totalMinUSD: lines.reduce((sum, line) => sum + line.minUSD, 0),
    totalMaxUSD: lines.reduce((sum, line) => sum + line.maxUSD, 0),
  };
}
