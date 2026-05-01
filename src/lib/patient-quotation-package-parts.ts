import type { Quotation } from "@/types";

function matchesItemLabel(item: Quotation["items"][number], patterns: RegExp[]): boolean {
  const { en, ar } = item.label;
  return patterns.some((re) => re.test(en) || re.test(ar));
}

/**
 * Splits {@link Quotation.items} into coarse UI buckets (physician+procedure vs hospital, stay,
 * ground transport, flights/coordination, other). Matching is label-based for mock CRM data.
 */
export function bucketPackageItemAmounts(items: Quotation["items"]): {
  procedureUsd: number;
  facilityUsd: number;
  accommodationUsd: number;
  groundUsd: number;
  flightCoordUsd: number;
  unmatchedUsd: number;
} {
  const out = {
    procedureUsd: 0,
    facilityUsd: 0,
    accommodationUsd: 0,
    groundUsd: 0,
    flightCoordUsd: 0,
    unmatchedUsd: 0,
  };
  for (const item of items) {
    if (matchesItemLabel(item, [/medical procedure/i, /الإجراء الطبي/i])) {
      out.procedureUsd += item.amountUSD;
    } else if (matchesItemLabel(item, [/hospital stay|facility/i, /إقامة المستشفى|المرافق/i])) {
      out.facilityUsd += item.amountUSD;
    } else if (matchesItemLabel(item, [/accommodation|\(?package\)?/i, /الإقامة|^الفندق/i])) {
      out.accommodationUsd += item.amountUSD;
    } else if (
      matchesItemLabel(item, [/ground transportation/i, /النقل الأرضي/i]) ||
      matchesItemLabel(item, [/^transportation$/i, /^النقل والمواصلات$/i])
    ) {
      out.groundUsd += item.amountUSD;
    } else if (
      matchesItemLabel(item, [/flights|coordination|post-treatment/i, /الطيران|التنسيق|متابعة/i])
    ) {
      out.flightCoordUsd += item.amountUSD;
    } else {
      out.unmatchedUsd += item.amountUSD;
    }
  }
  return out;
}
