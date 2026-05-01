"use client";

import { useTranslations } from "next-intl";
import { InfiniteCardList } from "@/components/crm/infinite-card-list";
import type { Lead, LeadConversationItem, Quotation } from "@/types";
import { LeadConversationItemView } from "../lead-conversation-item";
import type { LeadConversationFilter } from "../lead-detail-types";

type LeadConversationsTabProps = {
  lead: Lead;
  items: LeadConversationItem[];
  conversationFilter: LeadConversationFilter;
  expandedConversationIds: Set<string>;
  onToggleExpanded: (id: string) => void;
  onViewQuotation: (q: Quotation) => void;
};

export function LeadConversationsTab({
  lead,
  items,
  conversationFilter,
  expandedConversationIds,
  onToggleExpanded,
  onViewQuotation,
}: LeadConversationsTabProps) {
  const t = useTranslations("crm");

  return (
    <InfiniteCardList
      key={String(conversationFilter)}
      items={items}
      getItemKey={(item) => item.id}
      initialVisible={8}
      pageSize={8}
      empty={
        <p className="py-12 text-center text-xs font-medium text-muted-foreground">
          {conversationFilter === "all"
            ? t("convEmptyAll")
            : t("convEmptyChannel", {
                channel: t(
                  conversationFilter === "whatsapp"
                    ? "convChannelWhatsapp"
                    : conversationFilter === "email"
                      ? "convChannelEmail"
                      : conversationFilter === "sms"
                        ? "convChannelSms"
                        : "convChannelCall",
                ),
              })}
        </p>
      }
      renderItem={(item) => (
        <LeadConversationItemView
          item={item}
          lead={lead}
          isExpanded={expandedConversationIds.has(item.id)}
          onToggleExpand={() => onToggleExpanded(item.id)}
          onViewQuotation={onViewQuotation}
        />
      )}
    />
  );
}
