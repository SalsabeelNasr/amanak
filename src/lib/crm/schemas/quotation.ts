import { z } from "zod";

/** Step keys for the quotation wizard; line-item validation uses `CreateDraftQuotationInput` at save time. */
export const quotationWizardStepSchema = z.enum([
  "doctorHospital",
  "hotel",
  "flight",
  "transport",
  "review",
]);
export type QuotationWizardStep = z.infer<typeof quotationWizardStepSchema>;

const PACKAGE_TIERS = ["normal", "silver", "gold", "vip"] as const;

export const quotationPackageTierSchema = z.enum(PACKAGE_TIERS);

export const quotationWizardPackageStepSchema = z.object({
  packageTier: quotationPackageTierSchema,
});

export const quotationWizardDoctorStepSchema = z.object({
  doctorId: z.string().min(1),
});

/**
 * B2B/G2B must pick a hospital before leaving the step; B2C may skip.
 * Pass a localized `message` for the refine (shown on the hospital field / banner).
 */
export function createQuotationWizardHospitalStepSchema(
  requireHospital: boolean,
  message: string,
) {
  return z
    .object({ hospitalId: z.string().nullable() })
    .refine(
      (d) => !requireHospital || Boolean(d.hospitalId?.trim()),
      { path: ["hospitalId"], message },
    );
}

/**
 * Final save: package + doctor always required; corporate leads require a hospital.
 */
export function createQuotationWizardSaveSchema(
  requireHospital: boolean,
  message: string,
) {
  return z
    .object({
      packageTier: quotationPackageTierSchema,
      doctorId: z.string().min(1),
      hospitalId: z.string().nullable(),
    })
    .refine(
      (d) => !requireHospital || Boolean(d.hospitalId?.trim()),
      { path: ["hospitalId"], message },
    );
}
