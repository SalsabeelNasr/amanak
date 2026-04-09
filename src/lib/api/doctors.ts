import type { Doctor } from "@/types";
import { applyMockDelay } from "./mock-delay";

const DOCTORS: Doctor[] = [
  {
    id: "rashad_bishara",
    nameKey: "doctors.items.rashad_bishara.name",
    titleKey: "doctors.items.rashad_bishara.title",
    image: "/doctors/rashad-bishara.jpg",
    instagram: "https://www.instagram.com/drrashadbishara/",
  },
  {
    id: "ayman_samadony",
    nameKey: "doctors.items.ayman_samadony.name",
    titleKey: "doctors.items.ayman_samadony.title",
    image: "/doctors/ayman-samadony.jpg",
    instagram: "https://www.instagram.com/dr.ayman.elsamadony/",
  },
  {
    id: "hussein_alwan",
    nameKey: "doctors.items.hussein_alwan.name",
    titleKey: "doctors.items.hussein_alwan.title",
    image: "/doctors/hussein-alwan.jpg",
    instagram: "https://www.instagram.com/drhusseinalwan/",
  },
  {
    id: "mohamed_aboulghar",
    nameKey: "doctors.items.mohamed_aboulghar.name",
    titleKey: "doctors.items.mohamed_aboulghar.title",
    image: "/doctors/mohamed-aboulghar.jpg",
    instagram: "https://www.instagram.com/dr.mohamedaboulghar/",
  },
  {
    id: "sherif_pasha",
    nameKey: "doctors.items.sherif_pasha.name",
    titleKey: "doctors.items.sherif_pasha.title",
    image: "/doctors/sherif-pasha.jpg",
    instagram: "https://www.instagram.com/dr.sherifpasha/",
  },
  {
    id: "ismail_aboul_fotouh",
    nameKey: "doctors.items.ismail_aboul_fotouh.name",
    titleKey: "doctors.items.ismail_aboul_fotouh.title",
    image: "/doctors/ismail-aboul-fotouh.jpg",
    instagram: "https://www.instagram.com/dr.ismailaboulfotouh/",
  },
  {
    id: "tamer_el_nahas",
    nameKey: "doctors.items.tamer_el_nahas.name",
    titleKey: "doctors.items.tamer_el_nahas.title",
    image: "/doctors/tamer-el-nahas.jpg",
    instagram: "https://www.instagram.com/dr.tamernelnahas/",
  },
  {
    id: "mahmoud_hafez",
    nameKey: "doctors.items.mahmoud_hafez.name",
    titleKey: "doctors.items.mahmoud_hafez.title",
    image: "/doctors/mahmoud-hafez.jpg",
    instagram: "https://www.instagram.com/dr.mahmoudhafez/",
  },
  {
    id: "nasser_loza",
    nameKey: "doctors.items.nasser_loza.name",
    titleKey: "doctors.items.nasser_loza.title",
    image: "/doctors/nasser-loza.jpg",
    instagram: "https://www.instagram.com/dr.nasserloza/",
  },
];

export async function listDoctors(options?: { simulateDelay?: boolean }): Promise<Doctor[]> {
  await applyMockDelay(options?.simulateDelay);
  return [...DOCTORS];
}

export async function getDoctorsByIds(
  ids: string[],
  options?: { simulateDelay?: boolean },
): Promise<Doctor[]> {
  await applyMockDelay(options?.simulateDelay);
  return DOCTORS.filter((d) => ids.includes(d.id));
}

export function listDoctorIdsSync(): string[] {
  return DOCTORS.map((d) => d.id);
}
