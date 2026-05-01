import { describe, expect, it } from "vitest";
import { bucketPackageItemAmounts } from "./patient-quotation-package-parts";

describe("bucketPackageItemAmounts", () => {
  it("maps PATIENT_1 mock line items into expected buckets", () => {
    const items = [
      { label: { ar: "الإجراء الطبي", en: "Medical Procedure" }, amountUSD: 4200 },
      { label: { ar: "إقامة المستشفى", en: "Hospital Stay" }, amountUSD: 900 },
      { label: { ar: "الفندق (5 ليالٍ)", en: "Hotel (5 nights)" }, amountUSD: 650 },
      { label: { ar: "النقل والمواصلات", en: "Transportation" }, amountUSD: 250 },
      { label: { ar: "متابعة ما بعد العلاج", en: "Post-treatment care" }, amountUSD: 300 },
    ];
    const b = bucketPackageItemAmounts(items);
    expect(b.procedureUsd).toBe(4200);
    expect(b.facilityUsd).toBe(900);
    expect(b.accommodationUsd).toBe(650);
    expect(b.groundUsd).toBe(250);
    expect(b.flightCoordUsd).toBe(300);
    expect(b.unmatchedUsd).toBe(0);
  });

  it("maps accepted mock line items (English)", () => {
    const items = [
      { label: { ar: "x", en: "Medical procedure" }, amountUSD: 100 },
      { label: { ar: "x", en: "Hospital stay & facility" }, amountUSD: 40 },
      { label: { ar: "x", en: "Accommodation (package)" }, amountUSD: 30 },
      { label: { ar: "x", en: "Ground transportation" }, amountUSD: 20 },
      { label: { ar: "x", en: "Flights & coordination" }, amountUSD: 10 },
    ];
    const b = bucketPackageItemAmounts(items);
    expect(b.procedureUsd).toBe(100);
    expect(b.facilityUsd).toBe(40);
    expect(b.accommodationUsd).toBe(30);
    expect(b.groundUsd).toBe(20);
    expect(b.flightCoordUsd).toBe(10);
    expect(b.unmatchedUsd).toBe(0);
  });
});
