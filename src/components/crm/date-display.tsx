"use client";

import type { ReactNode } from "react";
import { useLocale } from "next-intl";
import {
  formatDate,
  formatDateTime,
  formatDueDate,
  formatTime,
} from "./date-format";

export { formatDate, formatDateTime, formatDueDate, formatTime } from "./date-format";

type DateTimeFormat = "date" | "datetime" | "due" | "time";

type DateTimeProps = {
  iso: string;
  format: DateTimeFormat;
  /** When set, avoids reading the active locale from context. */
  locale?: string;
  className?: string;
};

export function DateTime({ iso, format: fmt, locale: localeProp, className }: DateTimeProps): ReactNode {
  const ctxLocale = useLocale();
  const locale = localeProp ?? ctxLocale;
  let text: string;
  switch (fmt) {
    case "date":
      text = formatDate(iso, locale);
      break;
    case "datetime":
      text = formatDateTime(iso, locale);
      break;
    case "due":
      text = formatDueDate(iso, locale);
      break;
    case "time":
      text = formatTime(iso, locale);
      break;
  }
  return <span className={className}>{text}</span>;
}
