import type { EstimateCountryBand } from "@/lib/api/patient-estimate-catalog";

const REGIONAL_COUNTRIES = new Set([
  "egypt",
  "saudi arabia",
  "uae",
  "united arab emirates",
  "qatar",
  "kuwait",
  "oman",
  "bahrain",
  "jordan",
  "lebanon",
  "iraq",
  "sudan",
  "libya",
  "tunisia",
  "algeria",
  "morocco",
  "yemen",
  "palestine",
]);

const LONG_HAUL_COUNTRIES = new Set([
  "united states",
  "canada",
  "australia",
  "new zealand",
  "brazil",
  "argentina",
  "chile",
  "japan",
  "south korea",
  "china",
]);

/** Shared with patient onboarding and CRM quotation (flight SKU band). */
export function inferCountryBandFromCountry(country: string): EstimateCountryBand {
  const normalized = country.trim().toLowerCase();
  if (!normalized) return "regional";
  if (REGIONAL_COUNTRIES.has(normalized)) return "regional";
  if (LONG_HAUL_COUNTRIES.has(normalized)) return "long_haul";
  return "medium_haul";
}
