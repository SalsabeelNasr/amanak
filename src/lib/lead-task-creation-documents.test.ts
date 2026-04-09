import { describe, expect, it } from "vitest";
import type { LeadDocument, LeadTaskAttachment } from "@/types";
import { mergeCreationAttachmentsIntoLeadDocuments } from "./lead-task-creation-documents";

const baseDocs: LeadDocument[] = [
  {
    id: "d1",
    type: "medical_report",
    name: "Medical",
    mandatory: true,
    status: "pending",
  },
  {
    id: "d2",
    type: "xray",
    name: "X-ray",
    mandatory: true,
    status: "pending",
  },
];

function att(
  slotId: string,
  fileName: string,
  mockUrl?: string,
): LeadTaskAttachment {
  return {
    id: "att_1",
    slotId,
    fileName,
    sizeBytes: 10,
    uploadedAt: "2026-01-01T00:00:00.000Z",
    mockUrl,
  };
}

describe("mergeCreationAttachmentsIntoLeadDocuments", () => {
  it("updates first document of mapped type", () => {
    const next = mergeCreationAttachmentsIntoLeadDocuments(
      baseDocs,
      "collect_medical_files",
      [att("medical_report", "m.pdf", "blob:mock")],
      "user_1",
      "2026-04-01T12:00:00.000Z",
    );
    const med = next.find((d) => d.type === "medical_report");
    expect(med?.status).toBe("uploaded");
    expect(med?.uploadedBy).toBe("user_1");
    expect(med?.mockUrl).toBe("blob:mock");
    const xray = next.find((d) => d.type === "xray");
    expect(xray?.status).toBe("pending");
  });

  it("appends when type missing", () => {
    const next = mergeCreationAttachmentsIntoLeadDocuments(
      [],
      "payment_proof",
      [att("receipt", "pay.pdf", "blob:p")],
      undefined,
      "2026-04-01T12:00:00.000Z",
    );
    expect(next.length).toBe(1);
    expect(next[0]?.type).toBe("other");
    expect(next[0]?.status).toBe("uploaded");
    expect(next[0]?.uploadedBy).toBe("crm_user");
  });

  it("ignores unmapped slots", () => {
    const next = mergeCreationAttachmentsIntoLeadDocuments(
      baseDocs,
      "internal_follow_up",
      [att("attachments", "extra.pdf")],
      "u",
      "2026-04-01T12:00:00.000Z",
    );
    expect(next).toEqual(baseDocs);
  });
});
