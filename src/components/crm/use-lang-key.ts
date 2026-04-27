"use client";

import { useLocale } from "next-intl";
import { getLangKey, type LangKey } from "./lang";

/** Active UI language key for bilingual copy from `getStatusLabel`, etc. */
export function useLangKey(): LangKey {
  return getLangKey(useLocale());
}
