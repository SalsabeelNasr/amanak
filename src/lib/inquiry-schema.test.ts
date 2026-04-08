import { describe, expect, it } from "vitest";
import { inquiryFormSchema } from "./inquiry-schema";

describe("inquiryFormSchema", () => {
  it("rejects short name", () => {
    const r = inquiryFormSchema.safeParse({
      fullName: "a",
      phone: "1234567890",
      email: "",
      message: "1234567890 long enough",
    });
    expect(r.success).toBe(false);
  });

  it("accepts empty email", () => {
    const r = inquiryFormSchema.safeParse({
      fullName: "Sara Ali",
      phone: "1234567890",
      email: "  ",
      message: "1234567890 long enough",
    });
    expect(r.success).toBe(true);
  });

  it("rejects invalid email when present", () => {
    const r = inquiryFormSchema.safeParse({
      fullName: "Sara Ali",
      phone: "1234567890",
      email: "not-email",
      message: "1234567890 long enough",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.flatten().fieldErrors.email?.length).toBeGreaterThan(0);
    }
  });
});
