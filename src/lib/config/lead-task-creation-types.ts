import type { RequestDocument, RequestTaskCreationTypeId } from "@/types";

export type LeadTaskCreationFieldKind = "text" | "textarea" | "date" | "select";

export type LeadTaskCreationFieldDef = {
  id: string;
  kind: LeadTaskCreationFieldKind;
  required: boolean;
  /** next-intl key under `crm.taskCreation.fields` */
  labelKey: string;
  /** For `select` only: value + label key under `crm.taskCreation.fieldOptions` */
  options?: { value: string; labelKey: string }[];
};

export type LeadTaskCreationUploadSlotDef = {
  id: string;
  required: boolean;
  minFiles: number;
  /** `null` = no upper bound */
  maxFiles: number | null;
  /** next-intl key under `crm.taskCreation.slots` */
  labelKey: string;
  mapsToLeadDocumentType?: RequestDocument["type"];
};

export type LeadTaskCreationTypeDef = {
  id: RequestTaskCreationTypeId;
  /** next-intl key under `crm.taskCreation.types` */
  titleMessageKey: string;
  /** next-intl key under `crm.taskCreation.types` (description in picker) */
  descriptionMessageKey: string;
  /** When true, the task title comes from the field with id `title` in `fields`. */
  usesCustomTitleField: boolean;
  fields: LeadTaskCreationFieldDef[];
  uploadSlots: LeadTaskCreationUploadSlotDef[];
};

export const LEAD_TASK_CREATION_TYPES: readonly LeadTaskCreationTypeDef[] = [
  {
    id: "collect_medical_files",
    titleMessageKey: "collect_medical_files.title",
    descriptionMessageKey: "collect_medical_files.description",
    usesCustomTitleField: false,
    fields: [
      {
        id: "notes",
        kind: "textarea",
        required: false,
        labelKey: "notesOptional",
      },
    ],
    uploadSlots: [
      {
        id: "medical_report",
        required: true,
        minFiles: 1,
        maxFiles: null,
        labelKey: "medical_report",
        mapsToLeadDocumentType: "medical_report",
      },
      {
        id: "xray",
        required: true,
        minFiles: 1,
        maxFiles: null,
        labelKey: "xray",
        mapsToLeadDocumentType: "xray",
      },
      {
        id: "lab_result",
        required: true,
        minFiles: 1,
        maxFiles: null,
        labelKey: "lab_result",
        mapsToLeadDocumentType: "lab_result",
      },
    ],
  },
  {
    id: "payment_proof",
    titleMessageKey: "payment_proof.title",
    descriptionMessageKey: "payment_proof.description",
    usesCustomTitleField: false,
    fields: [
      {
        id: "payment_reference",
        kind: "text",
        required: false,
        labelKey: "payment_reference",
      },
    ],
    uploadSlots: [
      {
        id: "receipt",
        required: true,
        minFiles: 1,
        maxFiles: 5,
        labelKey: "payment_receipt",
        mapsToLeadDocumentType: "other",
      },
    ],
  },
  {
    id: "internal_follow_up",
    titleMessageKey: "internal_follow_up.title",
    descriptionMessageKey: "internal_follow_up.description",
    usesCustomTitleField: false,
    fields: [
      {
        id: "summary",
        kind: "textarea",
        required: true,
        labelKey: "follow_up_summary",
      },
    ],
    uploadSlots: [
      {
        id: "attachments",
        required: false,
        minFiles: 0,
        maxFiles: null,
        labelKey: "generic_attachments",
      },
    ],
  },
  {
    id: "custom",
    titleMessageKey: "custom.title",
    descriptionMessageKey: "custom.description",
    usesCustomTitleField: true,
    fields: [
      {
        id: "title",
        kind: "text",
        required: true,
        labelKey: "custom_task_title",
      },
      {
        id: "details",
        kind: "textarea",
        required: false,
        labelKey: "custom_task_details",
      },
    ],
    uploadSlots: [],
  },
] as const;

const byId = new Map(
  LEAD_TASK_CREATION_TYPES.map((def) => [def.id, def] as const),
);

export function getLeadTaskCreationTypeDef(
  id: RequestTaskCreationTypeId,
): LeadTaskCreationTypeDef | undefined {
  return byId.get(id);
}

export function listRequestTaskCreationTypeIds(): RequestTaskCreationTypeId[] {
  return LEAD_TASK_CREATION_TYPES.map((d) => d.id);
}
