import type { Doctor } from "@/types";
import { applyMockDelay } from "./mock-delay";

const DOCTORS: Doctor[] = [
  {
    id: "rashad_bishara",
    nameKey: "doctors.items.rashad_bishara.name",
    titleKey: "doctors.items.rashad_bishara.title",
    website: "https://eavla.org/rashad-bishara/",
  },
  {
    id: "ayman_samadony",
    nameKey: "doctors.items.ayman_samadony.name",
    titleKey: "doctors.items.ayman_samadony.title",
    image: "/doctors/a92f89ac-5ea2-487c-a2e1-babee8e6ac17.jpg",
    website: "https://medoc.care/en/doctors/prof-ayman-salem",
  },
  {
    id: "hussein_alwan",
    nameKey: "doctors.items.hussein_alwan.name",
    titleKey: "doctors.items.hussein_alwan.title",
    website: "https://drhusseinelwan.com/",
  },
  {
    id: "tamer_el_nahas",
    nameKey: "doctors.items.tamer_el_nahas.name",
    titleKey: "doctors.items.tamer_el_nahas.title",
    website: "https://www.sphinxcure.com/our-team.html",
  },
  {
    id: "ahmed_elashry",
    nameKey: "doctors.items.ahmed_elashry.name",
    titleKey: "doctors.items.ahmed_elashry.title",
    image:
      "https://dashboard.macro.care/assets/ba621a0f-fe8a-4b4e-854b-d2f441a8cfcb?format=webp&quality=100",
    website: "https://macro.care/en/partners/prof-dr-mohamed-saad-el-ashry",
  },
  {
    id: "nasser_loza",
    nameKey: "doctors.items.nasser_loza.name",
    titleKey: "doctors.items.nasser_loza.title",
    website: "https://maadipsychologycenter.com/team/nasser-loza/",
  },
  {
    id: "mahmoud_hafez",
    nameKey: "doctors.items.mahmoud_hafez.name",
    titleKey: "doctors.items.mahmoud_hafez.title",
    facebook: "https://www.facebook.com/Prof.MahmoudHafez",
    website: "http://www.mhafez.net/",
  },
  {
    id: "mohamed_fawzy_khattab",
    nameKey: "doctors.items.mohamed_fawzy_khattab.name",
    titleKey: "doctors.items.mohamed_fawzy_khattab.title",
    website: "https://www.assih.com/en/doctors/dr-mohamed-fawzy-khattab",
  },
  {
    id: "fouad_zamel_sadek",
    nameKey: "doctors.items.fouad_zamel_sadek.name",
    titleKey: "doctors.items.fouad_zamel_sadek.title",
    website: "https://pelvisandhip.com/",
  },
  {
    id: "mohamed_aboulghar",
    nameKey: "doctors.items.mohamed_aboulghar.name",
    titleKey: "doctors.items.mohamed_aboulghar.title",
    facebook: "https://www.facebook.com/EgyptianIVFCenter",
    website: "https://egyptianivfcenter.com/",
  },
  {
    id: "maged_adel_aziz",
    nameKey: "doctors.items.maged_adel_aziz.name",
    titleKey: "doctors.items.maged_adel_aziz.title",
    website: "https://www.bedayahospitals.com/en/dr-maged-adel",
  },
  {
    id: "mahmoud_zakaria",
    nameKey: "doctors.items.mahmoud_zakaria.name",
    titleKey: "doctors.items.mahmoud_zakaria.title",
    facebook: "https://www.facebook.com/Dr.Mahmoud.Zakaria/",
    website: "https://drsemna.com/en/",
  },
  {
    id: "tamer_abdelbaki",
    nameKey: "doctors.items.tamer_abdelbaki.name",
    titleKey: "doctors.items.tamer_abdelbaki.title",
    website: "https://drtamerabdelbaki.com/",
  },
  {
    id: "yasser_badi",
    nameKey: "doctors.items.yasser_badi.name",
    titleKey: "doctors.items.yasser_badi.title",
    instagram: "https://www.instagram.com/dryasserbadi/",
    website: "https://dryasserbadi.net/en/",
  },
  {
    id: "mohamed_abdallah_tawfik",
    nameKey: "doctors.items.mohamed_abdallah_tawfik.name",
    titleKey: "doctors.items.mohamed_abdallah_tawfik.title",
    website: "https://mohamed-taw-fik-doctor.com/",
  },
  {
    id: "john_elia",
    nameKey: "doctors.items.john_elia.name",
    titleKey: "doctors.items.john_elia.title",
    website: "https://www.dentalexpresscenter.com/about/meet-the-team/dr-john-elia",
  },
  {
    id: "ahmed_saeed",
    nameKey: "doctors.items.ahmed_saeed.name",
    titleKey: "doctors.items.ahmed_saeed.title",
    website: "https://wondersdentistry.com/en/dr-ahmed-saeed/",
  },
  {
    id: "shady_el_maghraby",
    nameKey: "doctors.items.shady_el_maghraby.name",
    titleKey: "doctors.items.shady_el_maghraby.title",
    website: "https://www.hairegypt.net/",
  },
  {
    id: "marwan_noureldin",
    nameKey: "doctors.items.marwan_noureldin.name",
    titleKey: "doctors.items.marwan_noureldin.title",
    website: "https://www.nour-clinic.com/",
  },
  {
    id: "ahmed_rezk",
    nameKey: "doctors.items.ahmed_rezk.name",
    titleKey: "doctors.items.ahmed_rezk.title",
    website: "https://drahmedrezk.com/en/home/",
  },
  {
    id: "mohamed_al_ghannam",
    nameKey: "doctors.items.mohamed_al_ghannam.name",
    titleKey: "doctors.items.mohamed_al_ghannam.title",
    website: "https://mohamedelghanam.com/en/the-best-cardiothoracic-surgeon/",
  },
  {
    id: "hossam_fathi",
    nameKey: "doctors.items.hossam_fathi.name",
    titleKey: "doctors.items.hossam_fathi.title",
    website: "https://misrconnect.com/en/profiles/1152",
  },
  {
    id: "ahmad_khalil",
    nameKey: "doctors.items.ahmad_khalil.name",
    titleKey: "doctors.items.ahmad_khalil.title",
    website: "https://eyecairo.com/",
  },
  {
    id: "hazem_helmy",
    nameKey: "doctors.items.hazem_helmy.name",
    titleKey: "doctors.items.hazem_helmy.title",
    website: "https://drhazemhelmy.com/en/",
  },
  {
    id: "magd_zakaria",
    nameKey: "doctors.items.magd_zakaria.name",
    titleKey: "doctors.items.magd_zakaria.title",
    website: "https://neurologyacademy.org/profiles/prof-magd-zakaria",
  },
  {
    id: "ahmed_elbassiouny",
    nameKey: "doctors.items.ahmed_elbassiouny.name",
    titleKey: "doctors.items.ahmed_elbassiouny.title",
    website: "https://www.ahmedelbassiouny.com/about-us/",
  },
  {
    id: "walid_elhalaby",
    nameKey: "doctors.items.walid_elhalaby.name",
    titleKey: "doctors.items.walid_elhalaby.title",
    website: "https://en.coreclinics.com/core-clinics-doctors/dr-walid-elhalaby-neurosurgeon-egypt/",
  },
  {
    id: "hesham_elghazaly",
    nameKey: "doctors.items.hesham_elghazaly.name",
    titleKey: "doctors.items.hesham_elghazaly.title",
    website: "https://alfacurecenter.com/en/doctors/professor-hesham-elghazaly/",
  },
  {
    id: "hatem_azim",
    nameKey: "doctors.items.hatem_azim.name",
    titleKey: "doctors.items.hatem_azim.title",
    website: "https://www.cairocure.com/about/dr-hatem-a-azim-md-phd",
  },
  {
    id: "mohamed_mohi_eldin",
    nameKey: "doctors.items.mohamed_mohi_eldin.name",
    titleKey: "doctors.items.mohamed_mohi_eldin.title",
    website: "https://www.mohamedmohieldin.com/about-us/",
  },
  {
    id: "mohamed_hossam_eldin",
    nameKey: "doctors.items.mohamed_hossam_eldin.name",
    titleKey: "doctors.items.mohamed_hossam_eldin.title",
    website: "https://drmohamedhossam.com/",
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
