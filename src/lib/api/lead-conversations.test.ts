import { describe, expect, it } from "vitest";
import {
  appendLeadConversation,
  getLeadConversations,
} from "./lead-conversations";
import type { LeadConversationItem } from "@/types";

describe("appendLeadConversation", () => {
  it("prepends a new item and getLeadConversations returns it first", async () => {
    const item: LeadConversationItem = {
      id: "conv_test_new",
      leadId: "lead_2",
      channel: "whatsapp",
      occurredAt: new Date().toISOString(),
      direction: "outbound",
      body: "Test outbound message",
      preview: "Test outbound message",
    };
    await appendLeadConversation("lead_2", item, { simulateDelay: false });
    const list = await getLeadConversations("lead_2", { simulateDelay: false });
    expect(list[0]?.id).toBe("conv_test_new");
    expect(list[0]?.channel).toBe("whatsapp");
  });

  it("persists attachedQuotationIds on outbound email", async () => {
    const item: LeadConversationItem = {
      id: "conv_test_email_quotes",
      leadId: "lead_2",
      channel: "email",
      occurredAt: new Date().toISOString(),
      direction: "outbound",
      subject: "Quote",
      body: "See attached references",
      from: "cs@example.com",
      to: "p@example.com",
      preview: "Quote",
      attachedQuotationIds: ["quote_1", "quote_2"],
    };
    await appendLeadConversation("lead_2", item, { simulateDelay: false });
    const list = await getLeadConversations("lead_2", { simulateDelay: false });
    const found = list.find((i) => i.id === "conv_test_email_quotes");
    expect(found?.channel).toBe("email");
    if (found?.channel === "email") {
      expect(found.attachedQuotationIds).toEqual(["quote_1", "quote_2"]);
    }
  });
});
