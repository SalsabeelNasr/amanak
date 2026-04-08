import type { Hospital } from "@/types";
import { applyMockDelay } from "./mock-delay";

const HOSPITALS: Hospital[] = [
  {
    id: "h1",
    slug: "cairo-international-medical",
    name: "Cairo International Medical Center",
    destinationSlug: "cairo",
    specialtyKeys: ["treatments.items.diabetic_foot.title"],
    descriptionKey: "hospitals.h1.description",
  },
  {
    id: "h2",
    slug: "nile-orthopedic",
    name: "Nile Orthopedic Institute",
    destinationSlug: "cairo",
    specialtyKeys: [
      "treatments.items.joint_replacement.title",
      "treatments.items.oncology.title",
    ],
    descriptionKey: "hospitals.h2.description",
  },
  {
    id: "h3",
    slug: "alex-fertility",
    name: "Alexandria Fertility & IVF Center",
    destinationSlug: "alexandria",
    specialtyKeys: ["treatments.items.ivf.title"],
    descriptionKey: "hospitals.h3.description",
  },
];

export async function listHospitals(options?: {
  simulateDelay?: boolean;
}): Promise<Hospital[]> {
  await applyMockDelay(options?.simulateDelay);
  return [...HOSPITALS];
}

export async function getHospitalBySlug(
  slug: string,
  options?: { simulateDelay?: boolean },
): Promise<Hospital | undefined> {
  await applyMockDelay(options?.simulateDelay);
  return HOSPITALS.find((h) => h.slug === slug);
}
