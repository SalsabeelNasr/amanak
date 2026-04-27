import type { LeadConversationItem } from "@/types";

export function getConversationBodyText(item: LeadConversationItem): string {
  switch (item.channel) {
    case "whatsapp":
    case "sms":
      return item.body;
    case "email":
      return item.body ?? item.snippet ?? "";
    case "call":
      return item.transcript;
  }
}
