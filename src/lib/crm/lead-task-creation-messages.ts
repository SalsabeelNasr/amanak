import type { RequestTaskCreationFailure } from "@/lib/lead-task-creation-schema";

/**
 * Maps structured creation validation to `crm` namespace copy.
 * Pass `useTranslations("crm")` from next-intl.
 */
export function formatLeadTaskCreationFailure(
  t: (key: string, values?: Record<string, string | number>) => string,
  f: RequestTaskCreationFailure,
): string {
  switch (f.code) {
    case "invalid_base":
      return t("taskValidationInvalidBase");
    case "unknown_creation_type":
      return t("taskValidationUnknownCreationType");
    case "title_required":
      return t("taskValidationTitleRequired");
    case "required_field": {
      const field = t(
        `taskCreation.fields.${f.fieldLabelKey}` as Parameters<typeof t>[0],
      );
      return t("taskValidationRequiredField", { field });
    }
    case "upload_min": {
      const slot = t(
        `taskCreation.slots.${f.slotLabelKey}` as Parameters<typeof t>[0],
      );
      return t("taskValidationUploadMin", {
        count: f.minFiles,
        slot,
      });
    }
    case "upload_max": {
      const slot = t(
        `taskCreation.slots.${f.slotLabelKey}` as Parameters<typeof t>[0],
      );
      return t("taskValidationUploadMax", {
        max: f.maxFiles,
        slot,
      });
    }
    case "unknown_upload_slot":
      return t("taskValidationUnknownUploadSlot", { slotId: f.slotId });
  }
}
