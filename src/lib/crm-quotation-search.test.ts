import { describe, expect, it } from "vitest";
import { filterQuotationsByQuery } from "./crm-quotation-search";
import type { Quotation } from "@/types";

const q1: Quotation = {
  id: "quote_a",
  leadId: "lead_1",
  packageTier: "gold",
  items: [{ label: { ar: "جراحة", en: "Surgery" }, amountUSD: 1000 }],
  totalUSD: 5000,
  status: "draft",
  downpaymentRequired: false,
  termsAndConditions: "T",
  createdAt: new Date().toISOString(),
  version: 2,
};

const q2: Quotation = {
  id: "quote_b",
  leadId: "lead_1",
  packageTier: "silver",
  items: [{ label: { ar: "فندق", en: "Hotel" }, amountUSD: 200 }],
  totalUSD: 3200,
  status: "sent_to_patient",
  downpaymentRequired: true,
  downpaymentUSD: 500,
  termsAndConditions: "T2",
  createdAt: new Date().toISOString(),
  version: 1,
};

describe("filterQuotationsByQuery", () => {
  it("returns all non-excluded when query empty", () => {
    expect(filterQuotationsByQuery([q1, q2], "", "en")).toHaveLength(2);
    expect(filterQuotationsByQuery([q1, q2], "   ", "en")).toHaveLength(2);
  });

  it("filters by id substring", () => {
    const r = filterQuotationsByQuery([q1, q2], "quote_b", "en");
    expect(r).toEqual([q2]);
  });

  it("filters by tier and status", () => {
    expect(filterQuotationsByQuery([q1, q2], "gold", "en")).toEqual([q1]);
    expect(filterQuotationsByQuery([q1, q2], "sent", "en")).toEqual([q2]);
  });

  it("respects excludeIds", () => {
    const r = filterQuotationsByQuery([q1, q2], "", "en", new Set(["quote_a"]));
    expect(r).toEqual([q2]);
  });

  it("matches item label in selected locale", () => {
    expect(filterQuotationsByQuery([q1, q2], "Surgery", "en")).toEqual([q1]);
    expect(filterQuotationsByQuery([q1, q2], "جراحة", "ar")).toEqual([q1]);
  });
});
