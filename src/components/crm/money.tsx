import { cn } from "@/lib/utils";

/**
 * USD amounts for CRM quotations (prototype uses integer dollars).
 */
export function formatUSD(n: number, locale: string = "en-US"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

type MoneyProps = {
  amountUSD: number;
  locale: string;
  className?: string;
};

export function Money({ amountUSD, locale, className }: MoneyProps) {
  return (
    <span className={cn("tabular-nums", className)}>{formatUSD(amountUSD, locale)}</span>
  );
}
