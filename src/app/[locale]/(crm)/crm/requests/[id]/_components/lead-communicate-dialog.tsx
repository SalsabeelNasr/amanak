"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
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
import { TextareaField } from "@/components/crm/forms/textarea-field";
import { TextField } from "@/components/crm/forms/text-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crm } from "@/lib/crm/client";
import {
  createCommunicateFormSchema,
  getDefaultCommunicateFormValues,
  type CommunicateDialogMode,
  type CommunicateFormValues,
} from "@/lib/crm/schemas/communicate";
import {
  MESSAGE_TEMPLATE_IDS,
  type MessageTemplateId,
} from "@/lib/config/communicate-templates";
import { filterQuotationsByQuery } from "@/lib/crm-quotation-search";
import { cn } from "@/lib/utils";
import type { Lead, LeadConversationItem, Patient, Quotation } from "@/types";
import { Mail, MessageSquare, PenLine, Phone, Smartphone, X } from "lucide-react";

export type { CommunicateDialogMode as CommunicateMode } from "@/lib/crm/schemas/communicate";

type TemplateSelection = "" | MessageTemplateId;

function newConversationId(requestId: string): string {
  return `conv_${requestId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function previewFromText(text: string, max = 96): string {
  const s = text.replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max).trim()}…`;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  patient?: Patient | null;
  locale: string;
  actorEmail: string;
  isAuthenticated: boolean;
  quotations: Quotation[];
  onRequestViewQuotation: (quotation: Quotation) => void;
  onAppended: (item: LeadConversationItem) => void;
};

