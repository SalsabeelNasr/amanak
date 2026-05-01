import { z } from "zod";

export const createPatientFormSchema = z.object({
  name: z.string().trim().min(1, "required"),
  phone: z.string().trim().min(3, "required"),
  email: z.string().trim().optional(),
  country: z.string().trim().min(1, "required"),
  age: z.string().optional(),
  clientType: z.enum(["b2c", "b2b", "g2b"]),
  hasPortalAccess: z.boolean(),
  notes: z.string().trim().optional(),
});

export type CreatePatientFormValues = z.infer<typeof createPatientFormSchema>;
