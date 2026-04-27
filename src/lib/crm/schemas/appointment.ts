import { z } from "zod";

/** Placeholder for appointment add/edit shapes (see `AddLeadAppointmentInput` in API). */
export const appointmentKindSchema = z.enum([
  "treatment",
  "online_meeting",
  "team_consultation",
]);
export type AppointmentKindForm = z.infer<typeof appointmentKindSchema>;
