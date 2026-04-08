import { z } from "zod";

export const inquiryFormSchema = z
  .object({
    fullName: z.string().min(2, { message: "minName" }),
    phone: z.string().min(8, { message: "minPhone" }),
    email: z.string(),
    treatmentSlug: z.string().optional(),
    message: z.string().min(10, { message: "minMessage" }),
  })
  .superRefine((data, ctx) => {
    const trimmed = data.email.trim();
    if (
      trimmed.length > 0 &&
      !z.string().email().safeParse(trimmed).success
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "emailInvalid",
        path: ["email"],
      });
    }
  });

export type InquiryFormValues = z.infer<typeof inquiryFormSchema>;
