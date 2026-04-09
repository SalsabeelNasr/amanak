import { describe, expect, it } from "vitest";
import { buildQuotationPricing, defaultTreatmentBaseUsd } from "./quotation-price-engine";

describe("defaultTreatmentBaseUsd", () => {
  it("uses treatment priceUSD when set", () => {
    expect(defaultTreatmentBaseUsd("joint-replacement")).toBe(4600);
  });

  it("falls back when slug unknown or no price", () => {
    expect(defaultTreatmentBaseUsd("unknown-slug-xyz")).toBe(3200);
  });
});

describe("buildQuotationPricing", () => {
  const transport = {
    modeLabel: { en: "Limousine", ar: "ليموزين" },
    routeCount: 4,
  };

  it("includes procedure, transport, coordination for minimal B2C input", () => {
    const r = buildQuotationPricing({
      treatmentSlug: "joint-replacement",
      packageTier: "gold",
      clientType: "b2c",
      transport,
    });
    expect(r.items.length).toBeGreaterThanOrEqual(3);
    expect(r.totalUSD).toBe(r.items.reduce((s, i) => s + i.amountUSD, 0));
    expect(r.downpaymentRequired).toBe(true);
    expect(r.downpaymentUSD).toBeDefined();
    expect(r.downpaymentUSD!).toBeGreaterThan(0);
    expect(r.downpaymentUSD!).toBeLessThanOrEqual(r.totalUSD);
  });

  it("adds hospital and hotel lines when provided", () => {
    const withBoth = buildQuotationPricing({
      treatmentSlug: "ivf",
      packageTier: "silver",
      hospitalId: "hospital_alex_1",
      hotelName: "Hilton",
      clientType: "b2c",
      transport,
    });
    const labels = withBoth.items.map((i) => i.label.en).join(" ");
    expect(labels).toMatch(/Hospital/);
    expect(labels).toMatch(/Hotel/);
  });

  it("does not require downpayment for B2B", () => {
    const r = buildQuotationPricing({
      treatmentSlug: "joint-replacement",
      packageTier: "normal",
      clientType: "b2b",
      transport,
    });
    expect(r.downpaymentRequired).toBe(false);
    expect(r.downpaymentUSD).toBeUndefined();
  });
});
