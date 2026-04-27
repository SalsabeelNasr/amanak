import { z } from "zod";

/** Step keys for the quotation wizard; line-item validation uses `CreateDraftQuotationInput` at save time. */
export const quotationWizardStepSchema = z.enum([
  "package",
  "doctor",
  "hospital",
  "hotel",
  "transport",
  "review",
]);
export type QuotationWizardStep = z.infer<typeof quotationWizardStepSchema>;
