import type { LeadConversationChannel } from "@/types";

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

export const CONVERSATION_BODY_COLLAPSE_CHARS = 280;
