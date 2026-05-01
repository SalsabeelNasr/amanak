"use client";

import { useLocale } from "next-intl";
import { Toaster } from "sonner";

export function AppToaster() {
  const locale = useLocale();
  return (
    <Toaster
      dir={locale === "ar" ? "rtl" : "ltr"}
      richColors
      closeButton
      position="top-center"
      toastOptions={{ classNames: { toast: "amanak-app-surface-card border-border shadow-md" } }}
    />
  );
}
