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

function validateAgainstDef(
  def: LeadTaskCreationTypeDef,
  creationFields: Record<string, string> | undefined,
  attachments: LeadTaskCreationAttachmentInput[],
): { ok: true } | { ok: false; message: string } {
  const fields = creationFields ?? {};

  for (const f of def.fields) {
    const v = fields[f.id]?.trim() ?? "";
    if (f.required && !v) {
      return { ok: false, message: `Missing required field: ${f.id}` };
    }
  }

  const bySlot = countBySlot(attachments);

  for (const slot of def.uploadSlots) {
    const n = bySlot.get(slot.id) ?? 0;
    if (n < slot.minFiles) {
      return {
        ok: false,
        message: `Slot ${slot.id} requires at least ${slot.minFiles} file(s)`,
      };
    }
    if (slot.maxFiles !== null && n > slot.maxFiles) {
      return {
        ok: false,
        message: `Slot ${slot.id} allows at most ${slot.maxFiles} file(s)`,
      };
    }
  }

  for (const att of attachments) {
    if (!def.uploadSlots.some((s) => s.id === att.slotId)) {
      return { ok: false, message: `Unknown upload slot: ${att.slotId}` };
    }
  }

  return { ok: true };
}

export type LeadTaskCreationValidatedInput = z.infer<typeof baseInputSchema>;

/**
 * Full validation for creating a manual task with creation metadata.
 * Caller must send `title` (for non-custom types, typically the translated default type title).
 */
export function parseLeadTaskCreationInput(
  raw: unknown,
): { success: true; data: LeadTaskCreationValidatedInput } | { success: false; error: string } {
  const base = baseInputSchema.safeParse(raw);
  if (!base.success) {
    return { success: false, error: base.error.message };
  }

  const def = getLeadTaskCreationTypeDef(base.data.creationTypeId);
  if (!def) {
    return { success: false, error: "Unknown creation type" };
  }

  if (!base.data.title.trim()) {
    return { success: false, error: "Task title is required" };
  }

  const fieldCheck = validateAgainstDef(
    def,
    base.data.creationFields,
    base.data.attachments,
  );
  if (!fieldCheck.ok) {
    return { success: false, error: fieldCheck.message };
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
): { success: true } | { success: false; error: string } {
  const trimmed = title.trim();
  if (!trimmed) {
    return { success: false, error: "Task title is required" };
  }
  const def = getLeadTaskCreationTypeDef(creationTypeId);
  if (!def) {
    return { success: false, error: "Unknown creation type" };
  }
  const fieldCheck = validateAgainstDef(def, creationFields, attachments);
  if (!fieldCheck.ok) {
    return { success: false, error: fieldCheck.message };
  }
  return { success: true };
}
