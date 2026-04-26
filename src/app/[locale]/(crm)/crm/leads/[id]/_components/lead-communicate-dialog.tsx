"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { appendLeadConversation } from "@/lib/api/lead-conversations";
import {
  MESSAGE_TEMPLATE_IDS,
  type MessageTemplateId,
} from "@/lib/config/communicate-templates";
import { filterQuotationsByQuery } from "@/lib/crm-quotation-search";
import { cn } from "@/lib/utils";
import type { Lead, LeadConversationItem, Quotation } from "@/types";
import { Mail, MessageSquare, PenLine, Phone, Smartphone, X } from "lucide-react";

export type CommunicateMode = "log_call" | "app_call" | "whatsapp" | "email" | "sms";

type TemplateSelection = "" | MessageTemplateId;

function newConversationId(leadId: string): string {
  return `conv_${leadId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
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
  locale,
  actorEmail,
  isAuthenticated,
  quotations,
  onRequestViewQuotation,
  onAppended,
}: Props) {
  const t = useTranslations("crm");
  const tplVars = useMemo(() => ({ name: lead.patientName }), [lead.patientName]);

  const [mode, setMode] = useState<CommunicateMode>("log_call");
  const [whenLocal, setWhenLocal] = useState(() => toDatetimeLocalValue(new Date()));
  const [callNotes, setCallNotes] = useState("");
  const [waTemplateId, setWaTemplateId] = useState<TemplateSelection>("");
  const [waMessage, setWaMessage] = useState("");
  const [emailTemplateId, setEmailTemplateId] = useState<TemplateSelection>("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [smsTemplateId, setSmsTemplateId] = useState<TemplateSelection>("");
  const [smsMessage, setSmsMessage] = useState("");
  const [attachedQuotationIds, setAttachedQuotationIds] = useState<string[]>([]);
  const [attachSearch, setAttachSearch] = useState("");
  const [attachPanelOpen, setAttachPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attachPopoverRef = useRef<HTMLDivElement>(null);

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
    setWhenLocal(toDatetimeLocalValue(new Date()));
    setCallNotes("");
    setWaTemplateId("");
    setWaMessage("");
    setEmailTemplateId("");
    setEmailSubject("");
    setEmailBody("");
    setSmsTemplateId("");
    setSmsMessage("");
    setAttachedQuotationIds([]);
    setAttachSearch("");
    setAttachPanelOpen(false);
    setError(null);
  }, []);

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
    if (id === "") setWaMessage("");
    else
      setWaMessage(
        t(`convComposeTpl_${id}_wa` as Parameters<typeof t>[0], tplVars),
      );
  }

  function applyEmailTemplate(id: TemplateSelection) {
    setEmailTemplateId(id);
    if (id === "") {
      setEmailSubject("");
      setEmailBody("");
    } else {
      setEmailSubject(
        t(`convComposeTpl_${id}_emailSubject` as Parameters<typeof t>[0], tplVars),
      );
      setEmailBody(
        t(`convComposeTpl_${id}_emailBody` as Parameters<typeof t>[0], tplVars),
      );
    }
  }

  function applySmsTemplate(id: TemplateSelection) {
    setSmsTemplateId(id);
    if (id === "") setSmsMessage("");
    else
      setSmsMessage(
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

  async function handleSubmit() {
    if (!isAuthenticated || mode === "app_call") return;
    setError(null);
    const occurredAtMs = Date.parse(whenLocal);
    if (Number.isNaN(occurredAtMs)) {
      setError(t("convComposeErrorWhen"));
      return;
    }
    const occurredAt = new Date(occurredAtMs).toISOString();

    if (mode === "log_call") {
      const notes = callNotes.trim();
      if (!notes) {
        setError(t("convComposeErrorNotes"));
        return;
      }
      const item: LeadConversationItem = {
        id: newConversationId(lead.id),
        leadId: lead.id,
        channel: "call",
        callKind: "manual_log",
        occurredAt,
        direction: "internal",
        transcript: notes,
        preview: previewFromText(notes),
      };
      setSaving(true);
      try {
        await appendLeadConversation(lead.id, item);
        onAppended(item);
        onOpenChange(false);
      } catch (e) {
        console.error(e);
        setError(t("convComposeErrorGeneric"));
      } finally {
        setSaving(false);
      }
      return;
    }

    if (mode === "whatsapp") {
      const body = waMessage.trim();
      if (!body) {
        setError(t("convComposeErrorMessage"));
        return;
      }
      const item: LeadConversationItem = {
        id: newConversationId(lead.id),
        leadId: lead.id,
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
        await appendLeadConversation(lead.id, item);
        onAppended(item);
        onOpenChange(false);
      } catch (e) {
        console.error(e);
        setError(t("convComposeErrorGeneric"));
      } finally {
        setSaving(false);
      }
      return;
    }

    if (mode === "sms") {
      const phone = lead.patientPhone?.trim();
      if (!phone) {
        setError(t("convComposeErrorNoPatientPhone"));
        return;
      }
      const body = smsMessage.trim();
      if (!body) {
        setError(t("convComposeErrorMessage"));
        return;
      }
      const item: LeadConversationItem = {
        id: newConversationId(lead.id),
        leadId: lead.id,
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
        await appendLeadConversation(lead.id, item);
        onAppended(item);
        onOpenChange(false);
      } catch (e) {
        console.error(e);
        setError(t("convComposeErrorGeneric"));
      } finally {
        setSaving(false);
      }
      return;
    }

    const to = lead.patientEmail?.trim();
    if (!to) {
      setError(t("convComposeErrorNoPatientEmail"));
      return;
    }
    const subject = emailSubject.trim();
    const body = emailBody.trim();
    if (!subject || !body) {
      setError(t("convComposeErrorEmailFields"));
      return;
    }
    const item: LeadConversationItem = {
      id: newConversationId(lead.id),
      leadId: lead.id,
      channel: "email",
      occurredAt,
      direction: "outbound",
      subject,
      body,
      snippet: previewFromText(body),
      from: actorEmail,
      to,
      preview: previewWithQuotes(`${subject} — ${body}`, attachedQuotationIds.length),
      attachmentHint: buildOutboundAttachmentHint(
        emailTemplateId,
        attachedQuotationIds.length,
      ),
      attachedQuotationIds:
        attachedQuotationIds.length > 0 ? [...attachedQuotationIds] : undefined,
    };
    setSaving(true);
    try {
      await appendLeadConversation(lead.id, item);
      onAppended(item);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      setError(t("convComposeErrorGeneric"));
    } finally {
      setSaving(false);
    }
  }

  const modeButtons: {
    id: CommunicateMode;
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
              const tierLabel = t(
                `leadQuotation.tiers.${q.packageTier}` as Parameters<typeof t>[0],
              );
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
                    {tierLabel} · v{q.version}
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
                  const tierLabel = t(
                    `leadQuotation.tiers.${q.packageTier}` as Parameters<typeof t>[0],
                  );
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
                          {tierLabel} · v{q.version}
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
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
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
                    setError(null);
                  }}
                >
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  {t(labelKey)}
                </Button>
              );
            })}
          </div>

          {mode === "log_call" ? (
            <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4 ring-1 ring-black/5">
              <div className="space-y-2">
                <Label htmlFor="conv-when" className="amanak-app-field-label">
                  {t("convComposeWhenCall")}
                </Label>
                <Input
                  id="conv-when"
                  type="datetime-local"
                  value={whenLocal}
                  onChange={(e) => setWhenLocal(e.target.value)}
                  className="rounded-xl font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conv-call-notes" className="amanak-app-field-label">
                  {t("convComposeCallNotes")}
                </Label>
                <textarea
                  id="conv-call-notes"
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  rows={5}
                  placeholder={t("convComposeCallNotesPlaceholder")}
                  className="min-h-[120px] w-full resize-y rounded-xl border border-border bg-background p-3 text-sm font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>
            </div>
          ) : null}

          {mode === "app_call" ? (
            <div
              className="rounded-2xl border border-dashed border-border/80 bg-muted/15 px-6 py-12 text-center ring-1 ring-black/5"
              role="status"
            >
              <p className="text-sm font-semibold text-foreground">
                {t("convComposeAppCallComingSoonTitle")}
              </p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
                {t("convComposeAppCallComingSoonBody")}
              </p>
            </div>
          ) : null}

          {mode === "whatsapp" && (
            <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4 ring-1 ring-black/5">
              <div className="space-y-2">
                <Label htmlFor="conv-wa-when" className="amanak-app-field-label">
                  {t("convComposeWhenSent")}
                </Label>
                <Input
                  id="conv-wa-when"
                  type="datetime-local"
                  value={whenLocal}
                  onChange={(e) => setWhenLocal(e.target.value)}
                  className="rounded-xl font-medium"
                />
              </div>
              {renderTemplateSelect("conv-wa-template", waTemplateId, applyWhatsappTemplate)}
              {renderAttachQuotationsField("conv-wa-attach-search")}
              <div className="space-y-2">
                <Label htmlFor="conv-wa-msg" className="amanak-app-field-label">
                  {t("convComposeMessage")}
                </Label>
                <textarea
                  id="conv-wa-msg"
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  rows={5}
                  placeholder={t("convComposeMessagePlaceholder")}
                  className="min-h-[120px] w-full resize-y rounded-xl border border-border bg-background p-3 text-sm font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>
            </div>
          )}

          {mode === "email" && (
            <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4 ring-1 ring-black/5">
              <div className="space-y-2">
                <Label htmlFor="conv-email-when" className="amanak-app-field-label">
                  {t("convComposeWhenSent")}
                </Label>
                <Input
                  id="conv-email-when"
                  type="datetime-local"
                  value={whenLocal}
                  onChange={(e) => setWhenLocal(e.target.value)}
                  className="rounded-xl font-medium"
                />
              </div>
              {renderTemplateSelect("conv-email-template", emailTemplateId, applyEmailTemplate)}
              {renderAttachQuotationsField("conv-email-attach-search")}
              <div className="space-y-2">
                <Label htmlFor="conv-email-subj" className="amanak-app-field-label">
                  {t("convComposeEmailSubject")}
                </Label>
                <Input
                  id="conv-email-subj"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="rounded-xl font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conv-email-body" className="amanak-app-field-label">
                  {t("convComposeEmailBody")}
                </Label>
                <textarea
                  id="conv-email-body"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={6}
                  placeholder={t("convComposeEmailBodyPlaceholder")}
                  className="min-h-[140px] w-full resize-y rounded-xl border border-border bg-background p-3 text-sm font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {t("convComposeEmailRouting", {
                  from: actorEmail,
                  to: lead.patientEmail ?? t("fieldNotProvided"),
                })}
              </p>
            </div>
          )}

          {mode === "sms" && (
            <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4 ring-1 ring-black/5">
              <div className="space-y-2">
                <Label htmlFor="conv-sms-when" className="amanak-app-field-label">
                  {t("convComposeWhenSent")}
                </Label>
                <Input
                  id="conv-sms-when"
                  type="datetime-local"
                  value={whenLocal}
                  onChange={(e) => setWhenLocal(e.target.value)}
                  className="rounded-xl font-medium"
                />
              </div>
              {renderTemplateSelect("conv-sms-template", smsTemplateId, applySmsTemplate)}
              {renderAttachQuotationsField("conv-sms-attach-search")}
              <div className="space-y-2">
                <Label htmlFor="conv-sms-msg" className="amanak-app-field-label">
                  {t("convComposeMessage")}
                </Label>
                <textarea
                  id="conv-sms-msg"
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  rows={4}
                  placeholder={t("convComposeSmsPlaceholder")}
                  className="min-h-[100px] w-full resize-y rounded-xl border border-border bg-background p-3 text-sm font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {t("convComposeSmsRouting", {
                  phone: lead.patientPhone?.trim() || t("fieldNotProvided"),
                })}
              </p>
            </div>
          )}

          {error ? (
            <p className="text-xs font-semibold text-destructive" role="alert">
              {error}
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
              onClick={() => void handleSubmit()}
            >
              {saving ? t("convComposeSaving") : submitLabel}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
