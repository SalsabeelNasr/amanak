"use server";

import { consultationBookingFormSchema } from "@/lib/consultation-booking-schema";
import { bookConsultation } from "@/lib/api/consultation-booking";
import type { BookConsultationPayload } from "@/types";

export async function bookConsultationAction(
  raw: unknown,
): Promise<
  | { ok: true; id: string }
  | { ok: false; error: "validation" | "slot_unavailable"; fieldErrors?: Record<string, string[]> }
> {
  const parsed = consultationBookingFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "validation",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const v = parsed.data;
  const payload: BookConsultationPayload = {
    slotId: v.slotId,
    fullName: v.fullName.trim(),
    email: v.email.trim(),
    phone: v.phone.trim(),
  };

  const res = await bookConsultation(payload, { simulateDelay: true });
  if (!res.ok) {
    return { ok: false, error: "slot_unavailable" };
  }
  return { ok: true, id: res.id };
}
