import type {
  RequestConversationChannel,
  RequestConversationItem,
} from "@/types";
import { applyMockDelay } from "./mock-delay";

function nowMinusHours(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function nowMinusDays(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/** Mock timeline keyed by requestId — replace with HTTP client later. */
const BY_REQUEST = new Map<string, RequestConversationItem[]>([
  [
    "lead_1",
    [
      {
        id: "conv_lead1_wa_1",
        requestId: "lead_1",
        channel: "whatsapp",
        occurredAt: nowMinusHours(2),
        direction: "inbound",
        body: "السلام عليكم، أود تأكيد موعد الاستشارة ومعرفة المستندات المطلوبة قبل السفر.",
        preview: "السلام عليكم، أود تأكيد موعد الاستشارة...",
        messageId: "wamid_mock_001",
      },
      {
        id: "conv_lead1_wa_2",
        requestId: "lead_1",
        channel: "whatsapp",
        occurredAt: nowMinusHours(1),
        direction: "outbound",
        body: "وعليكم السلام أحمد، شكراً لتواصلك. أرسلنا لك قائمة المستندات على البريد. هل وصلتك؟",
        preview: "وعليكم السلام أحمد، شكراً لتواصلك...",
        messageId: "wamid_mock_002",
      },
      {
        id: "conv_lead1_email_1",
        requestId: "lead_1",
        channel: "email",
        occurredAt: nowMinusDays(1),
        direction: "outbound",
        subject: "Amanak — documents checklist for your trip",
        snippet: "Please find the checklist attached. Reply if anything is unclear.",
        body: `Hello Ahmed,

Please find the document checklist for your medical travel journey. We will need:
- Medical report (translated if applicable)
- Recent imaging (X-ray / MRI reports)

Reply to this email if you have questions.

Best,
Sara — Amanak CS`,
        from: "sara@amanak.example",
        to: "ahmed.m@example.com",
        threadId: "thread_lead_1_docs",
      },
      {
        id: "conv_lead1_email_2",
        requestId: "lead_1",
        channel: "email",
        occurredAt: nowMinusHours(20),
        direction: "inbound",
        subject: "Re: Amanak — documents checklist for your trip",
        snippet: "Thank you. I uploaded the MRI to the portal. Please confirm receipt.",
        body: `Thank you Sara,

I have uploaded the MRI to the portal. Can you confirm you received it?

Ahmed`,
        from: "ahmed.m@example.com",
        to: "sara@amanak.example",
        threadId: "thread_lead_1_docs",
      },
      {
        id: "conv_lead1_call_1",
        requestId: "lead_1",
        channel: "call",
        callKind: "app_placed",
        occurredAt: nowMinusDays(3),
        direction: "outbound",
        durationSec: 842,
        provider: "mock_pbx",
        transcript: `[CS] Hello Ahmed, this is Sara from Amanak. Do you have a few minutes?
[Patient] Yes, go ahead.
[CS] Great. I wanted to walk through the quotation and next steps for hospital coordination.
[Patient] The package looks good. I need clarity on the down payment timing.
[CS] We require the down payment before we lock the hospital slot. I can send a secure payment link.
[Patient] Please send it. I will complete it tomorrow.
[CS] Perfect. I'll follow up on WhatsApp with the link and timeline.`,
        preview: "Call — quotation and down payment (14 min)",
      },
    ],
  ],
  [
    "lead_2",
    [
      {
        id: "conv_lead2_call_1",
        requestId: "lead_2",
        channel: "call",
        occurredAt: nowMinusDays(5),
        direction: "inbound",
        durationSec: 120,
        transcript: "[Patient] Quick question about visa support for my companion.",
        preview: "Call — visa question (2 min)",
      },
    ],
  ],
]);

export type GetRequestConversationsOptions = {
  simulateDelay?: boolean;
  channel?: RequestConversationChannel;
};

export async function getRequestConversations(
  requestId: string,
  options?: GetRequestConversationsOptions,
): Promise<RequestConversationItem[]> {
  await applyMockDelay(options?.simulateDelay);
  let items = BY_REQUEST.get(requestId) ?? [];
  if (options?.channel) {
    items = items.filter((i) => i.channel === options.channel);
  }
  return [...items].sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
}

export type AppendRequestConversationOptions = {
  simulateDelay?: boolean;
};

/**
 * Appends a conversation item to the mock store (newest-first ordering on read).
 */
export async function appendRequestConversation(
  requestId: string,
  item: RequestConversationItem,
  options?: AppendRequestConversationOptions,
): Promise<RequestConversationItem> {
  await applyMockDelay(options?.simulateDelay);
  const cur = BY_REQUEST.get(requestId) ?? [];
  BY_REQUEST.set(requestId, [item, ...cur]);
  return item;
}
