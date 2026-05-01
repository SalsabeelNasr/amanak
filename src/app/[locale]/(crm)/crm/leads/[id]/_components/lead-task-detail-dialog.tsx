"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { crm } from "@/lib/crm/client";
import {
  createAddTaskDialogMetaSchema,
  type AddTaskDialogMetaForm,
} from "@/lib/crm/schemas/task";
import {
  CRM_TASK_ASSIGNEE_IDS,
  type AddLeadTaskAttachmentInput,
} from "@/lib/crm/client.types";
import { formatLeadTaskCreationFailure } from "@/lib/crm/lead-task-creation-messages";
import { getLeadTaskCreationTypeDef } from "@/lib/config/lead-task-creation-types";
import {
  type LeadTaskCreationAttachmentInput,
  validateLeadTaskCreationCompletion,
} from "@/lib/lead-task-creation-schema";
import { ALL_TRANSITIONS } from "@/lib/services/state-machine.service";
import {
  LEAD_PATIENT_ASSIGNEE_ID,
  getSystemTaskTitle,
  getTransitionActionForSystemTaskCompletion,
} from "@/lib/services/lead-task-rules";
import type { Lead, LeadTask, MockUser } from "@/types";
import { Upload, UserCircle2 } from "lucide-react";

function dueDateFromIso(iso: string | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function dueAtFromDateInput(date: string): string | undefined {
  const t = date.trim();
  if (!t) return undefined;
  return new Date(`${t}T12:00:00`).toISOString();
}

function resolveTask(lead: Lead, taskId: string | null): LeadTask | null {
  return taskId ? (lead.tasks.find((x) => x.id === taskId) ?? null) : null;
}

function initialFieldValuesForTask(tsk: LeadTask | null): Record<string, string> {
  if (!tsk?.creationTypeId) return {};
  const d = getLeadTaskCreationTypeDef(tsk.creationTypeId);
  if (!d) return {};
  const fv: Record<string, string> = {};
  for (const f of d.fields) {
    fv[f.id] = tsk.creationFields?.[f.id] ?? "";
  }
  return fv;
}

function buildTaskDetailCompletionAttachmentInputs(
  tsk: LeadTask,
  slotFiles: Record<string, File[]>,
  def: NonNullable<ReturnType<typeof getLeadTaskCreationTypeDef>>,
): LeadTaskCreationAttachmentInput[] {
  const out: LeadTaskCreationAttachmentInput[] = [];
  for (const a of tsk.attachments ?? []) {
    out.push({
      slotId: a.slotId,
      fileName: a.fileName,
      sizeBytes: a.sizeBytes,
      mockUrl: a.mockUrl,
    });
  }
  for (const s of def.uploadSlots) {
    for (const f of slotFiles[s.id] ?? []) {
      out.push({ slotId: s.id, fileName: f.name, sizeBytes: f.size });
    }
  }
  return out;
}

export function LeadTaskDetailDialog({
  lead,
  taskId,
  open,
  onOpenChange,
  locale,
  isAuthenticated,
  user,
  onLeadUpdated,
  onSuccess,
  onError,
}: {
  lead: Lead;
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  isAuthenticated: boolean;
  user: MockUser;
  onLeadUpdated: (lead: Lead) => void;
  onSuccess?: () => void;
  onError?: (message: string | null) => void;
}) {
  const t = useTranslations("crm");
  const task = useMemo(
    () => resolveTask(lead, taskId),
    [lead, taskId],
  );

  function resolveTitle(tsk: LeadTask): string {
    if (tsk.templateKey) {
      return getSystemTaskTitle(tsk.templateKey, t as any);
    }
    return tsk.title;
  }

  const metaSchema = useMemo(
    () => createAddTaskDialogMetaSchema(t("taskValidationInvalidAssignee")),
    [t],
  );
  const form = useForm<AddTaskDialogMetaForm>({
    resolver: zodResolver(metaSchema),
    defaultValues: { dueAt: "", assigneeId: "" },
  });
  const { control, reset, handleSubmit } = form;

  type FieldFormValues = Record<string, string>;
  const fieldsForm = useForm<FieldFormValues>({
    defaultValues: initialFieldValuesForTask(
      resolveTask(lead, taskId),
    ) as FieldFormValues,
  });
  const {
    control: fieldsControl,
    reset: resetFields,
    getValues: getFieldValues,
  } = fieldsForm;

  const lastDialogSyncRef = useRef<{ open: boolean; taskId: string | null }>({
    open: false,
    taskId: null,
  });
  const [slotFiles, setSlotFiles] = useState<Record<string, File[]>>({});
  const [pipelineNote, setPipelineNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleDialogOpenChange = useCallback(
    (next: boolean) => {
      if (next) onError?.(null);
      onOpenChange(next);
    },
    [onError, onOpenChange],
  );

  const assigneeOptions = useMemo(
    () =>
      CRM_TASK_ASSIGNEE_IDS.map((id) => ({
        value: id,
        label: t(`taskAssignees.${id}` as Parameters<typeof t>[0]),
      })),
    [t],
  );

  useEffect(() => {
    if (!open || !task) return;
    const prev = lastDialogSyncRef.current;
    const shouldSync = (!prev.open && open) || prev.taskId !== taskId;
    if (shouldSync) {
      reset({
        dueAt: dueDateFromIso(task.dueAt),
        assigneeId: task.assigneeId ?? "",
      });
      resetFields(initialFieldValuesForTask(task) as FieldFormValues);
      setSlotFiles({});
      setPipelineNote("");
      setFormError(null);
    }
    lastDialogSyncRef.current = { open, taskId };
  }, [open, taskId, task, reset, resetFields]);

  const creationDef = task?.creationTypeId
    ? getLeadTaskCreationTypeDef(task.creationTypeId)
    : undefined;

  const transitionAction = task
    ? getTransitionActionForSystemTaskCompletion(lead, task)
    : null;
  const transitionMeta =
    transitionAction !== null
      ? ALL_TRANSITIONS.find(
          (x) => x.from === lead.status && x.action === transitionAction,
        )
      : undefined;
  const requiresPipelineNote =
    !task?.completed &&
    transitionMeta?.requiresNote === true;

  const isPatientAssigned = task?.assigneeId === LEAD_PATIENT_ASSIGNEE_ID;
  const isMultiOutcomeQuoteTask =
    !!task &&
    !task.completed &&
    task.templateKey === "await_patient_quote_response" &&
    lead.status === "quotation_sent";

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

  const runSaveMetadata = useCallback(
    async (values: AddTaskDialogMetaForm) => {
      if (!task || !isAuthenticated) return;
      setFormError(null);
      onError?.(null);
      if (creationDef && task.creationTypeId) {
        const attInputs = buildTaskDetailCompletionAttachmentInputs(
          task,
          slotFiles,
          creationDef,
        );
        const v = validateLeadTaskCreationCompletion(
          task.creationTypeId,
          task.title,
          getFieldValues(),
          attInputs,
        );
        if (!v.success) {
          const msg = formatLeadTaskCreationFailure(t, v.failure);
          setFormError(msg);
          onError?.(msg);
          return;
        }
      }

      const urls: string[] = [];
      const newAttachments: AddLeadTaskAttachmentInput[] = [];
      if (creationDef) {
        for (const s of creationDef.uploadSlots) {
          for (const file of slotFiles[s.id] ?? []) {
            const mockUrl = URL.createObjectURL(file);
            urls.push(mockUrl);
            newAttachments.push({
              slotId: s.id,
              fileName: file.name,
              sizeBytes: file.size,
              mockUrl,
            });
          }
        }
      }

      const dueStr = values.dueAt?.trim() ?? "";
      setSaving(true);
      try {
        const updated = await crm.leads.updateTask(
          lead.id,
          task.id,
          {
            dueAt: dueAtFromDateInput(dueStr),
            assigneeId: values.assigneeId?.trim()
              ? values.assigneeId.trim()
              : "",
            ...(creationDef
              ? { creationFields: getFieldValues() }
              : {}),
            ...(newAttachments.length ? { attachments: newAttachments } : {}),
          },
          {},
        );
        urls.forEach((u) => URL.revokeObjectURL(u));
        onLeadUpdated(updated);
        setSlotFiles({});
        onSuccess?.();
      } catch (e) {
        urls.forEach((u) => URL.revokeObjectURL(u));
        const msg =
          e instanceof Error ? e.message : t("taskCompleteErrorGeneric");
        setFormError(msg);
        onError?.(msg);
        console.error(e);
      } finally {
        setSaving(false);
      }
    },
    [
      task,
      isAuthenticated,
      creationDef,
      slotFiles,
      getFieldValues,
      lead.id,
      onLeadUpdated,
      onSuccess,
      onError,
      t,
    ],
  );

  async function handleCompleteOrReopen() {
    if (!task || !isAuthenticated) return;
    setFormError(null);
    onError?.(null);

    if (task.completed) {
      setSaving(true);
      try {
        const updated = await crm.leads.updateTask(
          lead.id,
          task.id,
          { completed: false },
          {},
        );
        onLeadUpdated(updated);
        onSuccess?.();
        onOpenChange(false);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : t("taskCompleteErrorGeneric");
        setFormError(msg);
        onError?.(msg);
        console.error(e);
      } finally {
        setSaving(false);
      }
      return;
    }

    await runCompleteSubmit();
  }

  async function runCompleteSubmit(
    extraPatch?: { completionOutcome?: "accepted" | "changes_requested" },
  ) {
    if (!task || !isAuthenticated) return;

    void handleSubmit(async (values: AddTaskDialogMetaForm) => {
      if (requiresPipelineNote && !pipelineNote.trim()) {
        const msg = t("taskCompleteNoteDescription");
        setFormError(msg);
        onError?.(msg);
        return;
      }

      if (creationDef && task.creationTypeId) {
        const attInputs = buildTaskDetailCompletionAttachmentInputs(
          task,
          slotFiles,
          creationDef,
        );
        const v = validateLeadTaskCreationCompletion(
          task.creationTypeId,
          task.title,
          getFieldValues(),
          attInputs,
        );
        if (!v.success) {
          const msg = formatLeadTaskCreationFailure(t, v.failure);
          setFormError(msg);
          onError?.(msg);
          return;
        }
      }

      const urls: string[] = [];
      const newAttachments: AddLeadTaskAttachmentInput[] = [];
      if (creationDef) {
        for (const s of creationDef.uploadSlots) {
          for (const file of slotFiles[s.id] ?? []) {
            const mockUrl = URL.createObjectURL(file);
            urls.push(mockUrl);
            newAttachments.push({
              slotId: s.id,
              fileName: file.name,
              sizeBytes: file.size,
              mockUrl,
            });
          }
        }
      }

      const dueStr = values.dueAt?.trim() ?? "";
      setSaving(true);
      try {
        const updated = await crm.leads.updateTask(
          lead.id,
          task.id,
          {
            completed: true,
            dueAt: dueAtFromDateInput(dueStr),
            assigneeId: values.assigneeId?.trim()
              ? values.assigneeId.trim()
              : "",
            ...(creationDef
              ? { creationFields: getFieldValues() }
              : {}),
            ...(newAttachments.length ? { attachments: newAttachments } : {}),
            ...(extraPatch?.completionOutcome
              ? { completionOutcome: extraPatch.completionOutcome }
              : {}),
          },
          { actor: user ?? undefined, note: pipelineNote.trim() || undefined },
        );
        urls.forEach((u) => URL.revokeObjectURL(u));
        onLeadUpdated(updated);
        onSuccess?.();
        onOpenChange(false);
      } catch (e) {
        urls.forEach((u) => URL.revokeObjectURL(u));
        const msg =
          e instanceof Error ? e.message : t("taskCompleteErrorGeneric");
        setFormError(msg);
        onError?.(msg);
        console.error(e);
      } finally {
        setSaving(false);
      }
    })();
  }

  async function handleDelete() {
    if (!task || !isAuthenticated) return;
    if (!window.confirm(t("taskDeleteConfirm"))) return;
    setSaving(true);
    setFormError(null);
    onError?.(null);
    try {
      const updated = await crm.leads.deleteTask(lead.id, task.id, {});
      onLeadUpdated(updated);
      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : t("taskCompleteErrorGeneric");
      setFormError(msg);
      onError?.(msg);
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const notFound = open && taskId && !task;

  return (
    <DialogShell open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        dir={locale === "ar" ? "rtl" : "ltr"}
        size="xl"
        layout="scrollableTall"
      >
        {notFound ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("taskDetailNotFoundTitle")}</DialogTitle>
              <DialogDescription>
                {t("taskDetailNotFoundDescription")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 border-t border-border pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                {t("cancel")}
              </Button>
            </DialogFooter>
          </>
        ) : task ? (
          <>
            <DialogHeader>
              <DialogTitle className="pe-8">{resolveTitle(task)}</DialogTitle>
              <DialogDescription>{t("taskDetailDescription")}</DialogDescription>
              <div className="flex flex-wrap gap-2 pt-2">
                {task.completed ? (
                  <Badge variant="secondary">{t("taskCompletedLabel")}</Badge>
                ) : null}
                {task.creationTypeId && creationDef ? (
                  <Badge variant="outline" className="text-xs">
                    {t(`taskCreation.types.${task.creationTypeId}.title`)}
                  </Badge>
                ) : null}
                {isPatientAssigned ? (
                  <Badge
                    variant="outline"
                    className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  >
                    <UserCircle2 className="size-3" aria-hidden />
                    {t("taskAssigneePatientBadge")}
                  </Badge>
                ) : null}
              </div>
              {isPatientAssigned && !task.completed ? (
                <p className="pt-2 text-xs font-medium text-muted-foreground">
                  {t("taskAssigneePatientHint")}
                </p>
              ) : null}
            </DialogHeader>

            <DialogBody className="space-y-6 py-4">
              {!isAuthenticated ? (
                <p className="text-sm text-muted-foreground">
                  {t("taskLoginHint")}
                </p>
              ) : null}

              {formError ? (
                <div
                  className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive"
                  role="alert"
                >
                  {formError}
                </div>
              ) : null}

              <div className="grid gap-5 sm:grid-cols-2 [&_label]:amanak-app-field-label">
                <DateField
                  control={control}
                  name="dueAt"
                  label={t("taskDueLabel")}
                  type="date"
                  id="task-detail-due"
                  disabled={!isAuthenticated || task.completed || isPatientAssigned}
                  className="space-y-2.5 [&_input]:h-11 [&_input]:rounded-xl [&_input]:border-border [&_input]:font-medium"
                />
                {isPatientAssigned ? (
                  <div className="space-y-2.5">
                    <p className="amanak-app-field-label">{t("taskAssigneeLabel")}</p>
                    <div className="flex h-11 items-center rounded-xl border border-border bg-muted/30 px-3 text-sm font-medium text-foreground">
                      <UserCircle2 className="me-2 size-4 text-amber-600 dark:text-amber-400" aria-hidden />
                      {t("taskAssigneePatientBadge")}
                    </div>
                  </div>
                ) : (
                  <SelectField
                    control={control}
                    name="assigneeId"
                    label={t("taskAssigneeLabel")}
                    placeholderOption={{ value: "", label: t("taskAssigneeNone") }}
                    options={assigneeOptions}
                    id="task-detail-assignee"
                    disabled={!isAuthenticated || task.completed}
                    className="space-y-2.5 [&_select]:h-11 [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-xl [&_select]:border-border [&_select]:px-3 [&_select]:text-sm [&_select]:font-medium"
                  />
                )}
              </div>

              {creationDef && creationDef.fields.length > 0 ? (
                <div className="space-y-4 [&_label]:amanak-app-field-label">
                  {creationDef.fields.map((field) => {
                    const name = field.id as FieldPath<FieldFormValues>;
                    const disabledF = !isAuthenticated || task.completed;
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
                          disabled={disabledF}
                          id={`task-detail-field-${field.id}`}
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
                          disabled={disabledF}
                          id={`task-detail-field-${field.id}`}
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
                        disabled={disabledF}
                        id={`task-detail-field-${field.id}`}
                        className="space-y-2.5 [&_input]:h-11 [&_input]:rounded-xl [&_input]:border-border [&_input]:font-medium"
                      />
                    );
                  })}
                </div>
              ) : null}

              {creationDef && creationDef.uploadSlots.length > 0 ? (
                <div className="space-y-4">
                  {task.attachments && task.attachments.length > 0 ? (
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                      <p className="mb-2 text-xs font-semibold text-muted-foreground">
                        {t("taskDetailUploadedFiles")}
                      </p>
                      <ul className="space-y-1 text-sm">
                        {task.attachments.map((a) => (
                          <li key={a.id}>
                            {a.mockUrl ? (
                              <a
                                href={a.mockUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-primary underline-offset-4 hover:underline"
                              >
                                {a.fileName}
                              </a>
                            ) : (
                              <span>{a.fileName}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {creationDef.uploadSlots.map((slot) => {
                    const files = slotFiles[slot.id] ?? [];
                    const atMax =
                      slot.maxFiles !== null && files.length >= slot.maxFiles;
                    const inputId = `task-detail-upload-${slot.id}`;
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
                          disabled={!isAuthenticated || task.completed}
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
                          {!atMax && isAuthenticated && !task.completed ? (
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
                                <span className="min-w-0 truncate">{file.name}</span>
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

              {!task.completed && requiresPipelineNote ? (
                <div className="space-y-2">
                  <Label htmlFor="task-detail-pipeline-note" className="amanak-app-field-label">
                    {t("addNote")}
                  </Label>
                  <textarea
                    id="task-detail-pipeline-note"
                    value={pipelineNote}
                    onChange={(e) => setPipelineNote(e.target.value)}
                    rows={4}
                    placeholder="..."
                    className="min-h-[100px] w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("taskCompleteNoteDescription")}
                  </p>
                </div>
              ) : null}
            </DialogBody>

            <DialogFooter className="mt-4 flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:flex-wrap sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={!isAuthenticated || saving}
                  onClick={() => void handleDelete()}
                >
                  {t("taskDelete")}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-xl"
                  disabled={saving}
                  onClick={() => onOpenChange(false)}
                >
                  {t("cancel")}
                </Button>
                {isAuthenticated && !task.completed && !isPatientAssigned ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-xl"
                    disabled={saving}
                    onClick={() => void handleSubmit(runSaveMetadata)()}
                  >
                    {t("taskSaveChanges")}
                  </Button>
                ) : null}
                {isAuthenticated && isMultiOutcomeQuoteTask ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      disabled={saving}
                      onClick={() =>
                        void runCompleteSubmit({
                          completionOutcome: "changes_requested",
                        })
                      }
                    >
                      {t("taskOutcomeChangesRequested")}
                    </Button>
                    <Button
                      type="button"
                      className="rounded-xl shadow-md"
                      disabled={saving}
                      onClick={() =>
                        void runCompleteSubmit({ completionOutcome: "accepted" })
                      }
                    >
                      {t("taskOutcomeAccepted")}
                    </Button>
                  </>
                ) : isAuthenticated ? (
                  <Button
                    type="button"
                    className="rounded-xl shadow-md"
                    disabled={
                      saving ||
                      (!task.completed &&
                        requiresPipelineNote &&
                        !pipelineNote.trim())
                    }
                    onClick={() => void handleCompleteOrReopen()}
                  >
                    {task.completed ? t("taskReopen") : t("taskMarkComplete")}
                  </Button>
                ) : null}
              </div>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </DialogShell>
  );
}
