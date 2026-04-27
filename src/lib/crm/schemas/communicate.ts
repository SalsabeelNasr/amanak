import { z } from "zod";

/** Placeholder: full discriminated union for compose modes is implemented in the communicate dialog. */
export const communicateModeSchema = z.enum(["call", "whatsapp", "sms", "email"]);
export type CommunicateMode = z.infer<typeof communicateModeSchema>;
