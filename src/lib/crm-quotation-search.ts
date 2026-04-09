import type { Quotation } from "@/types";

function quotationSearchBlob(q: Quotation, langKey: "ar" | "en"): string {
  return [
    q.id,
    q.packageTier,
    q.status,
    String(q.version),
    String(q.totalUSD),
    ...q.items.map((i) => i.label[langKey]),
  ]
    .join(" ")
    .toLowerCase();
}

/** Filter quotations for CRM attach/search; optional `excludeIds` omits already-selected rows. */
export function filterQuotationsByQuery(
  quotations: readonly Quotation[],
  query: string,
  langKey: "ar" | "en",
  excludeIds?: ReadonlySet<string>,
): Quotation[] {
  const pool = quotations.filter((x) => !excludeIds?.has(x.id));
  const q = query.trim().toLowerCase();
  if (!q) return [...pool];
  return pool.filter((quot) => quotationSearchBlob(quot, langKey).includes(q));
}
