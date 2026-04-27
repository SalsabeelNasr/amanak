"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogShell } from "@/components/crm/dialog-shell";
import { DateField } from "@/components/crm/forms/date-field";
import { SelectField } from "@/components/crm/forms/select-field";
import { TextField } from "@/components/crm/forms/text-field";
import { TextareaField } from "@/components/crm/forms/textarea-field";
import { crm } from "@/lib/crm/client";
import {
  createAddTaskDialogMetaSchema,
  type AddTaskDialogMetaForm,
} from "@/lib/crm/schemas/task";
import { CRM_TASK_ASSIGNEE_IDS } from "@/lib/crm/client.types";
import {
  LEAD_TASK_CREATION_TYPES,
  getLeadTaskCreationTypeDef,
} from "@/lib/config/lead-task-creation-types";
import { formatLeadTaskCreationFailure } from "@/lib/crm/lead-task-creation-messages";
import { parseLeadTaskCreationInput } from "@/lib/lead-task-creation-schema";
import { cn } from "@/lib/utils";
import type { Lead, LeadTaskCreationTypeId } from "@/types";
import { Upload } from "lucide-react";

/** Default to custom so the dialog opens without heavy upload requirements. */
const DEFAULT_TYPE: LeadTaskCreationTypeId = "custom";

function emptyFieldsForType(
  id: LeadTaskCreationTypeId,
): Record<string, string> {
  const def = getLeadTaskCreationTypeDef(id);
  if (!def) return {};
  return Object.fromEntries(def.fields.map((f) => [f.id, ""]));
}

