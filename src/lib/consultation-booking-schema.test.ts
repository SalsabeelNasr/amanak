import { describe, expect, it } from "vitest";
import { consultationBookingFormSchema } from "./consultation-booking-schema";

describe("consultationBookingFormSchema", () => {
  it("rejects missing slot", () => {
    const r = consultationBookingFormSchema.safeParse({
      slotId: "",
      fullName: "Sara Ali",
      phone: "1234567890",
      email: "sara@example.com",
    });
    expect(r.success).toBe(false);
  });

  it("rejects empty email", () => {
    const r = consultationBookingFormSchema.safeParse({
      slotId: "slot_x",
      fullName: "Sara Ali",
      phone: "1234567890",
      email: "   ",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.flatten().fieldErrors.email?.length).toBeGreaterThan(0);
    }
  });

  it("rejects invalid email", () => {
    const r = consultationBookingFormSchema.safeParse({
      slotId: "slot_x",
      fullName: "Sara Ali",
      phone: "1234567890",
      email: "not-an-email",
    });
    expect(r.success).toBe(false);
  });

  it("accepts valid payload", () => {
    const r = consultationBookingFormSchema.safeParse({
      slotId: "slot_x",
      fullName: "Sara Ali",
      phone: "1234567890",
      email: "sara@example.com",
    });
    expect(r.success).toBe(true);
  });
});
