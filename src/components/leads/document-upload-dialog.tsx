"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { crm } from "@/lib/crm/client";
import { LEAD_DOCUMENT_TYPE_ORDER } from "@/lib/crm/client.types";
import { cn } from "@/lib/utils";
import type { Lead, LeadDocument } from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  uploadedByUserId?: string;
  /** When the dialog opens, pre-select this type (e.g. from a checklist row). */
  defaultType?: LeadDocument["type"];
  /** Overrides the default upload dialog title (e.g. next-action payment proofs). */
  dialogTitle?: string;
  onUploaded: (lead: Lead) => void;
};

export function DocumentUploadDialog({
  open,
  onOpenChange,
  leadId,
  uploadedByUserId,
  defaultType,
  dialogTitle,
  onUploaded,
}: Props) {
  const t = useTranslations("portal");
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const typeGroupId = useId();
  const fileInputId = useId();

  const [docType, setDocType] = useState<LeadDocument["type"]>("medical_report");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /** Controlled `open` from parent does not call `onOpenChange(true)` — sync type when the dialog opens. */
  useEffect(() => {
    if (!open) return;
    setDocType(defaultType ?? "medical_report");
    setFile(null);
    setFormError(null);
  }, [open, defaultType]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setFile(null);
        setFormError(null);
      }
      onOpenChange(next);
    },
    [onOpenChange],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!file) {
      setFormError(t("uploadErrorFile"));
      return;
    }
    setSaving(true);
    try {
      const updated = await crm.requests.uploadDocument(
        leadId,
        {
          type: docType,
          fileName: file.name,
          uploadedByUserId,
        },
        {},
      );
      onUploaded(updated);
      handleOpenChange(false);
    } catch (err) {
      console.error(err);
      setFormError(t("uploadErrorGeneric"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent dir={dir} size="lg" layout="scrollable">
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden"
        >
          <DialogHeader>
            <DialogTitle>{dialogTitle ?? t("uploadModalTitle")}</DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor={fileInputId} className="amanak-app-field-label">
                {t("docFileLabel")}
              </Label>
              <InputFileRow
                id={fileInputId}
                file={file}
                onFileChange={setFile}
                chooseLabel={t("chooseFile")}
                noneLabel={t("noFileChosen")}
              />
            </div>

            <div className="space-y-2 max-w-xs">
              <Label htmlFor={typeGroupId} className="amanak-app-field-label">
                {t("docTypeLabel")}
              </Label>
              <select
                id={typeGroupId}
                value={docType}
                onChange={(e) => setDocType(e.target.value as LeadDocument["type"])}
                className={cn(
                  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none transition-all",
                  "focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                {LEAD_DOCUMENT_TYPE_ORDER.map((type) => (
                  <option key={type} value={type}>
                    {t(`docType_${type}`)}
                  </option>
                ))}
              </select>
            </div>

            {formError ? (
              <p className="text-sm font-medium text-destructive" role="alert">
                {formError}
              </p>
            ) : null}
          </DialogBody>

          <DialogFooter className="mt-4 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" className="rounded-xl font-semibold shadow-md" disabled={saving}>
              {saving ? "…" : t("uploadSubmit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InputFileRow({
  id,
  file,
  onFileChange,
  chooseLabel,
  noneLabel,
}: {
  id: string;
  file: File | null;
  onFileChange: (f: File | null) => void;
  chooseLabel: string;
  noneLabel: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label
        htmlFor={id}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-9 shrink-0 cursor-pointer rounded-xl",
        )}
      >
        {chooseLabel}
      </label>
      <input
        id={id}
        type="file"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          onFileChange(f);
        }}
      />
      <p className="min-w-0 truncate text-sm text-muted-foreground">
        {file ? file.name : noneLabel}
      </p>
    </div>
  );
}
