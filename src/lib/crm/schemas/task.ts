import { z } from "zod";
import { CRM_TASK_ASSIGNEE_IDS } from "@/lib/crm/client.types";

const assigneeIdSchema = z
  .string()
  .optional()
  .refine(
    (v) => v === undefined || v === "" || (CRM_TASK_ASSIGNEE_IDS as readonly string[]).includes(v),
    { message: "Invalid assignee" },
  );

/** Base add-task fields aligned with `AddLeadTaskInput` (simplified; creation-type fields stay dynamic in UI). */
export const addLeadTaskBaseSchema = z.object({
  title: z.string().min(1, "Required").max(500),
  dueAt: z.string().optional(),
  assigneeId: assigneeIdSchema,
  createdByUserId: z.string().optional(),
});

export type AddLeadTaskBaseForm = z.infer<typeof addLeadTaskBaseSchema>;

/** Due date + assignee row in add-task dialog (creation-type blocks stay outside RHF). */
export function createAddTaskDialogMetaSchema(invalidAssigneeMessage: string) {
  return z.object({
    dueAt: z.string().optional(),
    assigneeId: z
      .string()
      .optional()
      .refine(
        (v) => v === undefined || v === "" || (CRM_TASK_ASSIGNEE_IDS as readonly string[]).includes(v),
        { message: invalidAssigneeMessage },
      ),
  });
}

export type AddTaskDialogMetaForm = z.infer<ReturnType<typeof createAddTaskDialogMetaSchema>>;
