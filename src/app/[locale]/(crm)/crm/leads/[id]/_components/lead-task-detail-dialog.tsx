"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { crm } from "@/lib/crm/client";
import {
  CRM_TASK_ASSIGNEE_IDS,
  type AddLeadTaskAttachmentInput,
} from "@/lib/crm/client.types";
import { getLeadTaskCreationTypeDef } from "@/lib/config/lead-task-creation-types";
import { ALL_TRANSITIONS } from "@/lib/services/state-machine.service";
import { getTransitionActionForSystemTaskCompletion } from "@/lib/services/lead-task-rules";
import { cn } from "@/lib/utils";
import type { Lead, LeadTask, MockUser } from "@/types";
import { Upload } from "lucide-react";

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

  const [dueDate, setDueDate] = useState(() =>
    dueDateFromIso(resolveTask(lead, taskId)?.dueAt),
  );
  const [assigneeId, setAssigneeId] = useState(
    () => resolveTask(lead, taskId)?.assigneeId ?? "",
  );
  const [fieldValues, setFieldValues] = useState(() =>
    initialFieldValuesForTask(resolveTask(lead, taskId)),
  );
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

  async function handleSaveMetadata() {
    if (!task || !isAuthenticated) return;
    setFormError(null);
    onError?.(null);
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

    setSaving(true);
    try {
      const updated = await crm.leads.updateTask(
        lead.id,
        task.id,
        {
          dueAt: dueAtFromDateInput(dueDate),
          assigneeId: assigneeId.trim() ? assigneeId.trim() : "",
          ...(creationDef ? { creationFields: fieldValues } : {}),
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
  }

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

    if (requiresPipelineNote && !pipelineNote.trim()) {
      const msg = t("taskCompleteNoteDescription");
      setFormError(msg);
      onError?.(msg);
      return;
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

    setSaving(true);
    try {
      const updated = await crm.leads.updateTask(
        lead.id,
        task.id,
        {
          completed: true,
          dueAt: dueAtFromDateInput(dueDate),
          assigneeId: assigneeId.trim() ? assigneeId.trim() : "",
          ...(creationDef ? { creationFields: fieldValues } : {}),
          ...(newAttachments.length ? { attachments: newAttachments } : {}),
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
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
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
              <DialogTitle className="pe-8">{task.title}</DialogTitle>
              <DialogDescription>{t("taskDetailDescription")}</DialogDescription>
              <div className="flex flex-wrap gap-2 pt-2">
                {task.completed ? (
                  <Badge variant="secondary">{t("taskCompletedLabel")}</Badge>
                ) : null}
                {(task.source === "system" || task.templateKey) && (
                  <Badge variant="outline" className="text-xs">
                    {t("taskSourceAuto")}
                  </Badge>
                )}
                {task.creationTypeId && creationDef ? (
                  <Badge variant="outline" className="text-xs">
                    {t(`taskCreation.types.${task.creationTypeId}.title`)}
                  </Badge>
                ) : null}
              </div>
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

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="task-detail-due" className="amanak-app-field-label">
                    {t("taskDueLabel")}
                  </Label>
                  <Input
                    id="task-detail-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={!isAuthenticated || task.completed}
                    className="h-11 rounded-xl border-border bg-background font-medium focus-visible:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="task-detail-assignee"
                    className="amanak-app-field-label"
                  >
                    {t("taskAssigneeLabel")}
                  </Label>
                  <select
                    id="task-detail-assignee"
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    disabled={!isAuthenticated || task.completed}
                    className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                  >
                    <option value="">{t("taskAssigneeNone")}</option>
                    {CRM_TASK_ASSIGNEE_IDS.map((id) => (
                      <option key={id} value={id}>
                        {t(`taskAssignees.${id}` as Parameters<typeof t>[0])}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {creationDef && creationDef.fields.length > 0 ? (
                <div className="space-y-4">
                  {creationDef.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label
                        htmlFor={`task-detail-field-${field.id}`}
                        className="amanak-app-field-label"
                      >
                        {t(`taskCreation.fields.${field.labelKey}`)}
                        {field.required ? " *" : ""}
                      </Label>
                      {field.kind === "textarea" ? (
                        <textarea
                          id={`task-detail-field-${field.id}`}
                          value={fieldValues[field.id] ?? ""}
                          onChange={(e) =>
                            setFieldValues((prev) => ({
                              ...prev,
                              [field.id]: e.target.value,
                            }))
                          }
                          disabled={!isAuthenticated || task.completed}
                          rows={4}
                          className={cn(
                            "min-h-[100px] w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium outline-none transition-all",
                            "focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20",
                          )}
                        />
                      ) : (
                        <Input
                          id={`task-detail-field-${field.id}`}
                          type={field.kind === "date" ? "date" : "text"}
                          value={fieldValues[field.id] ?? ""}
                          onChange={(e) =>
                            setFieldValues((prev) => ({
                              ...prev,
                              [field.id]: e.target.value,
                            }))
                          }
                          disabled={!isAuthenticated || task.completed}
                          className="h-11 rounded-xl border-border bg-background font-medium focus-visible:ring-primary/20"
                        />
                      )}
                    </div>
                  ))}
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
                {isAuthenticated && !task.completed ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-xl"
                    disabled={saving}
                    onClick={() => void handleSaveMetadata()}
                  >
                    {t("taskSaveChanges")}
                  </Button>
                ) : null}
                {isAuthenticated ? (
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
    </Dialog>
  );
}
