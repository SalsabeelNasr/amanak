import { describe, expect, it } from "vitest";
import { createCommunicateFormSchema } from "./communicate";

describe("createCommunicateFormSchema", () => {
  it("requires pipeline fields for email when patient email missing", () => {
    const schema = createCommunicateFormSchema({
      mode: "email",
      messages: {
        when: "When?",
        callNotes: "Notes?",
        message: "Msg?",
        emailFields: "Fill email",
        noPatientEmail: "No email",
        noPatientPhone: "No phone",
      },
      hasPatientEmail: false,
      hasPatientPhone: true,
    });
    const r = schema.safeParse({
      whenLocal: "2026-01-15T10:00",
      callNotes: "",
      waMessage: "",
      emailSubject: "S",
      emailBody: "B",
      smsMessage: "",
    });
    expect(r.success).toBe(false);
  });
});
