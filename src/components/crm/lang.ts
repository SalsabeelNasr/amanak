export type LangKey = "ar" | "en";

export function getLangKey(locale: string): LangKey {
  return locale === "ar" ? "ar" : "en";
}
