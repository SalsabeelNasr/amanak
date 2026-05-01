import { getTreatmentBySlugSync } from "@/lib/api/treatments";

/** Localized treatment title for patient UI, or a readable fallback when the slug is unknown. */
export function patientTreatmentTitle(slug: string, tTreatments: (key: string) => string): string {
  const meta = getTreatmentBySlugSync(slug);
  if (!meta) {
    return slug
      .split("-")
      .map((w) => (w.length ? w[0]!.toUpperCase() + w.slice(1) : w))
      .join(" ");
  }
  return tTreatments(`items.${meta.id}.title`);
}
