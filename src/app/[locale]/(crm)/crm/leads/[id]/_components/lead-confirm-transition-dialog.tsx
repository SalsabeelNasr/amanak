"use client";

import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { useLangKey } from "@/components/crm/use-lang-key";
import { getStatusLabel } from "@/lib/services/state-machine.service";
import type { LeadStatus, StateTransition } from "@/types";

type LeadConfirmTransitionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  /** Set when the user picked a typed transition from the "Next step" list. */
  pendingTransition: StateTransition | null;
  /** Set when the user picked a status from the "Skip to..." list. */
  pendingSkip: { from: LeadStatus; to: LeadStatus } | null;
  saving: boolean;
  onConfirm: (note: string) => void | Promise<void>;
  onCancel: () => void;
};

export function LeadConfirmTransitionDialog({
  open,
  onOpenChange,
  locale,
  pendingTransition,
  pendingSkip,
  saving,
  onConfirm,
  onCancel,
}: LeadConfirmTransitionDialogProps) {
  const t = useTranslations("crm");
  const langKey = useLangKey();
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) setNote("");
  }, [open]);

  const isSkip = pendingSkip !== null;
  const noteRequired = isSkip || pendingTransition?.requiresNote === true;
  const trimmed = note.trim();
  const canConfirm = !saving && (!noteRequired || trimmed.length > 0);

  const title = isSkip
    ? t("skipConfirmModalTitle")
    : (pendingTransition?.label[langKey] ?? t("confirmTransitionModalTitle"));

  const description = isSkip && pendingSkip
    ? t("skipConfirmModalDescription", {
        from: getStatusLabel(pendingSkip.from)[langKey],
        to: getStatusLabel(pendingSkip.to)[langKey],
      })
    : t("confirmTransitionModalDescription");

  return (
    <DialogShell open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={locale === "ar" ? "rtl" : "ltr"} size="sm" layout="scrollable">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirm-transition-note" className="amanak-app-field-label">
              {noteRequired ? t("addNote") : t("addNoteOptional")}
            </Label>
            <textarea
              id="confirm-transition-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="..."
              className="min-h-[100px] w-full resize-y rounded-xl border border-border bg-background p-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            {isSkip ? (
              <p className="text-[11px] font-medium text-amber-700/90 dark:text-amber-400/90">
                {t("skipNoteRequired")}
              </p>
            ) : null}
          </div>
        </DialogBody>

        <DialogFooter className="mt-2 flex-row flex-wrap gap-2 border-t border-border pt-4 sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl"
            disabled={saving}
            onClick={onCancel}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            className="rounded-xl shadow-md"
            disabled={!canConfirm}
            onClick={() => void onConfirm(trimmed)}
          >
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogShell>
  );
}
