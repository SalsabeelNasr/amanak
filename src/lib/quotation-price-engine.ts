import type { Lead, PackageTier, QuotationItem } from "@/types";
import { getTreatmentBySlugSync } from "@/lib/api/treatments";
import type { QuotationTransportProfile } from "@/lib/api/quotation-catalog";

export const DEFAULT_QUOTATION_TERMS =
  "الأسعار تقديرية وقابلة للتعديل بناءً على التشخيص النهائي للطبيب المختص.";

const TIER_MULT: Record<PackageTier, number> = {
  normal: 0.92,
  silver: 1,
  gold: 1.12,
  vip: 1.28,
};

const TIER_HOTEL_NIGHTS: Record<PackageTier, number> = {
  normal: 3,
  silver: 4,
  gold: 5,
  vip: 7,
};

const TIER_HOTEL_PER_NIGHT: Record<PackageTier, number> = {
  normal: 55,
  silver: 85,
  gold: 120,
  vip: 195,
};

export type BuildQuotationPriceInput = {
  treatmentSlug: string;
  packageTier: PackageTier;
  hospitalId?: string;
  hotelName?: string;
  clientType: Lead["clientType"];
  transport: QuotationTransportProfile;
};

export type BuildQuotationPriceResult = {
  items: QuotationItem[];
  totalUSD: number;
  downpaymentRequired: boolean;
  downpaymentUSD?: number;
  termsAndConditions: string;
  _meta?: {
    procedure: number;
    hospital: number;
    hotel: number;
    transport: number;
    coordination: number;
  };
};

function roundMoney(n: number): number {
  return Math.round(n);
}

export function defaultTreatmentBaseUsd(treatmentSlug: string): number {
  const t = getTreatmentBySlugSync(treatmentSlug);
  if (typeof t?.priceUSD === "number" && t.priceUSD > 0) return t.priceUSD;
  return 3200;
}

/**
 * Mock v1 price breakdown for CRM draft quotations.
 */
export function buildQuotationPricing(input: BuildQuotationPriceInput): BuildQuotationPriceResult {
  const mult = TIER_MULT[input.packageTier];
  const base = defaultTreatmentBaseUsd(input.treatmentSlug);
  const procedure = roundMoney(base * mult);

  const items: QuotationItem[] = [
    {
      label: { en: "Medical procedure (estimated)", ar: "الإجراء الطبي (تقديري)" },
      amountUSD: procedure,
    },
  ];

  const hospitalAmount = roundMoney(380 * mult);
  if (input.hospitalId) {
    items.push({
      label: { en: "Hospital stay & facility", ar: "إقامة المستشفى والمرافق" },
      amountUSD: hospitalAmount,
    });
  }

  const nights = TIER_HOTEL_NIGHTS[input.packageTier];
  const perNight = TIER_HOTEL_PER_NIGHT[input.packageTier];
  const hotelAmount = roundMoney(nights * perNight * (input.packageTier === "vip" ? 1.05 : 1));
  if (input.hotelName) {
    items.push({
      label: {
        en: `Hotel (${nights} nights, estimated)`,
        ar: `الفندق (${nights} ليالٍ، تقديري)`,
      },
      amountUSD: hotelAmount,
    });
  }

  const perRoute = 42 * (input.packageTier === "vip" ? 1.15 : 1);
  const transportAmount = roundMoney(input.transport.routeCount * perRoute);
  items.push({
    label: {
      en: `Transportation (${input.transport.routeCount} routes)`,
      ar: `النقل والمواصلات (${input.transport.routeCount} مساراً)`,
    },
    amountUSD: transportAmount,
  });

  const coordinationAmount = roundMoney(220 * mult);
  items.push({
    label: { en: "Care coordination & follow-up", ar: "تنسيق الرعاية والمتابعة" },
    amountUSD: coordinationAmount,
  });

  const totalUSD = items.reduce((s, i) => s + i.amountUSD, 0);

  const downpaymentRequired = input.clientType === "b2c";
  const downpaymentUSD = downpaymentRequired
    ? roundMoney(Math.min(Math.max(totalUSD * 0.22, 400), totalUSD * 0.5))
    : undefined;

  return {
    items,
    totalUSD,
    downpaymentRequired,
    downpaymentUSD,
    termsAndConditions: DEFAULT_QUOTATION_TERMS,
    _meta: {
      procedure,
      hospital: hospitalAmount,
      hotel: hotelAmount,
      transport: transportAmount,
      coordination: coordinationAmount,
    },
  };
}
