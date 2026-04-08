import { z } from "zod";

export const consultationBookingFormSchema = z
  .object({
    slotId: z.string().min(1, { message: "slotRequired" }),
    fullName: z.string().min(2, { message: "minName" }),
    phone: z.string().min(8, { message: "minPhone" }),
    email: z.string(),
  })
  .superRefine((data, ctx) => {
    const trimmed = data.email.trim();
    if (trimmed.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "emailRequired",
        path: ["email"],
      });
      return;
    }
    if (!z.string().email().safeParse(trimmed).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "emailInvalid",
        path: ["email"],
      });
    }
  });

export type ConsultationBookingFormValues = z.infer<
  typeof consultationBookingFormSchema
>;