export function LeadCommunicateDialog({
  open,
  onOpenChange,
  lead,
  patient,
  locale,
  actorEmail,
  isAuthenticated,
  quotations,
  onRequestViewQuotation,
  onAppended,
}: Props) {
  const t = useTranslations("crm");
  const displayName = patient?.name ?? lead.patientId;
  const tplVars = useMemo(() => ({ name: displayName }), [displayName]);

  const [mode, setMode] = useState<CommunicateDialogMode>("log_call");
  const [waTemplateId, setWaTemplateId] = useState<TemplateSelection>("");
  const [emailTemplateId, setEmailTemplateId] = useState<TemplateSelection>("");
  const [smsTemplateId, setSmsTemplateId] = useState<TemplateSelection>("");
  const [attachedQuotationIds, setAttachedQuotationIds] = useState<string[]>([]);
  const [attachSearch, setAttachSearch] = useState("");
  const [attachPanelOpen, setAttachPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const attachPopoverRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<CommunicateDialogMode>(mode);
  modeRef.current = mode;

  const zodFormResolver: Resolver<CommunicateFormValues> = useCallback(
    async (values, context, options) => {
      const schema = createCommunicateFormSchema({
        mode: modeRef.current,
        messages: {
          when: t("convComposeErrorWhen"),
          callNotes: t("convComposeErrorNotes"),
          message: t("convComposeErrorMessage"),
          emailFields: t("convComposeErrorEmailFields"),
          noPatientEmail: t("convComposeErrorNoPatientEmail"),
          noPatientPhone: t("convComposeErrorNoPatientPhone"),
        },
        hasPatientEmail: Boolean(patient?.email?.trim()),
        hasPatientPhone: Boolean(patient?.phone?.trim()),
      });
      return zodResolver(schema)(values, context, options);
    },
    [t, patient?.email, patient?.phone],
  );

  const form = useForm<CommunicateFormValues>({
    resolver: zodFormResolver,
    defaultValues: getDefaultCommunicateFormValues(() => toDatetimeLocalValue(new Date())),
  });

  const { control, setValue, handleSubmit, reset, clearErrors } = form;

  const langKey = locale === "ar" ? "ar" : "en";
  const attachExcludeIds = useMemo(
    () => new Set(attachedQuotationIds),
    [attachedQuotationIds],
  );
  const attachMatches = useMemo(
    () =>
      filterQuotationsByQuery(quotations, attachSearch, langKey, attachExcludeIds),
    [quotations, attachSearch, langKey, attachExcludeIds],
  );

  useEffect(() => {
    if (!attachPanelOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAttachPanelOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [attachPanelOpen]);

  useEffect(() => {
    if (!attachPanelOpen) return;
    function onDoc(e: MouseEvent) {
      const el = attachPopoverRef.current;
      if (el && !el.contains(e.target as Node)) setAttachPanelOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [attachPanelOpen]);

  const resetForm = useCallback(() => {
    setMode("log_call");
    reset(
      getDefaultCommunicateFormValues(() => toDatetimeLocalValue(new Date())),
    );
    setWaTemplateId("");
    setEmailTemplateId("");
    setSmsTemplateId("");
    setAttachedQuotationIds([]);
    setAttachSearch("");
    setAttachPanelOpen(false);
    setCommitError(null);
  }, [reset]);

  const handleDialogOpenChange = useCallback(
    (next: boolean) => {
      if (next) resetForm();
      onOpenChange(next);
    },
    [onOpenChange, resetForm],
  );

  function templateLabelKey(id: MessageTemplateId): Parameters<typeof t>[0] {
    return `convComposeTpl_${id}` as Parameters<typeof t>[0];
  }

  function buildOutboundAttachmentHint(
    templateId: TemplateSelection,
    quoteCount: number,
  ): string | undefined {
    const parts: string[] = [];
    if (templateId !== "")
      parts.push(t(templateLabelKey(templateId as MessageTemplateId)));
    if (quoteCount > 0)
      parts.push(t("convComposeAttachedSummary", { count: quoteCount }));
    return parts.length > 0 ? parts.join(" · ") : undefined;
  }

  function previewWithQuotes(baseText: string, quoteCount: number): string {
    const base = previewFromText(baseText);
    if (quoteCount === 0) return base;
    const extra = t("convComposeAttachedSummary", { count: quoteCount });
    return previewFromText(`${base} — ${extra}`);
  }

  function applyWhatsappTemplate(id: TemplateSelection) {
    setWaTemplateId(id);
    if (id === "") setValue("waMessage", "");
    else
      setValue(
        "waMessage",
        t(`convComposeTpl_${id}_wa` as Parameters<typeof t>[0], tplVars),
      );
  }

  function applyEmailTemplate(id: TemplateSelection) {
    setEmailTemplateId(id);
    if (id === "") {
      setValue("emailSubject", "");
      setValue("emailBody", "");
    } else {
      setValue(
        "emailSubject",
        t(`convComposeTpl_${id}_emailSubject` as Parameters<typeof t>[0], tplVars),
      );
      setValue(
        "emailBody",
        t(`convComposeTpl_${id}_emailBody` as Parameters<typeof t>[0], tplVars),
      );
    }
  }

  function applySmsTemplate(id: TemplateSelection) {
    setSmsTemplateId(id);
    if (id === "") setValue("smsMessage", "");
    else
      setValue(
        "smsMessage",
        t(`convComposeTpl_${id}_sms` as Parameters<typeof t>[0], tplVars),
      );
  }

  const submitLabel = useMemo(() => {
    switch (mode) {
      case "log_call":
        return t("convSubmitLogCall");
      case "whatsapp":
        return t("convSubmitWhatsapp");
      case "email":
        return t("convSubmitEmail");
      case "sms":
        return t("convSubmitSms");
      default:
        return t("confirm");
    }
  }, [mode, t]);

  const commitConversation = useCallback(
    async (values: CommunicateFormValues) => {
      if (!isAuthenticated || mode === "app_call") return;
      setCommitError(null);
      const occurredAtMs = Date.parse(values.whenLocal);
      const occurredAt = new Date(occurredAtMs).toISOString();

      if (mode === "log_call") {
        const notes = values.callNotes.trim();
        const item: LeadConversationItem = {
          id: newConversationId(lead.id),
          requestId: lead.id,
          channel: "call",
          callKind: "manual_log",
          occurredAt,
          direction: "internal",
          transcript: notes,
          preview: previewFromText(notes),
        };
        setSaving(true);
        try {
          await crm.conversations.append(lead.id, item, {});
          onAppended(item);
          onOpenChange(false);
        } catch (e) {
          console.error(e);
          setCommitError(t("convComposeErrorGeneric"));
        } finally {
          setSaving(false);
        }
        return;
      }

      if (mode === "whatsapp") {
        const body = values.waMessage.trim();
        const item: LeadConversationItem = {
          id: newConversationId(lead.id),
          requestId: lead.id,
          channel: "whatsapp",
          occurredAt,
          direction: "outbound",
          body,
          preview: previewWithQuotes(body, attachedQuotationIds.length),
          attachmentHint: buildOutboundAttachmentHint(
            waTemplateId,
            attachedQuotationIds.length,
          ),
          attachedQuotationIds:
            attachedQuotationIds.length > 0 ? [...attachedQuotationIds] : undefined,
        };
        setSaving(true);
        try {
          await crm.conversations.append(lead.id, item, {});
          onAppended(item);
          onOpenChange(false);
        } catch (e) {
          console.error(e);
          setCommitError(t("convComposeErrorGeneric"));
        } finally {
          setSaving(false);
        }
        return;
      }

      if (mode === "sms") {
        const phone = patient?.phone!.trim();
        const body = values.smsMessage.trim();
        const item: LeadConversationItem = {
          id: newConversationId(lead.id),
          requestId: lead.id,
          channel: "sms",
          occurredAt,
          direction: "outbound",
          body,
          toPhone: phone,
          preview: previewWithQuotes(body, attachedQuotationIds.length),
          attachmentHint: buildOutboundAttachmentHint(
            smsTemplateId,
            attachedQuotationIds.length,
          ),
          attachedQuotationIds:
            attachedQuotationIds.length > 0 ? [...attachedQuotationIds] : undefined,
        };
        setSaving(true);
        try {
          await crm.conversations.append(lead.id, item, {});
          onAppended(item);
          onOpenChange(false);
        } catch (e) {
          console.error(e);
          setCommitError(t("convComposeErrorGeneric"));
        } finally {
          setSaving(false);
        }
        return;
      }

      const to = (patient?.email ?? "").trim();
      if (!to) {
        setCommitError(t("convComposeErrorGeneric"));
        return;
      }
      const subject = values.emailSubject.trim();
      const body = values.emailBody.trim();
      const item: LeadConversationItem = {
        id: newConversationId(lead.id),
        requestId: lead.id,
        channel: "email",
        occurredAt,
        direction: "outbound",
        subject,
        body,
        snippet: previewFromText(body),
        from: actorEmail,
        to,
        preview: previewWithQuotes(
          `${subject} — ${body}`,
          attachedQuotationIds.length,
        ),
        attachmentHint: buildOutboundAttachmentHint(
          emailTemplateId,
          attachedQuotationIds.length,
        ),
        attachedQuotationIds:
          attachedQuotationIds.length > 0 ? [...attachedQuotationIds] : undefined,
      };
      setSaving(true);
      try {
        await crm.conversations.append(lead.id, item, {});
        onAppended(item);
        onOpenChange(false);
      } catch (e) {
        console.error(e);
        setCommitError(t("convComposeErrorGeneric"));
      } finally {
        setSaving(false);
      }
    },
    [
      isAuthenticated,
      mode,
      lead,
      t,
      waTemplateId,
      attachedQuotationIds,
      onAppended,
      onOpenChange,
      smsTemplateId,
      emailTemplateId,
      actorEmail,
    ],
  );

  const modeButtons: {
    id: CommunicateDialogMode;
    labelKey: Parameters<typeof t>[0];
    Icon: typeof PenLine;
  }[] = [
    { id: "log_call", labelKey: "convModeLogCall", Icon: PenLine },
    { id: "app_call", labelKey: "convModeAppCall", Icon: Phone },
    { id: "whatsapp", labelKey: "convModeWhatsapp", Icon: MessageSquare },
    { id: "email", labelKey: "convModeEmail", Icon: Mail },
    { id: "sms", labelKey: "convModeSms", Icon: Smartphone },
  ];

  function renderTemplateSelect(
    idPrefix: string,
    value: TemplateSelection,
    onApply: (id: TemplateSelection) => void,
  ) {
    return (
      <div className="space-y-2">
        <Label htmlFor={idPrefix} className="amanak-app-field-label">
          {t("convComposeTemplate")}
        </Label>
        <select
          id={idPrefix}
          value={value}
          onChange={(e) => onApply(e.target.value as TemplateSelection)}
          className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          <option value="">{t("convComposeTemplateNone")}</option>
          {MESSAGE_TEMPLATE_IDS.map((tid) => (
            <option key={tid} value={tid}>
              {t(templateLabelKey(tid))}
            </option>
          ))}
        </select>
      </div>
    );
  }

  function renderAttachQuotationsField(inputId: string) {
    if (quotations.length === 0) return null;
    return (
      <div ref={attachPopoverRef} className="space-y-2">
        <Label htmlFor={inputId} className="amanak-app-field-label">
          {t("convComposeAttachQuotations")}
        </Label>
        {attachedQuotationIds.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {attachedQuotationIds.map((id) => {
              const q = quotations.find((x) => x.id === id);
              if (!q) return null;
              return (
                <div
                  key={id}
                  className="flex items-center gap-0.5 rounded-lg border border-border bg-background ring-1 ring-black/5"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-md px-2.5 text-xs font-semibold"
                    onClick={() => onRequestViewQuotation(q)}
                  >
                    {t("quotesTabHeading")}, v{q.version}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 rounded-md text-muted-foreground hover:text-foreground"
                    aria-label={t("convComposeAttachRemoveAria")}
                    onClick={() =>
                      setAttachedQuotationIds((prev) => prev.filter((x) => x !== id))
                    }
                  >
                    <X className="size-3.5" aria-hidden />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : null}
        <div className="relative">
          <Input
            id={inputId}
            value={attachSearch}
            onChange={(e) => {
              setAttachSearch(e.target.value);
              setAttachPanelOpen(true);
            }}
            onFocus={() => setAttachPanelOpen(true)}
            placeholder={t("convComposeAttachSearch")}
            className="rounded-xl font-medium"
            autoComplete="off"
          />
          {attachPanelOpen ? (
            <ul
              className="absolute start-0 end-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-popover p-1 text-start shadow-lg ring-1 ring-black/5"
              role="listbox"
            >
              {attachMatches.length === 0 ? (
                <li className="px-3 py-2.5 text-sm font-medium text-muted-foreground">
                  {t("convComposeAttachEmpty")}
                </li>
              ) : (
                attachMatches.map((q) => {
                  return (
                    <li key={q.id} role="option" aria-selected={false}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-start text-sm font-medium hover:bg-muted/80"
                        onClick={() => {
                          setAttachedQuotationIds((prev) => [...prev, q.id]);
                          setAttachSearch("");
                          setAttachPanelOpen(false);
                        }}
                      >
                        <span className="min-w-0 truncate">
                          {t("quotesTabHeading")}, v{q.version}
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          ${q.totalUSD.toLocaleString()}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <DialogShell open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        dir={locale === "ar" ? "rtl" : "ltr"}
        size="lg"
        layout="scrollable"
      >
        <DialogHeader>
          <DialogTitle>{t("convComposeTitle")}</DialogTitle>
          <DialogDescription>{t("convComposeDescription")}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6 py-4">
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label={t("convComposeModesAria")}
          >
            {modeButtons.map(({ id, labelKey, Icon }) => {
              const active = mode === id;
              return (
                <Button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  variant={active ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-9 gap-1.5 rounded-xl px-3 text-xs font-semibold shadow-none",
                    active && "shadow-sm",
                  )}
                  onClick={() => {
                    setMode(id);
                    setCommitError(null);
                    clearErrors();
                  }}
                >
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  {t(labelKey)}
                </Button>
              );
            })}
          </div>

          {mode === "log_call" ? (
            <div className="space-y-4">
              <div className="[&_label]:amanak-app-field-label">
                <DateField
                  control={control}
                  name="whenLocal"
                  label={t("convComposeWhenCall")}
                  type="datetime-local"
                  id="conv-when"
                  className="space-y-2.5 [&_input]:min-h-11 [&_input]:rounded-xl [&_input]:font-medium"
                />
              </div>
              <TextareaField
                control={control}
                name="callNotes"
                label={t("convComposeCallNotes")}
                rows={5}
                placeholder={t("convComposeCallNotesPlaceholder")}
                id="conv-call-notes"
                className="space-y-2.5 [&_label]:amanak-app-field-label [&_textarea]:min-h-[120px] [&_textarea]:rounded-xl [&_textarea]:border-border [&_textarea]:bg-background [&_textarea]:p-3 [&_textarea]:text-sm [&_textarea]:font-medium [&_textarea]:focus-visible:ring-2 [&_textarea]:focus-visible:ring-primary/20"
              />
            </div>
          ) : null}

          {mode === "app_call" ? (
            <div className="px-1 py-10 text-center" role="status">
              <p className="text-sm font-semibold text-foreground">
                {t("convComposeAppCallComingSoonTitle")}
              </p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
                {t("convComposeAppCallComingSoonBody")}
              </p>
            </div>
          ) : null}

          {mode === "whatsapp" && (
            <div className="space-y-4">
              <div className="[&_label]:amanak-app-field-label">
                <DateField
                  control={control}
                  name="whenLocal"
                  label={t("convComposeWhenSent")}
                  type="datetime-local"
                  id="conv-wa-when"
                  className="space-y-2.5 [&_input]:min-h-11 [&_input]:rounded-xl [&_input]:font-medium"
                />
              </div>
              {renderTemplateSelect("conv-wa-template", waTemplateId, applyWhatsappTemplate)}
              {renderAttachQuotationsField("conv-wa-attach-search")}
              <TextareaField
                control={control}
                name="waMessage"
                label={t("convComposeMessage")}
                rows={5}
                placeholder={t("convComposeMessagePlaceholder")}
                id="conv-wa-msg"
                className="space-y-2.5 [&_label]:amanak-app-field-label [&_textarea]:min-h-[120px] [&_textarea]:rounded-xl [&_textarea]:border-border [&_textarea]:bg-background [&_textarea]:p-3 [&_textarea]:text-sm [&_textarea]:font-medium [&_textarea]:focus-visible:ring-2 [&_textarea]:focus-visible:ring-primary/20"
              />
            </div>
          )}

          {mode === "email" && (
            <div className="space-y-4">
              <div className="[&_label]:amanak-app-field-label">
                <DateField
                  control={control}
                  name="whenLocal"
                  label={t("convComposeWhenSent")}
                  type="datetime-local"
                  id="conv-email-when"
                  className="space-y-2.5 [&_input]:min-h-11 [&_input]:rounded-xl [&_input]:font-medium"
                />
              </div>
              {renderTemplateSelect("conv-email-template", emailTemplateId, applyEmailTemplate)}
              {renderAttachQuotationsField("conv-email-attach-search")}
              <TextField
                control={control}
                name="emailSubject"
                label={t("convComposeEmailSubject")}
                id="conv-email-subj"
                className="space-y-2.5 [&_label]:amanak-app-field-label [&_input]:min-h-11 [&_input]:rounded-xl [&_input]:font-medium"
              />
              <TextareaField
                control={control}
                name="emailBody"
                label={t("convComposeEmailBody")}
                rows={6}
                placeholder={t("convComposeEmailBodyPlaceholder")}
                id="conv-email-body"
                className="space-y-2.5 [&_label]:amanak-app-field-label [&_textarea]:min-h-[140px] [&_textarea]:rounded-xl [&_textarea]:border-border [&_textarea]:bg-background [&_textarea]:p-3 [&_textarea]:text-sm [&_textarea]:font-medium [&_textarea]:focus-visible:ring-2 [&_textarea]:focus-visible:ring-primary/20"
              />
              <p className="text-xs font-medium text-muted-foreground">
                {t("convComposeEmailRouting", {
                  from: actorEmail,
                  to: patient?.email ?? t("fieldNotProvided"),
                })}
              </p>
            </div>
          )}

          {mode === "sms" && (
            <div className="space-y-4">
              <div className="[&_label]:amanak-app-field-label">
                <DateField
                  control={control}
                  name="whenLocal"
                  label={t("convComposeWhenSent")}
                  type="datetime-local"
                  id="conv-sms-when"
                  className="space-y-2.5 [&_input]:min-h-11 [&_input]:rounded-xl [&_input]:font-medium"
                />
              </div>
              {renderTemplateSelect("conv-sms-template", smsTemplateId, applySmsTemplate)}
              {renderAttachQuotationsField("conv-sms-attach-search")}
              <TextareaField
                control={control}
                name="smsMessage"
                label={t("convComposeMessage")}
                rows={4}
                placeholder={t("convComposeSmsPlaceholder")}
                id="conv-sms-msg"
                className="space-y-2.5 [&_label]:amanak-app-field-label [&_textarea]:min-h-[100px] [&_textarea]:rounded-xl [&_textarea]:border-border [&_textarea]:bg-background [&_textarea]:p-3 [&_textarea]:text-sm [&_textarea]:font-medium [&_textarea]:focus-visible:ring-2 [&_textarea]:focus-visible:ring-primary/20"
              />
              <p className="text-xs font-medium text-muted-foreground">
                {t("convComposeSmsRouting", {
                  phone: patient?.phone?.trim() || t("fieldNotProvided"),
                })}
              </p>
            </div>
          )}

          {commitError ? (
            <p className="text-xs font-semibold text-destructive" role="alert">
              {commitError}
            </p>
          ) : null}
        </DialogBody>

        <DialogFooter className="mt-4 gap-2 border-t border-border pt-4 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl text-sm font-semibold"
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          {mode === "app_call" ? null : (
            <Button
              type="button"
              className="rounded-xl text-sm font-semibold shadow-md"
              disabled={!isAuthenticated || saving}
              onClick={() => void handleSubmit(commitConversation)()}
            >
              {saving ? t("convComposeSaving") : submitLabel}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </DialogShell>
  );
}
