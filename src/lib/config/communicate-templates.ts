/**
 * Shared CRM “communicate” templates for WhatsApp, email, and SMS.
 * Copy lives in messages (crm.convComposeTpl_*).
 */
export const MESSAGE_TEMPLATE_IDS = [
  "docs_checklist",
  "appointment_reminder",
  "payment_followup",
] as const;

export type MessageTemplateId = (typeof MESSAGE_TEMPLATE_IDS)[number];
