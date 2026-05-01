import { listDoctors } from "@/lib/api/doctors";
import { listHospitals } from "@/lib/api/hospitals";
import { getTreatmentBySlug } from "@/lib/api/treatments";
import type { Doctor, Hospital } from "@/types";

export type EstimateTimingPreference = "asap" | "one_month" | "three_months";
export type EstimateSelectionMode = "doctor_first" | "hospital_first";
export type EstimateCountryBand = "regional" | "medium_haul" | "long_haul";
export type EstimateAreaZone = "metro" | "coastal" | "resort";

export type EstimateDoctorOption = {
  doctor: Doctor;
  hospitalIds: string[];
  recommendedHospitalId: string;
};

export type EstimateHospitalOption = {
  hospital: Hospital;
  accreditationLabel: string;
  areaZone: EstimateAreaZone;
  doctorIds: string[];
};

export type TreatmentEstimateCatalog = {
  doctors: EstimateDoctorOption[];
  hospitals: EstimateHospitalOption[];
  recommendedDoctorIds: string[];
};

const DOCTOR_HOSPITAL_MAP: Record<string, string[]> = {
  rashad_bishara: ["h1", "h2"],
  ayman_samadony: ["h2", "h1"],
  hussein_alwan: ["h2", "h1"],
  mohamed_aboulghar: ["h3", "h1"],
  maged_adel_aziz: ["h3", "h2"],
  tamer_el_nahas: ["h2", "h1"],
  hesham_elghazaly: ["h1", "h2"],
  hatem_azim: ["h1", "h2"],
  mahmoud_hafez: ["h2", "h1"],
  fouad_zamel_sadek: ["h2", "h1"],
  mohamed_asal: ["h2", "h1"],
  nasser_loza: ["h1", "h2"],
  mohamed_hossam_eldin: ["h1", "h2"],
  yasser_badi: ["h1", "h2"],
  john_elia: ["h1", "h2"],
  shady_el_maghraby: ["h1", "h2"],
};

const HOSPITAL_ACCREDITATION: Record<string, string> = {
  h1: "JCI Accredited",
  h2: "ISO + CAP Certified",
  h3: "JCI Fertility Center",
};

const HOSPITAL_ZONE: Record<string, EstimateAreaZone> = {
  h1: "metro",
  h2: "metro",
  h3: "coastal",
};

function toRecommendedDoctorIds(doctorIds: string[]): string[] {
  return doctorIds.slice(0, 3);
}

export async function getTreatmentEstimateCatalog(
  treatmentSlug: string,
): Promise<TreatmentEstimateCatalog> {
  const [treatment, doctors, hospitals] = await Promise.all([
    getTreatmentBySlug(treatmentSlug),
    listDoctors(),
    listHospitals(),
  ]);

  const treatmentDoctorIds = treatment?.doctorIds?.length
    ? treatment.doctorIds
    : doctors.slice(0, 6).map((d) => d.id);
  const doctorIdSet = new Set(treatmentDoctorIds);

  const doctorOptions: EstimateDoctorOption[] = doctors
    .filter((d) => doctorIdSet.has(d.id))
    .map((doctor) => {
      const hospitalIds = DOCTOR_HOSPITAL_MAP[doctor.id] ?? hospitals.map((h) => h.id);
      return {
        doctor,
        hospitalIds,
        recommendedHospitalId: hospitalIds[0] ?? hospitals[0]?.id ?? "",
      };
    })
    .filter((item) => item.hospitalIds.length > 0);

  const relevantHospitalIds = new Set(doctorOptions.flatMap((d) => d.hospitalIds));
  const hospitalOptions: EstimateHospitalOption[] = hospitals
    .filter((h) => relevantHospitalIds.has(h.id))
    .map((hospital) => ({
      hospital,
      accreditationLabel: HOSPITAL_ACCREDITATION[hospital.id] ?? "Accredited partner",
      areaZone: HOSPITAL_ZONE[hospital.id] ?? "metro",
      doctorIds: doctorOptions
        .filter((doctorOption) => doctorOption.hospitalIds.includes(hospital.id))
        .map((doctorOption) => doctorOption.doctor.id),
    }));

  return {
    doctors: doctorOptions,
    hospitals: hospitalOptions,
    recommendedDoctorIds: toRecommendedDoctorIds(treatmentDoctorIds),
  };
}

export function getHospitalAreaZone(
  hospitalId: string,
  fallback: EstimateAreaZone = "metro",
): EstimateAreaZone {
  return HOSPITAL_ZONE[hospitalId] ?? fallback;
}
