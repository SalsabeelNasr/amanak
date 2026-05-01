import { describe, expect, it } from "vitest";
import { createQuotationWizardSaveSchema } from "./quotation";

describe("quotation wizard schemas", () => {
  it("save requires hospital for corporate when tier and doctor set", () => {
    const schema = createQuotationWizardSaveSchema(true, "Need hospital");
    const bad = schema.safeParse({
      packageTier: "normal",
      doctorId: "d1",
      hospitalId: null,
    });
    expect(bad.success).toBe(false);
  });
});
