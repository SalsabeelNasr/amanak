"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

/** Manual locale toggle only — persists via `NEXT_LOCALE` (next-intl middleware cookie). */
export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const targetLocale = locale === "ar" ? "en" : "ar";

  return (
    <Link
      href={pathname}
      locale={targetLocale}
      prefetch={false}
      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {locale === "ar" ? "English" : "العربية"}
    </Link>
  );
}
