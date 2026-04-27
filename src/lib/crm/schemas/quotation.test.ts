import { describe, expect, it } from "vitest";
import {
  createQuotationWizardSaveSchema,
  quotationWizardPackageStepSchema,
} from "./quotation";

describe("quotation wizard schemas", () => {
  it("package step requires a valid tier", () => {
    expect(quotationWizardPackageStepSchema.safeParse({}).success).toBe(false);
    expect(
      quotationWizardPackageStepSchema.safeParse({ packageTier: "gold" })
        .success,
    ).toBe(true);
  });

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
