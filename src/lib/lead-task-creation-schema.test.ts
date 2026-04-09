import { describe, expect, it } from "vitest";
import { parseLeadTaskCreationInput } from "./lead-task-creation-schema";

describe("parseLeadTaskCreationInput", () => {
  it("accepts custom type with title field", () => {
    const r = parseLeadTaskCreationInput({
      title: "Call patient",
      creationTypeId: "custom",
      creationFields: { title: "Call patient", details: "Re: estimate" },
      attachments: [],
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.title).toBe("Call patient");
    }
  });

  it("rejects custom when required title field empty", () => {
    const r = parseLeadTaskCreationInput({
      title: "x",
      creationTypeId: "custom",
      creationFields: { title: "", details: "" },
      attachments: [],
    });
    expect(r.success).toBe(false);
  });

  it("requires all medical file slots for collect_medical_files", () => {
    const r = parseLeadTaskCreationInput({
      title: "Collect files",
      creationTypeId: "collect_medical_files",
      creationFields: {},
      attachments: [
        {
          slotId: "medical_report",
          fileName: "m.pdf",
          sizeBytes: 1,
        },
      ],
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error).toContain("xray");
    }
  });

  it("accepts collect_medical_files with one file per required slot", () => {
    const r = parseLeadTaskCreationInput({
      title: "Collect files",
      creationTypeId: "collect_medical_files",
      creationFields: { notes: "" },
      attachments: [
        { slotId: "medical_report", fileName: "m.pdf", sizeBytes: 1 },
        { slotId: "xray", fileName: "x.dcm", sizeBytes: 2 },
        { slotId: "lab_result", fileName: "l.pdf", sizeBytes: 3 },
      ],
    });
    expect(r.success).toBe(true);
  });

  it("rejects payment_proof when more than maxFiles", () => {
    const files = Array.from({ length: 6 }, (_, i) => ({
      slotId: "receipt",
      fileName: `r${i}.pdf`,
      sizeBytes: 1,
    }));
    const r = parseLeadTaskCreationInput({
      title: "Payment",
      creationTypeId: "payment_proof",
      creationFields: {},
      attachments: files,
    });
    expect(r.success).toBe(false);
  });

  it("rejects unknown slot id", () => {
    const r = parseLeadTaskCreationInput({
      title: "T",
      creationTypeId: "payment_proof",
      attachments: [
        { slotId: "receipt", fileName: "a.pdf", sizeBytes: 1 },
        { slotId: "nope", fileName: "b.pdf", sizeBytes: 1 },
      ],
    });
    expect(r.success).toBe(false);
  });

  it("accepts internal_follow_up without attachments", () => {
    const r = parseLeadTaskCreationInput({
      title: "Follow up",
      creationTypeId: "internal_follow_up",
      creationFields: { summary: "Called — no answer" },
      attachments: [],
    });
    expect(r.success).toBe(true);
  });
});
