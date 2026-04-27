import { z } from "zod";
import type { LeadTaskCreationTypeId } from "@/types";
import {
  getLeadTaskCreationTypeDef,
  type LeadTaskCreationTypeDef,
} from "@/lib/config/lead-task-creation-types";

const attachmentInputSchema = z.object({
  slotId: z.string().min(1),
  fileName: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  mockUrl: z.string().optional(),
});

export type LeadTaskCreationAttachmentInput = z.infer<
  typeof attachmentInputSchema
>;

const baseInputSchema = z.object({
  title: z.string(),
  creationTypeId: z.custom<LeadTaskCreationTypeId>(
    (v): v is LeadTaskCreationTypeId =>
      typeof v === "string" &&
      [
        "collect_medical_files",
        "payment_proof",
        "internal_follow_up",
        "custom",
      ].includes(v),
  ),
  dueAt: z.string().optional(),
  assigneeId: z.string().optional(),
  createdByUserId: z.string().optional(),
  creationFields: z.record(z.string(), z.string()).optional(),
  attachments: z.array(attachmentInputSchema).default([]),
});

function countBySlot(
  attachments: LeadTaskCreationAttachmentInput[],
): Map<string, number> {
  const m = new Map<string, number>();
  for (const a of attachments) {
    m.set(a.slotId, (m.get(a.slotId) ?? 0) + 1);
  }
  return m;
}

export type LeadTaskCreationFailure =
  | { code: "invalid_base"; zodMessage: string }
  | { code: "unknown_creation_type" }
  | { code: "title_required" }
  | {
      code: "required_field";
      fieldId: string;
      fieldLabelKey: string;
    }
  | {
      code: "upload_min";
      slotId: string;
      slotLabelKey: string;
      minFiles: number;
    }
  | {
      code: "upload_max";
      slotId: string;
      slotLabelKey: string;
      maxFiles: number;
    }
  | { code: "unknown_upload_slot"; slotId: string };

function validateAgainstDef(
  def: LeadTaskCreationTypeDef,
  creationFields: Record<string, string> | undefined,
  attachments: LeadTaskCreationAttachmentInput[],
): { ok: true } | { ok: false; failure: LeadTaskCreationFailure } {
  const fields = creationFields ?? {};

  for (const f of def.fields) {
    const v = fields[f.id]?.trim() ?? "";
    if (f.required && !v) {
      return {
        ok: false,
        failure: {
          code: "required_field",
          fieldId: f.id,
          fieldLabelKey: f.labelKey,
        },
      };
    }
  }

  const bySlot = countBySlot(attachments);

  for (const slot of def.uploadSlots) {
    const n = bySlot.get(slot.id) ?? 0;
    if (n < slot.minFiles) {
      return {
        ok: false,
        failure: {
          code: "upload_min",
          slotId: slot.id,
          slotLabelKey: slot.labelKey,
          minFiles: slot.minFiles,
        },
      };
    }
    if (slot.maxFiles !== null && n > slot.maxFiles) {
      return {
        ok: false,
        failure: {
          code: "upload_max",
          slotId: slot.id,
          slotLabelKey: slot.labelKey,
          maxFiles: slot.maxFiles,
        },
      };
    }
  }

  for (const att of attachments) {
    if (!def.uploadSlots.some((s) => s.id === att.slotId)) {
      return {
        ok: false,
        failure: { code: "unknown_upload_slot", slotId: att.slotId },
      };
    }
  }

  return { ok: true };
}

export type LeadTaskCreationValidatedInput = z.infer<typeof baseInputSchema>;

/** English fallback for API errors and non-UI callers. */
export function defaultLeadTaskCreationFailureMessage(
  f: LeadTaskCreationFailure,
): string {
  switch (f.code) {
    case "invalid_base":
      return f.zodMessage;
    case "unknown_creation_type":
      return "Unknown task creation type";
    case "title_required":
      return "Task title is required";
    case "required_field":
      return `Missing required field: ${f.fieldId}`;
    case "upload_min":
      return `Slot ${f.slotId} requires at least ${f.minFiles} file(s)`;
    case "upload_max":
      return `Slot ${f.slotId} allows at most ${f.maxFiles} file(s)`;
    case "unknown_upload_slot":
      return `Unknown upload slot: ${f.slotId}`;
  }
}

/**
 * Full validation for creating a manual task with creation metadata.
 * Caller must send `title` (for non-custom types, typically the translated default type title).
 */
export function parseLeadTaskCreationInput(
  raw: unknown,
):
  | { success: true; data: LeadTaskCreationValidatedInput }
  | { success: false; failure: LeadTaskCreationFailure } {
  const base = baseInputSchema.safeParse(raw);
  if (!base.success) {
    return {
      success: false,
      failure: { code: "invalid_base", zodMessage: base.error.message },
    };
  }

  const def = getLeadTaskCreationTypeDef(base.data.creationTypeId);
  if (!def) {
    return { success: false, failure: { code: "unknown_creation_type" } };
  }

  if (!base.data.title.trim()) {
    return { success: false, failure: { code: "title_required" } };
  }

  const fieldCheck = validateAgainstDef(
    def,
    base.data.creationFields,
    base.data.attachments,
  );
  if (!fieldCheck.ok) {
    return { success: false, failure: fieldCheck.failure };
  }

  return {
    success: true,
    data: { ...base.data, title: base.data.title.trim() },
  };
}

/**
 * Validates merged creation fields + attachments before completing a task that has `creationTypeId`.
 * `attachments` must include both persisted task attachments and any new uploads (as inputs).
 */
export function validateLeadTaskCreationCompletion(
  creationTypeId: LeadTaskCreationTypeId,
  title: string,
  creationFields: Record<string, string> | undefined,
  attachments: LeadTaskCreationAttachmentInput[],
):
  | { success: true }
  | { success: false; failure: LeadTaskCreationFailure } {
  const trimmed = title.trim();
  if (!trimmed) {
    return { success: false, failure: { code: "title_required" } };
  }
  const def = getLeadTaskCreationTypeDef(creationTypeId);
  if (!def) {
    return { success: false, failure: { code: "unknown_creation_type" } };
  }
  const fieldCheck = validateAgainstDef(def, creationFields, attachments);
  if (!fieldCheck.ok) {
    return { success: false, failure: fieldCheck.failure };
  }
  return { success: true };
}
