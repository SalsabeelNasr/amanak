import { describe, expect, it, afterEach } from "vitest";
import { resetCrmSettingsForTests, updateCrmSettings } from "@/lib/api/crm-settings";
import { getQuotationTransportProfile } from "@/lib/api/quotation-catalog";
import {
  buildPatientEstimateRange,
  buildQuotationPricing,
  computeQuotationAccommodationLineUsd,
  defaultTreatmentBaseUsd,
} from "./quotation-price-engine";

const SAMPLE_GROUND = {
  id: "gnd_standard",
  label: { en: "Standard private car", ar: "سيارة خاصة قياسية" },
  usdPerRoute: 38,
} as const;

afterEach(() => {
  resetCrmSettingsForTests();
});

describe("defaultTreatmentBaseUsd", () => {
  it("uses treatment priceUSD when set", () => {
    expect(defaultTreatmentBaseUsd("joint-replacement")).toBe(600);
  });

  it("falls back when slug unknown or no price", () => {
    expect(defaultTreatmentBaseUsd("unknown-slug-xyz")).toBe(3200);
  });
});

describe("computeQuotationAccommodationLineUsd", () => {
  it("adds surcharge for guests beyond included occupancy", () => {
    const base = computeQuotationAccommodationLineUsd({
      pricePerNightUSD: 90,
      nights: 5,
      guests: 4,
      includedGuests: 2,
      guestSurchargePerNightUSD: 18,
    });
    expect(base).toBe(90 * 5 + 2 * 5 * 18);
  });
});

describe("buildQuotationPricing", () => {
  const transport = {
    modeLabel: { en: "Limousine", ar: "ليموزين" },
    routeCount: getQuotationTransportProfile("joint-replacement").routeCount,
  };

  it("includes procedure, transport, coordination for minimal B2C input", () => {
    const r = buildQuotationPricing({
      treatmentSlug: "joint-replacement",
      packageTier: "gold",
      clientType: "b2c",
      transport,
      groundTransport: SAMPLE_GROUND,
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
      hotel: {
        id: "hotel_alex_sil",
        name: "Hilton Alexandria Green Plaza",
        pricePerNightUSD: 90,
        nights: 6,
        guests: 2,
        kind: "hotel",
      },
      groundTransport: SAMPLE_GROUND,
      clientType: "b2c",
      transport: { ...transport, routeCount: getQuotationTransportProfile("ivf").routeCount },
    });
    const labels = withBoth.items.map((i) => i.label.en).join(" ");
    expect(labels).toMatch(/Hospital/);
    expect(labels).toMatch(/Accommodation/);
  });

  it("does not require downpayment for B2B", () => {
    const r = buildQuotationPricing({
      treatmentSlug: "joint-replacement",
      packageTier: "normal",
      clientType: "b2b",
      transport,
      groundTransport: SAMPLE_GROUND,
    });
    expect(r.downpaymentRequired).toBe(false);
    expect(r.downpaymentUSD).toBeUndefined();
  });

  it("disables B2C down payment when CRM downpaymentPercentB2c is 0", async () => {
    await updateCrmSettings({ quotationRules: { downpaymentPercentB2c: 0 } });
    const r = buildQuotationPricing({
      treatmentSlug: "joint-replacement",
      packageTier: "gold",
      clientType: "b2c",
      transport,
      groundTransport: SAMPLE_GROUND,
    });
    expect(r.downpaymentRequired).toBe(false);
    expect(r.downpaymentUSD).toBeUndefined();
  });

  it("uses quotationRules.downpaymentPercentB2c for B2C amount", async () => {
    await updateCrmSettings({ quotationRules: { downpaymentPercentB2c: 40 } });
    const r = buildQuotationPricing({
      treatmentSlug: "joint-replacement",
      packageTier: "gold",
      clientType: "b2c",
      transport,
      groundTransport: SAMPLE_GROUND,
    });
    expect(r.downpaymentRequired).toBe(true);
    const total = r.totalUSD;
    const expected = Math.round(
      Math.min(Math.max((total * 40) / 100, 400), total * 0.5),
    );
    expect(r.downpaymentUSD).toBe(expected);
  });

  it("omits ground transport line when includeGroundTransport is false", () => {
    const r = buildQuotationPricing({
      treatmentSlug: "joint-replacement",
      packageTier: "gold",
      clientType: "b2c",
      transport,
      includeGroundTransport: false,
      groundTransport: SAMPLE_GROUND,
    });
    expect(r.items.every((i) => !String(i.label.en).includes("Ground transport"))).toBe(true);
    expect(r._meta?.transport).toBe(0);
  });

  it("uses exact totals from flight SKU and route count × ground rate", () => {
    const t = getQuotationTransportProfile("oncology");
    const r = buildQuotationPricing({
      treatmentSlug: "oncology",
      packageTier: "normal",
      clientType: "b2c",
      transport: t,
      flight: {
        id: "flt_med_economy",
        label: { en: "Flight", ar: "طيران" },
        priceUSD: 520,
      },
      groundTransport: { ...SAMPLE_GROUND, usdPerRoute: 40 },
    });
    const flightLine = r.items.find((i) => i.label.en.includes("Flights"));
    expect(flightLine?.amountUSD).toBe(520);
    expect(r._meta?.transport).toBe(Math.round(t.routeCount * 40));
  });
});

describe("CRM / patient trip parity", () => {
  it("exposes CRM transport routeCount from CRM settings trip assumptions", () => {
    expect(getQuotationTransportProfile("joint-replacement").routeCount).toBe(8);
    expect(getQuotationTransportProfile("unknown-treatment-slug").routeCount).toBe(6);
  });
});

describe("buildPatientEstimateRange", () => {
  it("computes a non-empty range with all factors included", () => {
    const result = buildPatientEstimateRange({
      treatmentSlug: "joint-replacement",
      countryBand: "medium_haul",
      areaZone: "metro",
      timing: "one_month",
      travelerCount: 2,
      includeFlights: true,
      includeAccommodation: true,
      includeTransport: true,
      doctorSelected: true,
      hospitalSelected: true,
    });
    expect(result.totalMinUSD).toBeGreaterThan(0);
    expect(result.totalMaxUSD).toBeGreaterThan(result.totalMinUSD);
  });

  it("allows excluding optional logistics factors", () => {
    const result = buildPatientEstimateRange({
      treatmentSlug: "ivf",
      countryBand: "regional",
      areaZone: "coastal",
      timing: "three_months",
      travelerCount: 1,
      includeFlights: false,
      includeAccommodation: false,
      includeTransport: false,
      doctorSelected: false,
      hospitalSelected: true,
    });
    const optionalLines = result.lines.filter((line) => line.key !== "treatment");
    expect(optionalLines.every((line) => line.minUSD === 0 && line.maxUSD === 0)).toBe(true);
    expect(result.totalMinUSD).toBeGreaterThan(0);
  });
});