export function LeadAddTaskDialog({
  leadId,
  locale,
  isAuthenticated,
  userId,
  onLeadUpdated,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  hideTrigger = false,
}: {
  leadId: string;
  locale: string;
  isAuthenticated: boolean;
  userId: string;
  onLeadUpdated: (lead: Lead) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
  const t = useTranslations("crm");
  const metaSchema = useMemo(
    () => createAddTaskDialogMetaSchema(t("taskValidationInvalidAssignee")),
    [t],
  );
  const form = useForm<AddTaskDialogMetaForm>({
    resolver: zodResolver(metaSchema),
    defaultValues: { dueAt: "", assigneeId: "" },
  });
  const { control, reset: resetMetaForm, handleSubmit: handleMetaSubmit } = form;

  const isControlled =
    controlledOpen !== undefined && controlledOnOpenChange !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const [creationTypeId, setCreationTypeId] =
    useState<LeadTaskCreationTypeId>(DEFAULT_TYPE);

  type FieldFormValues = Record<string, string>;
  const fieldsForm = useForm<FieldFormValues>({
    defaultValues: emptyFieldsForType(DEFAULT_TYPE),
  });
  const {
    control: fieldsControl,
    reset: resetFields,
    watch: watchFields,
    getValues: getFieldValues,
  } = fieldsForm;
  const fieldValues = watchFields();
  const [slotFiles, setSlotFiles] = useState<Record<string, File[]>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const def = getLeadTaskCreationTypeDef(creationTypeId);

  const assigneeOptions = useMemo(
    () =>
      CRM_TASK_ASSIGNEE_IDS.map((id) => ({
        value: id,
        label: t(`taskAssignees.${id}` as Parameters<typeof t>[0]),
      })),
    [t],
  );

  const resetAll = useCallback(() => {
    setCreationTypeId(DEFAULT_TYPE);
    resetFields(emptyFieldsForType(DEFAULT_TYPE));
    setSlotFiles({});
    resetMetaForm({ dueAt: "", assigneeId: "" });
    setFormError(null);
  }, [resetMetaForm, resetFields]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) resetAll();
      if (isControlled) controlledOnOpenChange?.(next);
      else setUncontrolledOpen(next);
    },
    [resetAll, isControlled, controlledOnOpenChange],
  );

  const attachmentsForValidation = useMemo(() => {
    if (!def) return [];
    const out: { slotId: string; fileName: string; sizeBytes: number }[] = [];
    for (const s of def.uploadSlots) {
      for (const f of slotFiles[s.id] ?? []) {
        out.push({
          slotId: s.id,
          fileName: f.name,
          sizeBytes: f.size,
        });
      }
    }
    return out;
  }, [def, slotFiles]);

  const resolvedTitle = useMemo(() => {
    if (!def) return "";
    if (def.usesCustomTitleField) return fieldValues.title?.trim() ?? "";
    return t(`taskCreation.types.${def.id}.title`);
  }, [def, fieldValues, t]);

  const parseResult = useMemo(() => {
    if (!def) {
      return {
        success: false as const,
        failure: { code: "unknown_creation_type" } as const,
      };
    }
    return parseLeadTaskCreationInput({
      title: resolvedTitle,
      creationTypeId,
      creationFields: fieldValues,
      attachments: attachmentsForValidation,
    });
  }, [
    def,
    resolvedTitle,
    creationTypeId,
    fieldValues,
    attachmentsForValidation,
  ]);

  const canSubmit =
    isAuthenticated && parseResult.success && !saving;

  const appendSlotFiles = (
    slotId: string,
    incoming: FileList | null,
    maxFiles: number | null,
  ) => {
    if (!incoming?.length) return;
    setSlotFiles((prev) => {
      const cur = prev[slotId] ?? [];
      const add = Array.from(incoming);
      let next = [...cur, ...add];
      if (maxFiles !== null && next.length > maxFiles) {
        next = next.slice(0, maxFiles);
      }
      return { ...prev, [slotId]: next };
    });
  };

  const removeSlotFile = (slotId: string, index: number) => {
    setSlotFiles((prev) => ({
      ...prev,
      [slotId]: (prev[slotId] ?? []).filter((_, i) => i !== index),
    }));
  };

  const runAddTask = useCallback(
    async (values: AddTaskDialogMetaForm) => {
      if (!def) return;
      setFormError(null);
      const check = parseLeadTaskCreationInput({
        title: resolvedTitle,
        creationTypeId,
        creationFields: getFieldValues(),
        attachments: attachmentsForValidation,
      });
      if (!check.success) {
        setFormError(formatLeadTaskCreationFailure(t, check.failure));
        return;
      }

      const dueAt = values.dueAt?.trim()
        ? new Date(`${values.dueAt}T12:00:00`).toISOString()
        : undefined;

      const urls: string[] = [];
      const attachments: {
        slotId: string;
        fileName: string;
        sizeBytes: number;
        mockUrl: string;
      }[] = [];

      for (const s of def.uploadSlots) {
        for (const file of slotFiles[s.id] ?? []) {
          const mockUrl = URL.createObjectURL(file);
          urls.push(mockUrl);
          attachments.push({
            slotId: s.id,
            fileName: file.name,
            sizeBytes: file.size,
            mockUrl,
          });
        }
      }

      setSaving(true);
      try {
        const updated = await crm.leads.addTask(
          leadId,
          {
            title: resolvedTitle,
            creationTypeId,
            creationFields: getFieldValues(),
            attachments,
            dueAt,
            assigneeId: values.assigneeId?.trim() || undefined,
            createdByUserId: userId,
          },
          {},
        );
        urls.forEach((u) => URL.revokeObjectURL(u));
        onLeadUpdated(updated);
        handleOpenChange(false);
      } catch (e) {
        urls.forEach((u) => URL.revokeObjectURL(u));
        console.error(e);
        setFormError(
          e instanceof Error ? e.message : t("taskCompleteErrorGeneric"),
        );
      } finally {
        setSaving(false);
      }
    },
    [
      def,
      resolvedTitle,
      creationTypeId,
      getFieldValues,
      attachmentsForValidation,
      slotFiles,
      leadId,
      userId,
      t,
      handleOpenChange,
      onLeadUpdated,
    ],
  );

  function onSaveClick() {
    if (!canSubmit) return;
    void handleMetaSubmit(runAddTask)();
  }

  if (!isAuthenticated) return null;

  return (
    <DialogShell open={open} onOpenChange={handleOpenChange}>
      {!hideTrigger ? (
        <Button
          type="button"
          size="sm"
          className="h-9 rounded-xl text-sm font-semibold shadow-md"
          onClick={() => handleOpenChange(true)}
        >
          {t("taskAdd")}
        </Button>
      ) : null}
      <DialogContent
        dir={locale === "ar" ? "rtl" : "ltr"}
        size="xl"
        layout="scrollableTall"
      >
        <DialogHeader>
          <DialogTitle>{t("taskSaveAdd")}</DialogTitle>
          <DialogDescription>{t("addTaskDescription")}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6 py-4">
          <div className="space-y-2.5">
            <p className="amanak-app-field-label">{t("taskCreation.typePickerLabel")}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {LEAD_TASK_CREATION_TYPES.map((typeDef) => {
                const selected = creationTypeId === typeDef.id;
                return (
                  <button
                    key={typeDef.id}
                    type="button"
                    onClick={() => {
                      setCreationTypeId(typeDef.id);
                      resetFields(emptyFieldsForType(typeDef.id));
                      setSlotFiles({});
                    }}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-start transition-all",
                      selected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border bg-muted/20 hover:bg-muted/40",
                    )}
                  >
                    <span className="block text-sm font-semibold text-foreground">
                      {t(`taskCreation.types.${typeDef.id}.title`)}
                    </span>
                    <span className="mt-1 block text-xs font-medium text-muted-foreground">
                      {t(`taskCreation.types.${typeDef.id}.description`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {def && def.fields.length > 0 ? (
            <div className="space-y-4 [&_label]:amanak-app-field-label">
              {def.fields.map((field) => {
                const name = field.id as FieldPath<FieldFormValues>;
                const label = `${t(`taskCreation.fields.${field.labelKey}`)}${
                  field.required ? " *" : ""
                }`;
                if (field.kind === "textarea") {
                  return (
                    <TextareaField
                      key={field.id}
                      control={fieldsControl}
                      name={name}
                      label={label}
                      rows={4}
                      id={`task-field-${field.id}`}
                      className="space-y-2.5 [&_textarea]:min-h-[100px] [&_textarea]:rounded-xl [&_textarea]:border-border [&_textarea]:bg-background [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-sm [&_textarea]:font-medium"
                    />
                  );
                }
                if (field.kind === "date") {
                  return (
                    <DateField
                      key={field.id}
                      control={fieldsControl}
                      name={name}
                      label={label}
                      type="date"
                      id={`task-field-${field.id}`}
                      className="space-y-2.5 [&_input]:h-11 [&_input]:rounded-xl [&_input]:border-border [&_input]:font-medium"
                    />
                  );
                }
                return (
                  <TextField
                    key={field.id}
                    control={fieldsControl}
                    name={name}
                    label={label}
                    id={`task-field-${field.id}`}
                    className="space-y-2.5 [&_input]:h-11 [&_input]:rounded-xl [&_input]:border-border [&_input]:font-medium"
                  />
                );
              })}
            </div>
          ) : null}

          {def && def.uploadSlots.length > 0 ? (
            <div className="space-y-4">
              {def.uploadSlots.map((slot) => {
                const files = slotFiles[slot.id] ?? [];
                const atMax =
                  slot.maxFiles !== null && files.length >= slot.maxFiles;
                const inputId = `task-upload-${slot.id}`;
                return (
                  <div
                    key={slot.id}
                    className="rounded-xl border border-border bg-muted/15 p-4 shadow-sm ring-1 ring-black/5"
                  >
                    <input
                      id={inputId}
                      ref={(el) => {
                        fileInputRefs.current[slot.id] = el;
                      }}
                      type="file"
                      className="sr-only"
                      tabIndex={-1}
                      multiple={
                        slot.maxFiles === null || slot.maxFiles > 1
                      }
                      onChange={(e) => {
                        appendSlotFiles(
                          slot.id,
                          e.target.files,
                          slot.maxFiles,
                        );
                        e.target.value = "";
                      }}
                    />
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {t(`taskCreation.slots.${slot.labelKey}`)}
                        {slot.required ? (
                          <span className="text-destructive"> *</span>
                        ) : null}
                      </p>
                      {!atMax ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 rounded-lg text-xs font-semibold"
                          onClick={() =>
                            fileInputRefs.current[slot.id]?.click()
                          }
                        >
                          <Upload className="size-3.5" aria-hidden />
                          {files.length === 0
                            ? t("taskCreation.uploadAddFiles")
                            : t("taskCreation.uploadMore")}
                        </Button>
                      ) : null}
                    </div>
                    {files.length === 0 ? (
                      <p className="text-xs font-medium text-muted-foreground">
                        {t("taskCreation.uploadEmpty")}
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {files.map((file, idx) => (
                          <li
                            key={`${file.name}-${idx}`}
                            className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs font-medium"
                          >
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                const url = URL.createObjectURL(file);
                                window.open(url, "_blank");
                                // We don't revoke immediately because the window needs it
                                // In a real app, we'd manage these URLs better
                              }}
                              className="min-w-0 truncate hover:text-primary transition-colors"
                              title={t("taskCreation.viewFile")}
                            >
                              {file.name}
                            </a>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 shrink-0 rounded-md px-2 text-xs text-muted-foreground hover:text-destructive"
                              onClick={() => removeSlotFile(slot.id, idx)}
                            >
                              {t("taskCreation.removeFile")}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <DateField
              control={control}
              name="dueAt"
              label={t("taskDueLabel")}
              type="date"
              id="new-task-due"
              className="space-y-2.5 [&_input]:h-11 [&_input]:rounded-xl [&_input]:border-border [&_input]:font-medium"
            />
            <SelectField
              control={control}
              name="assigneeId"
              label={t("taskAssigneeLabel")}
              placeholderOption={{ value: "", label: t("taskAssigneeNone") }}
              options={assigneeOptions}
              id="new-task-assignee"
              className="space-y-2.5 [&_select]:h-11 [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-xl [&_select]:border-border [&_select]:px-3 [&_select]:text-sm [&_select]:font-medium"
            />
          </div>

          {!parseResult.success ? (
            <p className="text-xs font-medium text-destructive" role="alert">
              {formatLeadTaskCreationFailure(t, parseResult.failure)}
            </p>
          ) : null}

          {formError ? (
            <div
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-bold text-destructive"
              role="alert"
            >
              {formError}
            </div>
          ) : null}
        </DialogBody>

        <DialogFooter className="mt-4 gap-2 border-t border-border pt-4 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            className="rounded-xl text-sm font-semibold"
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            className="rounded-xl text-sm font-semibold shadow-md"
            disabled={!canSubmit}
            onClick={onSaveClick}
          >
            {saving ? t("taskCreation.creating") : t("taskSaveAdd")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogShell>
  );
}
