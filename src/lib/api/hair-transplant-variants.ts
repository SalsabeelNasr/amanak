/** Modalities for `/treatments/hair-transplant`; subset `doctorIds` vs full roster → carousel “Leading focus”. */
export type HairTransplantVariant = {
  id: "fue_extraction" | "fut_transplantation" | "dhi_implantation" | "robotic_hair_transplant";
  titleKey: string;
  descriptionKey: string;
  bodyKey: string;
  priceUSD: number;
  doctorIds: readonly string[];
};

export const HAIR_TRANSPLANT_VARIANTS: readonly HairTransplantVariant[] = [
  {
    id: "fue_extraction",
    titleKey: "treatments.items.fue_extraction.title",
    descriptionKey: "treatments.items.fue_extraction.description",
    bodyKey: "treatments.items.fue_extraction.body",
    priceUSD: 600,
    doctorIds: ["shady_el_maghraby"],
  },
  {
    id: "fut_transplantation",
    titleKey: "treatments.items.fut_transplantation.title",
    descriptionKey: "treatments.items.fut_transplantation.description",
    bodyKey: "treatments.items.fut_transplantation.body",
    priceUSD: 200,
    doctorIds: ["marwan_noureldin"],
  },
  {
    id: "dhi_implantation",
    titleKey: "treatments.items.dhi_implantation.title",
    descriptionKey: "treatments.items.dhi_implantation.description",
    bodyKey: "treatments.items.dhi_implantation.body",
    priceUSD: 500,
    doctorIds: ["shady_el_maghraby", "marwan_noureldin"],
  },
  {
    id: "robotic_hair_transplant",
    titleKey: "treatments.items.robotic_hair_transplant.title",
    descriptionKey: "treatments.items.robotic_hair_transplant.description",
    bodyKey: "treatments.items.robotic_hair_transplant.body",
    priceUSD: 1600,
    doctorIds: ["marwan_noureldin"],
  },
];

const LEGACY_HAIR_VIDEO_SLUGS = new Set([
  "hair-transplant",
  "fue-extraction",
  "fut-transplantation",
  "dhi-implantation",
  "robotic-hair-transplant",
]);

export function isMergedHairTransplantTreatmentSlug(slug: string): boolean {
  return slug === "hair-transplant";
}

export function videoSlugsForHairTransplantPage(): ReadonlySet<string> {
  return LEGACY_HAIR_VIDEO_SLUGS;
}

/** Title message keys for carousel “top service” lines (subset rule vs main roster). */
export function topHairServiceTitleKeysForDoctor(
  doctorId: string,
  mainDoctorIds: readonly string[],
): string[] {
  if (!mainDoctorIds.length) return [];
  const main = new Set(mainDoctorIds);
  const keys: string[] = [];
  for (const v of HAIR_TRANSPLANT_VARIANTS) {
    if (!v.doctorIds.includes(doctorId)) continue;
    const subset =
      v.doctorIds.length > 0 &&
      v.doctorIds.length < mainDoctorIds.length &&
      v.doctorIds.every((id) => main.has(id));
    if (subset) keys.push(v.titleKey);
  }
  return keys;
}
