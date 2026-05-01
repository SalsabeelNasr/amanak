import { describe, expect, it } from "vitest";
import { getTreatmentEstimateCatalog } from "./patient-estimate-catalog";

describe("getTreatmentEstimateCatalog", () => {
  it("returns doctor and hospital links for doctor-first selection", async () => {
    const catalog = await getTreatmentEstimateCatalog("joint-replacement");
    expect(catalog.doctors.length).toBeGreaterThan(0);
    expect(catalog.hospitals.length).toBeGreaterThan(0);
    expect(catalog.recommendedDoctorIds.length).toBeLessThanOrEqual(3);
    expect(catalog.doctors[0]?.hospitalIds.length).toBeGreaterThan(0);
  });

  it("keeps hospital doctor lists scoped to linked doctors", async () => {
    const catalog = await getTreatmentEstimateCatalog("ivf");
    const firstHospital = catalog.hospitals[0];
    expect(firstHospital).toBeTruthy();
    if (!firstHospital) return;
    const doctorIds = new Set(catalog.doctors.map((d) => d.doctor.id));
    expect(firstHospital.doctorIds.every((id) => doctorIds.has(id))).toBe(true);
  });
});
