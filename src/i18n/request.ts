import { getRequestConfig } from "next-intl/server";
import arMessages from "../../messages/ar.json";
import enMessages from "../../messages/en.json";
import { routing } from "./routing";

const messagesByLocale = {
  ar: arMessages,
  en: enMessages,
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as "ar" | "en")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: messagesByLocale[locale as keyof typeof messagesByLocale],
  };
});
