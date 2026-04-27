/** Locale-aware date/time strings (no React; safe for server components). */

export function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(
    locale === "ar" ? "ar-EG" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );
}

export function formatDateTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDueDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(
    locale === "ar" ? "ar-EG" : "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
}

export function formatTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Month + day only (e.g. CRM “today” task row). */
export function formatMonthDay(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(
    locale === "ar" ? "ar-EG" : "en-US",
    {
      month: "short",
      day: "numeric",
    },
  );
}
