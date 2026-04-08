"use server";

import { submitInquiry } from "@/lib/api/inquiry";
import type { InquiryPayload } from "@/types";

export async function submitInquiryAction(data: InquiryPayload) {
  return submitInquiry(data, { simulateDelay: true });
}
