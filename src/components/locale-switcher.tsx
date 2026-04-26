"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Manual locale toggle only — persists via `NEXT_LOCALE` (next-intl middleware cookie). */
export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const targetLocale = locale === "ar" ? "en" : "ar";

  return (
    <Link
      href={pathname}
      locale={targetLocale}
      prefetch={false}
      className={cn(
        "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      {locale === "ar" ? "English" : "العربية"}
    </Link>
  );
}
