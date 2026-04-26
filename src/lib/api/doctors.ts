import type { Doctor } from "@/types";
import { applyMockDelay } from "./mock-delay";

const DOCTORS: Doctor[] = [
  {
    id: "rashad_bishara",
    nameKey: "doctors.items.rashad_bishara.name",
    titleKey: "doctors.items.rashad_bishara.title",
    image: "/doctors/rashad-bishara.png",
    website: "https://www.vezeeta.com/ar/dr/%D8%AF%D9%83%D8%AA%D9%88%D8%B1-%D8%B1%D8%B4%D8%A7%D8%AF-%D8%A8%D8%B4%D8%A7%D8%B1%D8%A9",
  },
  {
    id: "ayman_samadony",
    nameKey: "doctors.items.ayman_samadony.name",
    titleKey: "doctors.items.ayman_samadony.title",
    image: "/doctors/ayman-el-samadony.png",
    website: "https://medoc.care/en/doctors/prof-ayman-salem",
  },
  {
    id: "hussein_alwan",
    nameKey: "doctors.items.hussein_alwan.name",
    titleKey: "doctors.items.hussein_alwan.title",
    image: "/doctors/hussein-alwan.png",
    facebook: "https://www.facebook.com/drhusseinelwan/?locale=ar_AR",
    website: "https://drhusseinelwan.com/",
  },
  {
    id: "tamer_el_nahas",
    nameKey: "doctors.items.tamer_el_nahas.name",
    titleKey: "doctors.items.tamer_el_nahas.title",
    image: "/doctors/tamer-el-nahas.png",
    website: "https://www.sphinxcure.com/our-team.html",
  },
  {
    id: "ahmed_elashry",
    nameKey: "doctors.items.ahmed_elashry.name",
    titleKey: "doctors.items.ahmed_elashry.title",
    image: "/doctors/mohamed-saad-el-ashry.png",
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
    image: "/doctors/hatem-azim.png",
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
  {
    id: "hatem_galal_zaki",
    nameKey: "doctors.items.hatem_galal_zaki.name",
    titleKey: "doctors.items.hatem_galal_zaki.title",
  },
  {
    id: "mahmoud_abdelkarem",
    nameKey: "doctors.items.mahmoud_abdelkarem.name",
    titleKey: "doctors.items.mahmoud_abdelkarem.title",
  },
  {
    id: "mohamed_asal",
    nameKey: "doctors.items.mohamed_asal.name",
    titleKey: "doctors.items.mohamed_asal.title",
  },
  {
    id: "mohamed_mokhtar",
    nameKey: "doctors.items.mohamed_mokhtar.name",
    titleKey: "doctors.items.mohamed_mokhtar.title",
  },
  {
    id: "nasef_mohamed_nasef",
    nameKey: "doctors.items.nasef_mohamed_nasef.name",
    titleKey: "doctors.items.nasef_mohamed_nasef.title",
  },
  {
    id: "saleh_gamil",
    nameKey: "doctors.items.saleh_gamil.name",
    titleKey: "doctors.items.saleh_gamil.title",
  },
  {
    id: "ahmed_rezk_2",
    nameKey: "doctors.items.ahmed_rezk_2.name",
    titleKey: "doctors.items.ahmed_rezk_2.title",
  },
  {
    id: "mohamed_amr",
    nameKey: "doctors.items.mohamed_amr.name",
    titleKey: "doctors.items.mohamed_amr.title",
  },
  {
    id: "waleed_alnahal",
    nameKey: "doctors.items.waleed_alnahal.name",
    titleKey: "doctors.items.waleed_alnahal.title",
  },
  {
    id: "wael_samir",
    nameKey: "doctors.items.wael_samir.name",
    titleKey: "doctors.items.wael_samir.title",
  },
  {
    id: "haitham_abdelazeem",
    nameKey: "doctors.items.haitham_abdelazeem.name",
    titleKey: "doctors.items.haitham_abdelazeem.title",
  },
  {
    id: "hisham_abdelbaky",
    nameKey: "doctors.items.hisham_abdelbaky.name",
    titleKey: "doctors.items.hisham_abdelbaky.title",
  },
  {
    id: "mostafa_baraka",
    nameKey: "doctors.items.mostafa_baraka.name",
    titleKey: "doctors.items.mostafa_baraka.title",
  },
  {
    id: "mohamed_elkersh",
    nameKey: "doctors.items.mohamed_elkersh.name",
    titleKey: "doctors.items.mohamed_elkersh.title",
  },
  {
    id: "ahmed_salama",
    nameKey: "doctors.items.ahmed_salama.name",
    titleKey: "doctors.items.ahmed_salama.title",
  },
  {
    id: "waheed_yousry",
    nameKey: "doctors.items.waheed_yousry.name",
    titleKey: "doctors.items.waheed_yousry.title",
  },
  {
    id: "hany_abdelgawad",
    nameKey: "doctors.items.hany_abdelgawad.name",
    titleKey: "doctors.items.hany_abdelgawad.title",
  },
  {
    id: "yehia_bromboly",
    nameKey: "doctors.items.yehia_bromboly.name",
    titleKey: "doctors.items.yehia_bromboly.title",
  },
  {
    id: "ahmed_hosny",
    nameKey: "doctors.items.ahmed_hosny.name",
    titleKey: "doctors.items.ahmed_hosny.title",
  },
  {
    id: "mohamed_gebeily",
    nameKey: "doctors.items.mohamed_gebeily.name",
    titleKey: "doctors.items.mohamed_gebeily.title",
  },
  {
    id: "yasser_batrawy",
    nameKey: "doctors.items.yasser_batrawy.name",
    titleKey: "doctors.items.yasser_batrawy.title",
  },
  {
    id: "yasser_sadek",
    nameKey: "doctors.items.yasser_sadek.name",
    titleKey: "doctors.items.yasser_sadek.title",
  },
  {
    id: "reda_abolatta",
    nameKey: "doctors.items.reda_abolatta.name",
    titleKey: "doctors.items.reda_abolatta.title",
  },
  {
    id: "khaled_aly",
    nameKey: "doctors.items.khaled_aly.name",
    titleKey: "doctors.items.khaled_aly.title",
  },
  {
    id: "mohamed_mandour",
    nameKey: "doctors.items.mohamed_mandour.name",
    titleKey: "doctors.items.mohamed_mandour.title",
  },
  {
    id: "hossam_mansour",
    nameKey: "doctors.items.hossam_mansour.name",
    titleKey: "doctors.items.hossam_mansour.title",
  },
  {
    id: "osama_amen",
    nameKey: "doctors.items.osama_amen.name",
    titleKey: "doctors.items.osama_amen.title",
  },
  {
    id: "abdallah_alasry",
    nameKey: "doctors.items.abdallah_alasry.name",
    titleKey: "doctors.items.abdallah_alasry.title",
  },
  {
    id: "wael_kelany",
    nameKey: "doctors.items.wael_kelany.name",
    titleKey: "doctors.items.wael_kelany.title",
  },
  {
    id: "ayman_mortada",
    nameKey: "doctors.items.ayman_mortada.name",
    titleKey: "doctors.items.ayman_mortada.title",
  },
  {
    id: "mervat_abolmaaty",
    nameKey: "doctors.items.mervat_abolmaaty.name",
    titleKey: "doctors.items.mervat_abolmaaty.title",
  },
  {
    id: "ghalia_almhanny",
    nameKey: "doctors.items.ghalia_almhanny.name",
    titleKey: "doctors.items.ghalia_almhanny.title",
  },
  {
    id: "tarek_abdelsalam",
    nameKey: "doctors.items.tarek_abdelsalam.name",
    titleKey: "doctors.items.tarek_abdelsalam.title",
  },
  {
    id: "mohamed_damaty",
    nameKey: "doctors.items.mohamed_damaty.name",
    titleKey: "doctors.items.mohamed_damaty.title",
  },
  {
    id: "tarek_rasheed",
    nameKey: "doctors.items.tarek_rasheed.name",
    titleKey: "doctors.items.tarek_rasheed.title",
  },
  {
    id: "ahmed_alsawaah",
    nameKey: "doctors.items.ahmed_alsawaah.name",
    titleKey: "doctors.items.ahmed_alsawaah.title",
  },
  {
    id: "nabil_farag",
    nameKey: "doctors.items.nabil_farag.name",
    titleKey: "doctors.items.nabil_farag.title",
  },
  {
    id: "tamer_alnahas",
    nameKey: "doctors.items.tamer_alnahas.name",
    titleKey: "doctors.items.tamer_alnahas.title",
  },
  {
    id: "emad_ebeid",
    nameKey: "doctors.items.emad_ebeid.name",
    titleKey: "doctors.items.emad_ebeid.title",
  },
  {
    id: "emad_barsoum",
    nameKey: "doctors.items.emad_barsoum.name",
    titleKey: "doctors.items.emad_barsoum.title",
  },
  {
    id: "ramy_ghali",
    nameKey: "doctors.items.ramy_ghali.name",
    titleKey: "doctors.items.ramy_ghali.title",
  },
  {
    id: "ola_khorshid",
    nameKey: "doctors.items.ola_khorshid.name",
    titleKey: "doctors.items.ola_khorshid.title",
  },
  {
    id: "karim_mashhour",
    nameKey: "doctors.items.karim_mashhour.name",
    titleKey: "doctors.items.karim_mashhour.title",
  },
  {
    id: "hamdy_abdelazeem",
    nameKey: "doctors.items.hamdy_abdelazeem.name",
    titleKey: "doctors.items.hamdy_abdelazeem.title",
  },
  {
    id: "lobna_ezz_elarab",
    nameKey: "doctors.items.lobna_ezz_elarab.name",
    titleKey: "doctors.items.lobna_ezz_elarab.title",
  },
  {
    id: "yasser_moustafa",
    nameKey: "doctors.items.yasser_moustafa.name",
    titleKey: "doctors.items.yasser_moustafa.title",
  },
  {
    id: "nasr_hafez",
    nameKey: "doctors.items.nasr_hafez.name",
    titleKey: "doctors.items.nasr_hafez.title",
  },
  {
    id: "hossam_hosny",
    nameKey: "doctors.items.hossam_hosny.name",
    titleKey: "doctors.items.hossam_hosny.title",
  },
  {
    id: "gehan_alasal",
    nameKey: "doctors.items.gehan_alasal.name",
    titleKey: "doctors.items.gehan_alasal.title",
  },
  {
    id: "mohamed_awad_tag_eldin",
    nameKey: "doctors.items.mohamed_awad_tag_eldin.name",
    titleKey: "doctors.items.mohamed_awad_tag_eldin.title",
  },
  {
    id: "emad_qoraa",
    nameKey: "doctors.items.emad_qoraa.name",
    titleKey: "doctors.items.emad_qoraa.title",
  },
  {
    id: "ashraf_madkour",
    nameKey: "doctors.items.ashraf_madkour.name",
    titleKey: "doctors.items.ashraf_madkour.title",
  },
  {
    id: "ashraf_almaraghy",
    nameKey: "doctors.items.ashraf_almaraghy.name",
    titleKey: "doctors.items.ashraf_almaraghy.title",
  },
  {
    id: "mahmoud_zorkany",
    nameKey: "doctors.items.mahmoud_zorkany.name",
    titleKey: "doctors.items.mahmoud_zorkany.title",
  },
  {
    id: "hany_hassan",
    nameKey: "doctors.items.hany_hassan.name",
    titleKey: "doctors.items.hany_hassan.title",
  },
  {
    id: "tarek_mohsen",
    nameKey: "doctors.items.tarek_mohsen.name",
    titleKey: "doctors.items.tarek_mohsen.title",
  },
  {
    id: "mohamed_hussein",
    nameKey: "doctors.items.mohamed_hussein.name",
    titleKey: "doctors.items.mohamed_hussein.title",
  },
  {
    id: "ahmed_mostafa",
    nameKey: "doctors.items.ahmed_mostafa.name",
    titleKey: "doctors.items.ahmed_mostafa.title",
  },
  {
    id: "ahmed_elnouri",
    nameKey: "doctors.items.ahmed_elnouri.name",
    titleKey: "doctors.items.ahmed_elnouri.title",
  },
  {
    id: "mohamed_abdelgayed",
    nameKey: "doctors.items.mohamed_abdelgayed.name",
    titleKey: "doctors.items.mohamed_abdelgayed.title",
  },
  {
    id: "tarek_helmy",
    nameKey: "doctors.items.tarek_helmy.name",
    titleKey: "doctors.items.tarek_helmy.title",
  },
  {
    id: "yasser_elnahas",
    nameKey: "doctors.items.yasser_elnahas.name",
    titleKey: "doctors.items.yasser_elnahas.title",
  },
  {
    id: "mohamed_ghannam",
    nameKey: "doctors.items.mohamed_ghannam.name",
    titleKey: "doctors.items.mohamed_ghannam.title",
  },
  {
    id: "osama_abbas",
    nameKey: "doctors.items.osama_abbas.name",
    titleKey: "doctors.items.osama_abbas.title",
  },
  {
    id: "saeed_abdelaziz",
    nameKey: "doctors.items.saeed_abdelaziz.name",
    titleKey: "doctors.items.saeed_abdelaziz.title",
  },
  {
    id: "tarek_eltaweel",
    nameKey: "doctors.items.tarek_eltaweel.name",
    titleKey: "doctors.items.tarek_eltaweel.title",
  },
  {
    id: "ahmed_gabr",
    nameKey: "doctors.items.ahmed_gabr.name",
    titleKey: "doctors.items.ahmed_gabr.title",
  },
  {
    id: "hossam_salah",
    nameKey: "doctors.items.hossam_salah.name",
    titleKey: "doctors.items.hossam_salah.title",
  },
  {
    id: "adel_hasanen",
    nameKey: "doctors.items.adel_hasanen.name",
    titleKey: "doctors.items.adel_hasanen.title",
  },
  {
    id: "dina_zamzam",
    nameKey: "doctors.items.dina_zamzam.name",
    titleKey: "doctors.items.dina_zamzam.title",
  },
  {
    id: "ahmed_abdelaleem",
    nameKey: "doctors.items.ahmed_abdelaleem.name",
    titleKey: "doctors.items.ahmed_abdelaleem.title",
  },
  {
    id: "ahmed_elsaeed",
    nameKey: "doctors.items.ahmed_elsaeed.name",
    titleKey: "doctors.items.ahmed_elsaeed.title",
  },
  {
    id: "azza_abdelnaseer",
    nameKey: "doctors.items.azza_abdelnaseer.name",
    titleKey: "doctors.items.azza_abdelnaseer.title",
  },
  {
    id: "ahmed_esmat",
    nameKey: "doctors.items.ahmed_esmat.name",
    titleKey: "doctors.items.ahmed_esmat.title",
  },
  {
    id: "amr_saeed",
    nameKey: "doctors.items.amr_saeed.name",
    titleKey: "doctors.items.amr_saeed.title",
  },
  {
    id: "assem_mounir",
    nameKey: "doctors.items.assem_mounir.name",
    titleKey: "doctors.items.assem_mounir.title",
  },
  {
    id: "mostafada_farid",
    nameKey: "doctors.items.mostafada_farid.name",
    titleKey: "doctors.items.mostafada_farid.title",
  },
  {
    id: "mahmoud_hemeda",
    nameKey: "doctors.items.mahmoud_hemeda.name",
    titleKey: "doctors.items.mahmoud_hemeda.title",
  },
  {
    id: "tarek_lotfy",
    nameKey: "doctors.items.tarek_lotfy.name",
    titleKey: "doctors.items.tarek_lotfy.title",
  },
  {
    id: "mazen_thabet",
    nameKey: "doctors.items.mazen_thabet.name",
    titleKey: "doctors.items.mazen_thabet.title",
  },
  {
    id: "ahmed_sameh_nada",
    nameKey: "doctors.items.ahmed_sameh_nada.name",
    titleKey: "doctors.items.ahmed_sameh_nada.title",
  },
  {
    id: "ahmed_maamoun",
    nameKey: "doctors.items.ahmed_maamoun.name",
    titleKey: "doctors.items.ahmed_maamoun.title",
  },
  {
    id: "ahmed_faisal_toubar",
    nameKey: "doctors.items.ahmed_faisal_toubar.name",
    titleKey: "doctors.items.ahmed_faisal_toubar.title",
  },
  {
    id: "moahamed_elmashad",
    nameKey: "doctors.items.moahamed_elmashad.name",
    titleKey: "doctors.items.moahamed_elmashad.title",
  },
  {
    id: "amr_hassan",
    nameKey: "doctors.items.amr_hassan.name",
    titleKey: "doctors.items.amr_hassan.title",
  },
  {
    id: "salah_hamada",
    nameKey: "doctors.items.salah_hamada.name",
    titleKey: "doctors.items.salah_hamada.title",
  },
  {
    id: "osama_alghanam",
    nameKey: "doctors.items.osama_alghanam.name",
    titleKey: "doctors.items.osama_alghanam.title",
  },
  {
    id: "ahmed_zahran",
    nameKey: "doctors.items.ahmed_zahran.name",
    titleKey: "doctors.items.ahmed_zahran.title",
  },
  {
    id: "ahmed_abdelaziz",
    nameKey: "doctors.items.ahmed_abdelaziz.name",
    titleKey: "doctors.items.ahmed_abdelaziz.title",
  },
  {
    id: "mohamed_abdelrazek",
    nameKey: "doctors.items.mohamed_abdelrazek.name",
    titleKey: "doctors.items.mohamed_abdelrazek.title",
  },
  {
    id: "mohamed_nada",
    nameKey: "doctors.items.mohamed_nada.name",
    titleKey: "doctors.items.mohamed_nada.title",
  },
  {
    id: "mohy_albanna",
    nameKey: "doctors.items.mohy_albanna.name",
    titleKey: "doctors.items.mohy_albanna.title",
  },
  {
    id: "alaa_eldin_hussein",
    nameKey: "doctors.items.alaa_eldin_hussein.name",
    titleKey: "doctors.items.alaa_eldin_hussein.title",
  },
  {
    id: "tarek_elnaggar",
    nameKey: "doctors.items.tarek_elnaggar.name",
    titleKey: "doctors.items.tarek_elnaggar.title",
  },
  {
    id: "ahmed_shukry",
    nameKey: "doctors.items.ahmed_shukry.name",
    titleKey: "doctors.items.ahmed_shukry.title",
  },
  {
    id: "hossam_elfol",
    nameKey: "doctors.items.hossam_elfol.name",
    titleKey: "doctors.items.hossam_elfol.title",
  },
  {
    id: "haitham_fekry",
    nameKey: "doctors.items.haitham_fekry.name",
    titleKey: "doctors.items.haitham_fekry.title",
  },
  {
    id: "abdelwahab_raafat",
    nameKey: "doctors.items.abdelwahab_raafat.name",
    titleKey: "doctors.items.abdelwahab_raafat.title",
  },
  {
    id: "moahmed_zidan",
    nameKey: "doctors.items.moahmed_zidan.name",
    titleKey: "doctors.items.moahmed_zidan.title",
  },
  {
    id: "asseem_barashy",
    nameKey: "doctors.items.asseem_barashy.name",
    titleKey: "doctors.items.asseem_barashy.title",
  },
  {
    id: "ahmed_farahat",
    nameKey: "doctors.items.ahmed_farahat.name",
    titleKey: "doctors.items.ahmed_farahat.title",
  },
  {
    id: "ayman_abdelwahab",
    nameKey: "doctors.items.ayman_abdelwahab.name",
    titleKey: "doctors.items.ayman_abdelwahab.title",
  },
  {
    id: "ashraf_alziat",
    nameKey: "doctors.items.ashraf_alziat.name",
    titleKey: "doctors.items.ashraf_alziat.title",
  },
  {
    id: "ashraf_elzoghby",
    nameKey: "doctors.items.ashraf_elzoghby.name",
    titleKey: "doctors.items.ashraf_elzoghby.title",
  },
  {
    id: "mamdouh_abdelsalam",
    nameKey: "doctors.items.mamdouh_abdelsalam.name",
    titleKey: "doctors.items.mamdouh_abdelsalam.title",
  },
  {
    id: "sherif_essam",
    nameKey: "doctors.items.sherif_essam.name",
    titleKey: "doctors.items.sherif_essam.title",
  },
  {
    id: "atef_abdelhamid",
    nameKey: "doctors.items.atef_abdelhamid.name",
    titleKey: "doctors.items.atef_abdelhamid.title",
  },
  {
    id: "mohamed_isameil",
    nameKey: "doctors.items.mohamed_isameil.name",
    titleKey: "doctors.items.mohamed_isameil.title",
  },
  {
    id: "nehad_fouad",
    nameKey: "doctors.items.nehad_fouad.name",
    titleKey: "doctors.items.nehad_fouad.title",
  },
  {
    id: "yasser_elsayed",
    nameKey: "doctors.items.yasser_elsayed.name",
    titleKey: "doctors.items.yasser_elsayed.title",
  },
  {
    id: "hesham_bassiouny",
    nameKey: "doctors.items.hesham_bassiouny.name",
    titleKey: "doctors.items.hesham_bassiouny.title",
  },
  {
    id: "osama_taha",
    nameKey: "doctors.items.osama_taha.name",
    titleKey: "doctors.items.osama_taha.title",
  },
  {
    id: "khaled_gawdat",
    nameKey: "doctors.items.khaled_gawdat.name",
    titleKey: "doctors.items.khaled_gawdat.title",
  },
  {
    id: "ahmed_elmasry",
    nameKey: "doctors.items.ahmed_elmasry.name",
    titleKey: "doctors.items.ahmed_elmasry.title",
  },
  {
    id: "mohamed_matar",
    nameKey: "doctors.items.mohamed_matar.name",
    titleKey: "doctors.items.mohamed_matar.title",
  },
  {
    id: "hossam_tahseen",
    nameKey: "doctors.items.hossam_tahseen.name",
    titleKey: "doctors.items.hossam_tahseen.title",
  },
  {
    id: "mohamed_elghalban",
    nameKey: "doctors.items.mohamed_elghalban.name",
    titleKey: "doctors.items.mohamed_elghalban.title",
  },
  {
    id: "sara_abdallah",
    nameKey: "doctors.items.sara_abdallah.name",
    titleKey: "doctors.items.sara_abdallah.title",
  },
  {
    id: "mukhibat",
    nameKey: "doctors.items.mukhibat.name",
    titleKey: "doctors.items.mukhibat.title",
  },
  {
    id: "mohamed_mamdouh",
    nameKey: "doctors.items.mohamed_mamdouh.name",
    titleKey: "doctors.items.mohamed_mamdouh.title",
  },
  {
    id: "obada_samanody",
    nameKey: "doctors.items.obada_samanody.name",
    titleKey: "doctors.items.obada_samanody.title",
  },
  {
    id: "samir_ghoraba",
    nameKey: "doctors.items.samir_ghoraba.name",
    titleKey: "doctors.items.samir_ghoraba.title",
  },
  {
    id: "khaled_sami",
    nameKey: "doctors.items.khaled_sami.name",
    titleKey: "doctors.items.khaled_sami.title",
  },
  {
    id: "wael_ghannem",
    nameKey: "doctors.items.wael_ghannem.name",
    titleKey: "doctors.items.wael_ghannem.title",
  },
  {
    id: "ashraf_abolfotoh",
    nameKey: "doctors.items.ashraf_abolfotoh.name",
    titleKey: "doctors.items.ashraf_abolfotoh.title",
  },
  {
    id: "tarek_amer",
    nameKey: "doctors.items.tarek_amer.name",
    titleKey: "doctors.items.tarek_amer.title",
  },
  {
    id: "hossam_abolatta",
    nameKey: "doctors.items.hossam_abolatta.name",
    titleKey: "doctors.items.hossam_abolatta.title",
  },
  {
    id: "ahmed_taalab",
    nameKey: "doctors.items.ahmed_taalab.name",
    titleKey: "doctors.items.ahmed_taalab.title",
  },
  {
    id: "mohamed_elsayed",
    nameKey: "doctors.items.mohamed_elsayed.name",
    titleKey: "doctors.items.mohamed_elsayed.title",
  },
  {
    id: "mohamed_abdelkader",
    nameKey: "doctors.items.mohamed_abdelkader.name",
    titleKey: "doctors.items.mohamed_abdelkader.title",
  },
  {
    id: "mohamed_shawky_khater",
    nameKey: "doctors.items.mohamed_shawky_khater.name",
    titleKey: "doctors.items.mohamed_shawky_khater.title",
  },
  {
    id: "hala_sweed",
    nameKey: "doctors.items.hala_sweed.name",
    titleKey: "doctors.items.hala_sweed.title",
  },
  {
    id: "mohamed_elsherbeny",
    nameKey: "doctors.items.mohamed_elsherbeny.name",
    titleKey: "doctors.items.mohamed_elsherbeny.title",
  },
  {
    id: "rami_nakhka",
    nameKey: "doctors.items.rami_nakhka.name",
    titleKey: "doctors.items.rami_nakhka.title",
  },
  {
    id: "ahmed_taee",
    nameKey: "doctors.items.ahmed_taee.name",
    titleKey: "doctors.items.ahmed_taee.title",
  },
  {
    id: "hany_haroun",
    nameKey: "doctors.items.hany_haroun.name",
    titleKey: "doctors.items.hany_haroun.title",
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
