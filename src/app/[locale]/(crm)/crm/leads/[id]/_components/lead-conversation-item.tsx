"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/components/crm/date-format";
import type { Lead, LeadConversationItem, Quotation } from "@/types";
import {
  CONVERSATION_BODY_COLLAPSE_CHARS,
} from "./lead-detail-types";
import { getConversationBodyText } from "./lead-conversation-utils";
import { Mail, MessageSquare, Phone, Smartphone } from "lucide-react";

type LeadConversationItemProps = {
  item: LeadConversationItem;
  lead: Lead;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onViewQuotation: (q: Quotation) => void;
};

export function LeadConversationItemView({
  item,
  lead,
  isExpanded,
  onToggleExpand,
  onViewQuotation,
}: LeadConversationItemProps) {
  const t = useTranslations("crm");
  const locale = useLocale();

  const body = getConversationBodyText(item);
  const needsCollapse = body.length > CONVERSATION_BODY_COLLAPSE_CHARS;
  const shownBody =
    needsCollapse && !isExpanded
      ? `${body.slice(0, CONVERSATION_BODY_COLLAPSE_CHARS).trim()}…`
      : body;

  const directionLabel =
    item.direction === "inbound"
      ? t("convDirectionInbound")
      : item.direction === "outbound"
        ? t("convDirectionOutbound")
        : t("convDirectionInternal");

  const title =
    item.channel === "email"
      ? item.subject
      : item.channel === "whatsapp"
        ? t("convTitleWhatsapp")
        : item.channel === "sms"
          ? t("convTitleSms")
          : t("convTitleCall");

  const ChannelIcon =
    item.channel === "email"
      ? Mail
      : item.channel === "whatsapp"
        ? MessageSquare
        : item.channel === "sms"
          ? Smartphone
          : Phone;

  const channelLabel =
    item.channel === "whatsapp"
      ? t("convChannelWhatsapp")
      : item.channel === "email"
        ? t("convChannelEmail")
        : item.channel === "sms"
          ? t("convChannelSms")
          : t("convChannelCall");

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm ring-1 ring-black/5 transition-all hover:bg-muted/5">
      <div className="flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background ring-1 ring-border/60">
          <ChannelIcon className="size-4 text-primary" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="border-primary/10 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {channelLabel}
            </Badge>
            <Badge
              variant="outline"
              className="border-border/60 px-2.5 py-0.5 amanak-app-field-label"
            >
              {directionLabel}
            </Badge>
            <span className="text-xs text-muted-foreground/50">
              {formatDateTime(item.occurredAt, locale)}
            </span>
          </div>
          <p className="text-sm font-bold text-foreground">{title}</p>
          {item.channel === "email" ? (
            <div className="space-y-1 text-[11px] font-medium text-muted-foreground">
              <p>
                <span className="font-medium text-foreground/60">
                  {t("convEmailFrom")}:{" "}
                </span>
                {item.from}
              </p>
              <p>
                <span className="font-medium text-foreground/60">
                  {t("convEmailTo")}:{" "}
                </span>
                {item.to}
              </p>
            </div>
          ) : null}
          {item.channel === "sms" && item.toPhone ? (
            <p className="text-[11px] font-medium text-muted-foreground">
              <span className="font-medium text-foreground/60">
                {t("convSmsToLabel")}:{" "}
              </span>
              {item.toPhone}
            </p>
          ) : null}
          {item.channel === "call" && item.durationSec != null ? (
            <p className="amanak-app-meta">
              {t("convCallDuration", {
                minutes: Math.max(1, Math.round(item.durationSec / 60)),
              })}
            </p>
          ) : null}
          {(item.channel === "whatsapp" || item.channel === "sms" || item.channel === "email") &&
          item.attachmentHint ? (
            <p className="text-xs font-medium text-primary/70">
              {item.attachmentHint}
            </p>
          ) : null}
          {"attachedQuotationIds" in item && item.attachedQuotationIds && item.attachedQuotationIds.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("convAttachedQuotationsLabel")}
              </p>
              <div className="flex flex-wrap gap-2">
                {item.attachedQuotationIds.map((qid) => {
                  const q = lead.quotations.find((x) => x.id === qid);
                  return q ? (
                    <Button
                      key={qid}
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 rounded-lg px-3 text-xs font-semibold"
                      onClick={() => onViewQuotation(q)}
                    >
                      {t(
                        `leadQuotation.tiers.${q.packageTier}` as Parameters<
                          typeof t
                        >[0],
                      )}{" "}
                      · v{q.version}
                    </Button>
                  ) : (
                    <span
                      key={qid}
                      className="inline-flex items-center rounded-lg border border-dashed border-border px-2 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {t("convUnknownQuotation")}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : null}
          {body ? (
            <div className="rounded-xl border border-border/40 bg-muted/30 p-4 text-[13px] font-medium leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {shownBody}
            </div>
          ) : null}
          {needsCollapse ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-sm font-medium text-primary hover:bg-primary/5"
              onClick={onToggleExpand}
            >
              {isExpanded ? t("convShowLess") : t("convShowMore")}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
