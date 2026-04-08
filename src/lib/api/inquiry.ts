import type { InquiryPayload } from "@/types";
import { applyMockDelay } from "./mock-delay";

/** Mock submit — replace with `fetch` when API exists. */
export async function submitInquiry(
  data: InquiryPayload,
  options?: { simulateDelay?: boolean },
): Promise<{ ok: true; id: string }> {
  await applyMockDelay(options?.simulateDelay, 600);
  if (process.env.NEXT_PUBLIC_USE_MOCK_API !== "true") {
    console.warn("submitInquiry: API not wired; set NEXT_PUBLIC_USE_MOCK_API=true");
  }
  return { ok: true, id: `inq_${Date.now()}` };
}
