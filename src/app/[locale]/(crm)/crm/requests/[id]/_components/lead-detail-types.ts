import type { LeadConversationChannel, Quotation } from "@/types";

export type LeadDetailTabId =
  | "overview"
  | "conversations"
  | "quotes"
  | "files"
  | "appointments"
  | "tasks";

export const LEAD_DETAIL_TAB_IDS: LeadDetailTabId[] = [
  "overview",
  "conversations",
  "quotes",
  "files",
  "appointments",
  "tasks",
];

export type LeadConversationFilter = "all" | LeadConversationChannel;

export type LeadTasksSubtabFilter = "all" | "active" | "completed";

/** Quotes tab: filter by workflow status, or only the lead's active quotation. */
export type LeadQuotationsTabFilter =
  | "all"
  | "active"
  | Quotation["status"];

export const CONVERSATION_BODY_COLLAPSE_CHARS = 280;
