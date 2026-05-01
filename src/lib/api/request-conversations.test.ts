import { describe, expect, it } from "vitest";
import { appendRequestConversation, getRequestConversations } from "./request-conversations";

describe("request-conversations", () => {
  it("appends a conversation item to a request timeline", async () => {
    const before = await getRequestConversations("lead_2");
    const item = {
      id: "conv_test_append",
      requestId: "lead_2",
      channel: "whatsapp" as const,
      occurredAt: new Date().toISOString(),
      direction: "inbound" as const,
      body: "hello",
      preview: "hello",
      messageId: "wamid_test",
    };
    await appendRequestConversation("lead_2", item, {});
    const after = await getRequestConversations("lead_2");
    expect(after.length).toBe(before.length + 1);
    expect(after.some((i) => i.id === "conv_test_append")).toBe(true);
  });
});
