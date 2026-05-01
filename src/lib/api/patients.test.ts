import { describe, expect, it } from "vitest";
import { createPatient, listPatients } from "./patients";

describe("patients mock store", () => {
  it("filters by hasPortalAccess", async () => {
    const withPortal = await listPatients({ hasPortalAccess: true });
    expect(withPortal.every((p) => p.hasPortalAccess)).toBe(true);
    const without = await listPatients({ hasPortalAccess: false });
    expect(without.every((p) => !p.hasPortalAccess)).toBe(true);
  });

  it("search matches name substring", async () => {
    const rows = await listPatients({ search: "أحمد" });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((p) => p.name.includes("أحمد"))).toBe(true);
  });

  it("createPatient adds a row listable by search", async () => {
    const created = await createPatient(
      {
        name: "Unit Test Patient",
        phone: "+19990001111",
        country: "US",
        clientType: "b2c",
        hasPortalAccess: false,
        createdBy: "crm",
      },
      {},
    );
    const found = await listPatients({ search: "Unit Test" });
    expect(found.some((p) => p.id === created.id)).toBe(true);
  });
});
