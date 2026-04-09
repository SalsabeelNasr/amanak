import type { LeadDocument, LeadTaskAttachment, LeadTaskCreationTypeId } from "@/types";
import { getLeadTaskCreationTypeDef } from "@/lib/config/lead-task-creation-types";

const FALLBACK_DOC_NAMES: Record<LeadDocument["type"], string> = {
  medical_report: "Medical report",
  xray: "Imaging",
  lab_result: "Lab results",
  previous_operations: "Previous operations",
  passport: "Passport",
  visa: "Visa",
  other: "Attachment",
};

function newDocId(): string {
  return `doc_${globalThis.crypto.randomUUID()}`;
}

/**
 * Applies mapped task attachments to `lead.documents`: updates first doc of each
 * `mapsToLeadDocumentType` or appends a new row. Unmapped attachments are ignored.
 * When several attachments map to the same type, the last one wins for `mockUrl`.
 */
export function mergeCreationAttachmentsIntoLeadDocuments(
  documents: LeadDocument[],
  creationTypeId: LeadTaskCreationTypeId,
  attachments: LeadTaskAttachment[],
  uploadedBy: string | undefined,
  at: string,
): LeadDocument[] {
  const def = getLeadTaskCreationTypeDef(creationTypeId);
  if (!def) return documents;

  const next = [...documents];

  for (const att of attachments) {
    const slot = def.uploadSlots.find((s) => s.id === att.slotId);
    const docType = slot?.mapsToLeadDocumentType;
    if (!docType) continue;

    const idx = next.findIndex((d) => d.type === docType);
    const patch: Partial<LeadDocument> = {
      status: "uploaded",
      uploadedAt: at,
      uploadedBy: uploadedBy ?? "crm_user",
      mockUrl: att.mockUrl,
    };

    if (idx >= 0) {
      const prev = next[idx]!;
      next[idx] = { ...prev, ...patch };
    } else {
      next.push({
        id: newDocId(),
        type: docType,
        name: FALLBACK_DOC_NAMES[docType],
        mandatory: false,
        status: "uploaded",
        uploadedAt: at,
        uploadedBy: uploadedBy ?? "crm_user",
        mockUrl: att.mockUrl,
      });
    }
  }

  return next;
}
